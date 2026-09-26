"""
Bob Workflow Orchestrator for ReviewGuard.

This module bridges the FastAPI backend with the IBM Bob workflow.
It executes the deterministic steps and dispatches AI subagents.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.review import Review
from app.models.subagent_run import SubagentRun
from app.models.finding import Finding
from app.models.patch import Patch
from app.models.test_result import TestResult
from app.services.diff_ingestion import parse_diff, ParsedDiff
from app.bob.actions.semgrep_scan import semgrep_scan
from app.bob.actions.gitleaks_scan import gitleaks_scan
from app.bob.actions.aggregate_findings import dedupe_and_rank
from app.bob.actions.render_report import render_report


def get_line_number(line: Dict) -> int:
    """Get the correct line number from a diff line based on line type.
    For added lines (+): use target_line_no
    For removed lines (-): use source_line_no
    For context lines ( ): use target_line_no (or source_line_no)
    """
    line_type = line.get("line_type", " ")
    if line_type == "+":
        return line.get("target_line_no") or 0
    elif line_type == "-":
        return line.get("source_line_no") or 0
    else:
        return line.get("target_line_no") or line.get("source_line_no") or 0


@dataclass
class SubagentFinding:
    category: str
    severity: str
    cwe_ref: Optional[str]
    file_path: str
    line_start: int
    line_end: int
    explanation: str
    confidence: float
    test_skeleton: Optional[str] = None
    refactor_suggestion: Optional[str] = None


async def run_review_workflow(review_id: str, diff_content: str, repo_root: str = ".") -> Dict[str, Any]:
    """
    Execute the full ReviewGuard workflow for a review.
    
    Steps:
    1. Parse diff
    2. Deterministic pre-pass (Semgrep + Gitleaks)
    3. Dispatch 5 parallel review subagents
    4. Aggregate & deduplicate findings
    5. Generate patches for Medium+ findings
    6. Test patches in sandbox
    7. Render final report
    """
    async for db in get_db():
        review = await db.get(Review, review_id)
        if not review:
            raise ValueError(f"Review {review_id} not found")
        
        try:
            # Step 1: Parse diff (already done at intake, but re-parse for context)
            parsed = parse_diff(diff_content)
            
            # Update review with parsed info
            review.lines_added = parsed.lines_added
            review.lines_removed = parsed.lines_removed
            review.status = "running"
            review.started_at = datetime.utcnow()
            await db.commit()
            
            # Step 2: Deterministic pre-pass
            pre_pass_results = await run_pre_pass(diff_content, parsed.hunks, repo_root)
            
            # Step 3: Dispatch 5 parallel review subagents
            subagent_findings = await dispatch_review_subagents(
                db, review_id, diff_content, parsed.hunks, pre_pass_results, repo_root
            )
            
            # Step 4: Aggregate & deduplicate
            all_findings = []
            for findings in subagent_findings.values():
                for f in findings:
                    all_findings.append({
                        "category": f.category,
                        "severity": f.severity,
                        "cwe_ref": f.cwe_ref,
                        "file_path": f.file_path,
                        "line_start": f.line_start,
                        "line_end": f.line_end,
                        "explanation": f.explanation,
                        "confidence": f.confidence,
                        "test_skeleton": f.test_skeleton,
                        "refactor_suggestion": f.refactor_suggestion
                    })
            
            deduplicated = dedupe_and_rank(all_findings)
            
            # Step 5: Save findings to DB
            await save_findings(db, review_id, deduplicated)
            
            # Step 6: Generate patches for Medium+ findings
            patches = await generate_patches(db, review_id, deduplicated, diff_content, repo_root)
            
            # Step 7: Test patches
            test_results = await test_patches(db, review_id, patches, repo_root)
            
            # Step 8: Update review status
            review.status = "completed"
            review.completed_at = datetime.utcnow()
            review.overall_verdict = calculate_verdict(deduplicated)
            await db.commit()
            
            # Step 9: Render report
            report = render_report(
                review={
                    "id": review.id,
                    "pr_url": review.pr_url,
                    "lines_added": review.lines_added,
                    "lines_removed": review.lines_removed,
                },
                findings=deduplicated,
                patches={p["file_path"]: p["diff"] for p in patches},
                test_results=test_results
            )
            
            return {
                "review_id": review_id,
                "status": "completed",
                "findings_count": len(deduplicated),
                "patches_generated": len(patches),
                "report": report
            }
            
        except Exception as e:
            review.status = "failed"
            review.completed_at = datetime.utcnow()
            await db.commit()
            raise


async def run_pre_pass(diff_content: str, hunks: List[Dict], repo_root: str) -> Dict[str, List[Dict]]:
    """Run Semgrep and Gitleaks pre-pass scans."""
    semgrep_results = semgrep_scan(diff_content, hunks, repo_root)
    gitleaks_results = gitleaks_scan(diff_content, hunks, repo_root)
    
    return {
        "semgrep": semgrep_results,
        "gitleaks": gitleaks_results
    }


async def dispatch_review_subagents(
    db: AsyncSession,
    review_id: str,
    diff_content: str,
    hunks: List[Dict],
    pre_pass: Dict[str, List[Dict]],
    repo_root: str
) -> Dict[str, List[SubagentFinding]]:
    """
    Dispatch 5 review subagents in parallel.
    
    In a real Bob workflow, this would use Bob's native parallel tool calling.
    For now, we simulate with asyncio.gather calling the subagent prompts.
    """
    
    # Create subagent run records
    agent_types = ["security", "correctness", "performance", "testing", "maintainability"]
    subagent_runs = {}
    
    for agent_type in agent_types:
        run = SubagentRun(
            review_id=review_id,
            agent_type=agent_type,
            status="running",
            started_at=datetime.utcnow()
        )
        db.add(run)
        await db.flush()
        subagent_runs[agent_type] = run
    
    await db.commit()
    
    # Dispatch subagents in parallel (simulated)
    tasks = {
        "security": run_security_subagent(diff_content, hunks, pre_pass, repo_root),
        "correctness": run_correctness_subagent(diff_content, hunks, repo_root),
        "performance": run_performance_subagent(diff_content, hunks, repo_root),
        "testing": run_testing_subagent(diff_content, hunks, repo_root),
        "maintainability": run_maintainability_subagent(diff_content, hunks, repo_root),
    }
    
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    
    # Update subagent runs with results
    subagent_findings = {}
    for agent_type, result in zip(tasks.keys(), results):
        run = subagent_runs[agent_type]
        run.completed_at = datetime.utcnow()
        run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
        
        if isinstance(result, Exception):
            run.status = "error"
            run.findings_count = 0
            subagent_findings[agent_type] = []
        else:
            run.status = "completed"
            run.findings_count = len(result)
            subagent_findings[agent_type] = result
        
        await db.commit()
    
    return subagent_findings


async def run_security_subagent(diff_content: str, hunks: List[Dict], pre_pass: Dict, repo_root: str) -> List[SubagentFinding]:
    """Security Reviewer subagent - finds secrets, injection, auth issues, crypto issues."""
    findings = []
    
    # Use pre-pass results as hints
    semgrep_results = pre_pass.get("semgrep", [])
    gitleaks_results = pre_pass.get("gitleaks", [])
    
    # Check for hardcoded secrets (from Gitleaks)
    for leak in gitleaks_results:
        findings.append(SubagentFinding(
            category="security",
            severity="critical" if "key" in leak.get("pattern", "").lower() or "secret" in leak.get("pattern", "").lower() else "high",
            cwe_ref="CWE-798",
            file_path=leak["file"],
            line_start=leak["line"],
            line_end=leak["line"],
            explanation=f"Hardcoded secret detected: {leak.get('pattern', 'credential')} at line {leak['line']}. Move to environment variable.",
            confidence=0.95
        ))
    
    # Check for SQL injection (from Semgrep)
    for match in semgrep_results:
        if "sql" in match.get("rule_id", "").lower() or "injection" in match.get("message", "").lower():
            findings.append(SubagentFinding(
                category="security",
                severity="critical",
                cwe_ref="CWE-89",
                file_path=match["file"],
                line_start=match["line"],
                line_end=match["line"],
                explanation=f"SQL injection vulnerability: {match['message']}. Use parameterized queries.",
                confidence=0.9
            ))
    
    # Direct detection: hardcoded secrets (API keys, tokens, passwords)
    import re
    secret_patterns = [
        (r'(?i)(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*["\'][^"\']{20,}["\']', "API key/token"),
        (r'(?i)(aws[_-]?secret[_-]?key|aws[_-]?access[_-]?key)\s*[:=]\s*["\'][^"\']+["\']', "AWS credentials"),
        (r'(?i)password\s*[:=]\s*["\'][^"\']+["\']', "Password"),
        (r'AKIA[0-9A-Z]{16}', "AWS Access Key"),
        (r'sk_live_[0-9a-zA-Z]{24,}', "Stripe Secret Key"),
        (r'ghp_[0-9a-zA-Z]{36}', "GitHub Personal Access Token"),
    ]
    
    # Also check for generic KEY = "value" patterns in config-like files
    generic_secret_pattern = r'(?i)(\w*(?:secret|key|token|password)\w*)\s*=\s*["\'][^"\']{10,}["\']'
    
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            line_no = get_line_number(line)
            
            # Direct secret detection
            for pattern, secret_type in secret_patterns:
                if re.search(pattern, content):
                    findings.append(SubagentFinding(
                        category="security",
                        severity="critical",
                        cwe_ref="CWE-798",
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Hardcoded {secret_type} detected at line {line_no}. Move to environment variable.",
                        confidence=0.9
                    ))
            
            # Generic secret detection
            if re.search(generic_secret_pattern, content):
                findings.append(SubagentFinding(
                    category="security",
                    severity="critical",
                    cwe_ref="CWE-798",
                    file_path=hunk["file_path"],
                    line_start=line_no,
                    line_end=line_no,
                    explanation=f"Hardcoded secret/key detected at line {line_no}. Move to environment variable.",
                    confidence=0.85
                ))
            
            # Direct SQL injection detection
            if re.search(r'f["\'].*\{.*\}.*["\']', content) and any(kw in content.lower() for kw in ['select', 'insert', 'update', 'delete', 'execute', 'query']):
                findings.append(SubagentFinding(
                    category="security",
                    severity="critical",
                    cwe_ref="CWE-89",
                    file_path=hunk["file_path"],
                    line_start=line_no,
                    line_end=line_no,
                    explanation=f"Potential SQL injection: f-string used in query. Use parameterized queries.",
                    confidence=0.85
                ))
            
            # Direct insecure deserialization detection
            if any(pattern in content for pattern in ["pickle.loads", "yaml.load(", "eval("]):
                findings.append(SubagentFinding(
                    category="security",
                    severity="high",
                    cwe_ref="CWE-502",
                    file_path=hunk["file_path"],
                    line_start=line_no,
                    line_end=line_no,
                    explanation=f"Insecure deserialization: {content.strip()[:50]}. Avoid deserializing untrusted data.",
                    confidence=0.85
                ))
    
    # Check for command injection
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            if any(pattern in content for pattern in ["subprocess.run", "os.system", "shell=True", "eval(", "exec("]):
                if any(user_input in content for user_input in ["request.", "input(", "sys.argv", "os.getenv"]):
                    findings.append(SubagentFinding(
                        category="security",
                        severity="high",
                        cwe_ref="CWE-78",
                        file_path=hunk["file_path"],
                        line_start=get_line_number(line),
                        line_end=get_line_number(line),
                        explanation=f"Potential command injection: user input passed to shell command without sanitization.",
                        confidence=0.75
                    ))
    
    # Check for insecure deserialization (from pre-pass or direct)
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            if any(pattern in content for pattern in ["pickle.loads", "yaml.load(", "eval(", "json.loads"]):
                if "request." in content or "input(" in content:
                    findings.append(SubagentFinding(
                        category="security",
                        severity="high",
                        cwe_ref="CWE-502",
                        file_path=hunk["file_path"],
                        line_start=get_line_number(line),
                        line_end=get_line_number(line),
                        explanation=f"Insecure deserialization: untrusted input passed to {content.strip()[:50]}.",
                        confidence=0.8
                    ))
    
    # Use pre-pass results as hints (additional)
    for leak in pre_pass.get("gitleaks", []):
        findings.append(SubagentFinding(
            category="security",
            severity="critical" if "key" in leak.get("pattern", "").lower() or "secret" in leak.get("pattern", "").lower() else "high",
            cwe_ref="CWE-798",
            file_path=leak["file"],
            line_start=leak["line"],
            line_end=leak["line"],
            explanation=f"Hardcoded secret detected: {leak.get('pattern', 'credential')} at line {leak['line']}. Move to environment variable.",
            confidence=0.95
        ))
    
    # Check for SQL injection (from Semgrep)
    for match in pre_pass.get("semgrep", []):
        if "sql" in match.get("rule_id", "").lower() or "injection" in match.get("message", "").lower():
            findings.append(SubagentFinding(
                category="security",
                severity="critical",
                cwe_ref="CWE-89",
                file_path=match["file"],
                line_start=match["line"],
                line_end=match["line"],
                explanation=f"SQL injection vulnerability: {match['message']}. Use parameterized queries.",
                confidence=0.9
            ))
    
    # Check for command injection
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            if any(pattern in content for pattern in ["subprocess.run", "os.system", "shell=True", "eval(", "exec("]):
                if any(user_input in content for user_input in ["request.", "input(", "sys.argv", "os.getenv"]):
                    findings.append(SubagentFinding(
                        category="security",
                        severity="high",
                        cwe_ref="CWE-78",
                        file_path=hunk["file_path"],
                        line_start=get_line_number(line),
                        line_end=get_line_number(line),
                        explanation=f"Potential command injection: user input passed to shell command without sanitization.",
                        confidence=0.75
                    ))
    
    # Check for insecure deserialization (from pre-pass)
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            if any(pattern in content for pattern in ["pickle.loads", "yaml.load(", "eval(", "json.loads"]):
                if "request." in content or "input(" in content:
                    findings.append(SubagentFinding(
                        category="security",
                        severity="high",
                        cwe_ref="CWE-502",
                        file_path=hunk["file_path"],
                        line_start=get_line_number(line),
                        line_end=get_line_number(line),
                        explanation=f"Insecure deserialization: untrusted input passed to {content.strip()[:50]}.",
                        confidence=0.8
                    ))
    
    return findings


async def run_correctness_subagent(diff_content: str, hunks: List[Dict], repo_root: str) -> List[SubagentFinding]:
    """Correctness Reviewer subagent - finds logic bugs, null derefs, exception handling."""
    findings = []
    
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            line_no = get_line_number(line)
            
            # Bare except/catch
            if "except:" in content or "except Exception:" in content:
                if "pass" in content or "raise" not in content:
                    findings.append(SubagentFinding(
                        category="correctness",
                        severity="high",
                        cwe_ref="CWE-396",
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Bare 'except:' clause swallows all exceptions without handling or re-raising. Add specific exception types and proper handling.",
                        confidence=0.9
                    ))
            
            # Missing null check before attribute access
            if "." in content and any(pattern in content for pattern in [".id", ".name", ".value", ".data", ".get("]):
                if not any(check in content for check in ["if ", "is not None", "and ", "?.", "getattr"]):
                    findings.append(SubagentFinding(
                        category="correctness",
                        severity="medium",
                        cwe_ref="CWE-476",
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Potential null/undefined dereference: attribute access on possibly None object. Add null check.",
                        confidence=0.65
                    ))
            
            # Off-by-one in loops
            if "range(len(" in content and "- 1" not in content and "+ 1" not in content:
                if "<=" in content or ">=" in content:
                    findings.append(SubagentFinding(
                        category="correctness",
                        severity="medium",
                        cwe_ref="CWE-193",
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Possible off-by-one error in loop bounds. Check range boundaries.",
                        confidence=0.6
                    ))
    
    return findings


async def run_performance_subagent(diff_content: str, hunks: List[Dict], repo_root: str) -> List[SubagentFinding]:
    """Performance Reviewer subagent - finds O(n²), N+1, redundant computation."""
    findings = []
    
    # Track loops per file
    file_loops = {}
    
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            line_no = get_line_number(line)
            
            # Nested loops detection
            if "for " in content and " in " in content:
                file_loops.setdefault(hunk["file_path"], []).append((line_no, content))
            
            # N+1 query pattern
            if "query" in content.lower() or "select" in content.lower() or "execute" in content.lower():
                if "for " in content or "while " in content:
                    findings.append(SubagentFinding(
                        category="performance",
                        severity="medium",
                        cwe_ref=None,
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Potential N+1 query: database query inside loop. Batch queries or use eager loading.",
                        confidence=0.75
                    ))
            
            # Redundant computation in loop
            if "for " in content:
                if any(method in content for method in [".count()", "len(", "sum(", "max(", "min("]):
                    findings.append(SubagentFinding(
                        category="performance",
                        severity="low",
                        cwe_ref=None,
                        file_path=hunk["file_path"],
                        line_start=line_no,
                        line_end=line_no,
                        explanation=f"Potential redundant computation in loop: {content.strip()[:50]}. Move invariant computation outside loop.",
                        confidence=0.6
                    ))
    
    # Check for O(n²) nested loops
    for file_path, loops in file_loops.items():
        if len(loops) >= 2:
            for i, (line1, content1) in enumerate(loops):
                for line2, content2 in loops[i+1:]:
                    if line1 is not None and line2 is not None and line1 < line2 and abs(line1 - line2) < 20:  # Nested within ~20 lines
                        findings.append(SubagentFinding(
                            category="performance",
                            severity="medium",
                            cwe_ref=None,
                            file_path=file_path,
                            line_start=line1,
                            line_end=line2,
                            explanation=f"Nested loops detected (O(n²) complexity). Consider using dict/set for O(1) lookups instead of nested iteration.",
                            confidence=0.7
                        ))
                        break
    
    return findings


async def run_testing_subagent(diff_content: str, hunks: List[Dict], repo_root: str) -> List[SubagentFinding]:
    """Testing Reviewer subagent - finds missing tests on public/critical functions."""
    findings = []
    
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            line_no = get_line_number(line)
            
            # Detect function definitions
            if content.strip().startswith("def ") or content.strip().startswith("async def "):
                # Extract function name
                import re
                match = re.search(r"def\s+(\w+)", content)
                if match:
                    func_name = match.group(1)
                    
                    # Check if it's a public/critical function
                    is_critical = any(keyword in func_name.lower() for keyword in 
                        ["payment", "auth", "password", "token", "transaction", "refund", "charge", "transfer", "process", "calculate"])
                    is_public = not func_name.startswith("_")
                    
                    if is_public or is_critical:
                        findings.append(SubagentFinding(
                            category="testing",
                            severity="medium" if is_critical else "low",
                            cwe_ref=None,
                            file_path=hunk["file_path"],
                            line_start=line_no,
                            line_end=line_no + 5,  # Approximate
                            explanation=f"Function '{func_name}' {'(critical path)' if is_critical else ''} has no test coverage. Add tests for success, error, and edge cases.",
                            confidence=0.85,
                            test_skeleton=f"def test_{func_name}_success():\n    # Arrange\n    # Act\n    # Assert\n\ndef test_{func_name}_error_case():\n    # Test error handling\n\ndef test_{func_name}_edge_cases():\n    # Test boundary conditions"
                        ))
    
    return findings


async def run_maintainability_subagent(diff_content: str, hunks: List[Dict], repo_root: str) -> List[SubagentFinding]:
    """Maintainability Reviewer subagent - finds duplicates, large functions, naming issues."""
    findings = []
    
    # Track function sizes
    function_sizes = {}
    
    for hunk in hunks:
        for line in hunk["lines"]:
            content = line["content"]
            line_no = get_line_number(line)
            
            # Function definition tracking
            if content.strip().startswith("def ") or content.strip().startswith("async def "):
                import re
                match = re.search(r"def\s+(\w+)", content)
                if match:
                    func_name = match.group(1)
                    function_sizes.setdefault(hunk["file_path"], {})[func_name] = {"start": line_no, "lines": 1}
            
            # Count lines in function
            for file_path, funcs in function_sizes.items():
                for func_name, info in funcs.items():
                    if info.get("start") is not None and line_no >= info["start"]:
                        info["lines"] += 1
            
            # Naming issues
            if "def " in content:
                import re
                match = re.search(r"def\s+(\w+)", content)
                if match:
                    func_name = match.group(1)
                    if len(func_name) <= 2 and func_name not in ["id", "ok", "to", "do"]:
                        findings.append(SubagentFinding(
                            category="maintainability",
                            severity="info",
                            cwe_ref=None,
                            file_path=hunk["file_path"],
                            line_start=line_no,
                            line_end=line_no,
                            explanation=f"Unclear function name '{func_name}'. Use descriptive names.",
                            confidence=0.7
                        ))
    
    # Report oversized functions
    for file_path, funcs in function_sizes.items():
        for func_name, info in funcs.items():
            if info.get("lines", 0) > 50 and info.get("start") is not None:
                findings.append(SubagentFinding(
                    category="maintainability",
                    severity="low",
                    cwe_ref=None,
                    file_path=file_path,
                    line_start=info["start"],
                    line_end=info["start"] + info["lines"],
                    explanation=f"Function '{func_name}' is {info['lines']} lines (exceeds 50). Consider extracting helper functions.",
                    confidence=0.85,
                    refactor_suggestion=f"Extract logical blocks from '{func_name}' into separate functions"
                ))
    
    return findings


async def save_findings(db: AsyncSession, review_id: str, findings: List[Dict]) -> None:
    """Save deduplicated findings to database."""
    for finding_data in findings:
        # Find the subagent run that generated this category
        result = await db.execute(
            select(SubagentRun).where(
                SubagentRun.review_id == review_id,
                SubagentRun.agent_type == finding_data["category"]
            )
        )
        subagent_run = result.scalar_one_or_none()
        
        line_start = finding_data.get("line_start") or 0
        line_end = finding_data.get("line_end") or 0
        
        finding = Finding(
            review_id=review_id,
            subagent_run_id=subagent_run.id if subagent_run else None,
            category=finding_data["category"],
            severity=finding_data["severity"],
            cwe_ref=finding_data.get("cwe_ref"),
            file_path=finding_data["file_path"],
            line_start=line_start,
            line_end=line_end,
            explanation=finding_data["explanation"],
            confidence=finding_data["confidence"],
            status="open"
        )
        db.add(finding)
    
    await db.commit()


async def generate_patches(db: AsyncSession, review_id: str, findings: List[Dict], diff_content: str, repo_root: str) -> List[Dict]:
    """Generate patches for Medium+ severity findings."""
    patches = []
    
    for finding_data in findings:
        if finding_data["severity"] in ("critical", "high", "medium"):
            line_start = finding_data.get("line_start") or 0
            line_end = finding_data.get("line_end") or 0
            if line_start <= 0:
                continue
            patch_diff = await generate_patch_for_finding(finding_data, repo_root)
            if patch_diff:
                # Save patch to DB
                result = await db.execute(
                    select(Finding).where(
                        Finding.review_id == review_id,
                        Finding.file_path == finding_data["file_path"],
                        Finding.line_start == finding_data.get("line_start", 0)
                    )
                )
                finding = result.scalar_one_or_none()
                
                if finding:
                    patch = Patch(
                        finding_id=finding.id,
                        diff_content=patch_diff,
                        status="suggested",
                        generated_at=datetime.utcnow()
                    )
                    db.add(patch)
                    await db.commit()
                    
                    patches.append({
                        "finding_id": finding.id,
                        "file_path": finding_data["file_path"],
                        "diff": patch_diff
                    })
    
    return patches


async def generate_patch_for_finding(finding: Dict, repo_root: str) -> Optional[str]:
    """Generate a minimal unified diff patch for a finding."""
    from pathlib import Path
    
    file_path = Path(repo_root) / finding["file_path"]
    if not file_path.exists():
        return None
    
    line_start = finding.get("line_start")
    if not line_start or line_start <= 0:
        return None
    
    content = file_path.read_text()
    lines = content.splitlines()
    line_idx = line_start - 1
    
    if line_idx >= len(lines):
        return None
    
    original_line = lines[line_idx]
    fixed_line = apply_fix(original_line, finding)
    
    if fixed_line == original_line:
        return None
    
    # Create unified diff
    context = 3
    start = max(0, line_idx - context)
    end = min(len(lines), line_idx + context + 1)
    
    diff_lines = [
        f"--- a/{finding['file_path']}",
        f"+++ b/{finding['file_path']}",
        f"@@ -{start+1},{end-start} +{start+1},{end-start} @@"
    ]
    
    for i in range(start, end):
        if i == line_idx:
            diff_lines.append(f"-{lines[i]}")
            diff_lines.append(f"+{fixed_line}")
        else:
            diff_lines.append(f" {lines[i]}")
    
    return "\n".join(diff_lines)


def apply_fix(line: str, finding: Dict) -> str:
    """Apply a fix based on finding category and explanation."""
    category = finding.get("category", "")
    explanation = finding.get("explanation", "").lower()
    
    if category == "security":
        if "hardcoded secret" in explanation or "credential" in explanation or "api key" in explanation or "aws" in explanation:
            # Replace with os.getenv()
            import re
            match = re.search(r'(\w+)\s*=\s*["\'][^"\']+["\']', line)
            if match:
                var_name = match.group(1)
                return line.replace(match.group(0), f'{var_name} = os.getenv("{var_name.upper()}")')
        elif "sql injection" in explanation:
            # Parameterize query - replace f-string with parameterized query
            import re
            # f"SELECT ... {var} ..." -> "SELECT ... %s ..."
            line = re.sub(r'f(["\'])(.*?)\1', r'\1\2\1', line)  # Remove f prefix
            line = re.sub(r'\{([^}]+)\}', '%s', line)  # Replace {var} with %s
            return line
    
    elif category == "correctness":
        if "bare" in explanation and "except" in explanation:
            if "except:" in line:
                return line.replace("except:", "except Exception:")
            elif "except Exception:" in line and "pass" in line:
                # Already has Exception, but might be bare pass
                pass
        elif "null" in explanation or "undefined" in explanation or "dereference" in explanation:
            # Add null check - this is complex, just return original for now
            pass
    
    elif category == "performance":
        # Performance fixes are usually refactoring, not single-line
        pass
    
    return line


async def test_patches(db: AsyncSession, review_id: str, patches: List[Dict], repo_root: str) -> Dict[str, Dict]:
    """Test each patch in sandbox and record results."""
    test_results = {}
    
    for patch in patches:
        finding_id = patch["finding_id"]
        
        # Get the patch from DB
        result = await db.execute(select(Patch).where(Patch.finding_id == finding_id))
        patch_obj = result.scalar_one_or_none()
        
        if not patch_obj:
            continue
        
        # Apply patch in sandbox (simulated)
        success, passed, failed, failure_detail = apply_and_test_patch(patch_obj.diff_content, repo_root)
        
        # Update patch status
        patch_obj.status = "verified" if success else "failed"
        patch_obj.tests_passed = success
        patch_obj.applied_at = datetime.utcnow() if success else None
        
        # Save test result
        test_result = TestResult(
            patch_id=patch_obj.id,
            test_command="pytest -q",
            tests_passed=passed,
            tests_failed=failed,
            failure_detail=failure_detail,
            run_at=datetime.utcnow()
        )
        db.add(test_result)
        
        # Update finding status
        finding_result = await db.execute(select(Finding).where(Finding.id == finding_id))
        finding_obj = finding_result.scalar_one_or_none()
        if finding_obj:
            finding_obj.status = "verified" if success else "patched"
        
        await db.commit()
        
        test_results[finding_id] = {
            "tests_passed": passed,
            "tests_failed": failed,
            "failure_detail": failure_detail,
            "patch_applied_cleanly": success
        }
    
    return test_results


def apply_and_test_patch(patch_diff: str, repo_root: str) -> tuple:
    """Apply patch and run tests in sandbox."""
    import subprocess
    import tempfile
    import shutil
    from pathlib import Path
    
    # Create sandbox
    with tempfile.TemporaryDirectory() as tmpdir:
        sandbox = Path(tmpdir) / "sandbox"
        shutil.copytree(repo_root, sandbox)
        
        # Write patch file
        patch_file = Path(tmpdir) / "patch.diff"
        patch_file.write_text(patch_diff)
        
        # Apply patch
        try:
            result = subprocess.run(
                ["git", "apply", "--check", str(patch_file)],
                cwd=sandbox,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                return False, 0, 0, f"Patch does not apply cleanly: {result.stderr}"
            
            result = subprocess.run(
                ["git", "apply", str(patch_file)],
                cwd=sandbox,
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                return False, 0, 0, f"Patch apply failed: {result.stderr}"
        except Exception as e:
            return False, 0, 0, f"Error applying patch: {e}"
        
        # Run tests
        try:
            result = subprocess.run(
                ["pytest", "-q", "--tb=short"],
                cwd=sandbox,
                capture_output=True,
                text=True,
                timeout=60
            )
            # Parse pytest output
            output = result.stdout + result.stderr
            passed = 0
            failed = 0
            for line in output.splitlines():
                if "passed" in line and "failed" in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == "passed" and i > 0:
                            passed = int(parts[i-1])
                        if part == "failed" and i > 0:
                            failed = int(parts[i-1])
            
            return result.returncode == 0, passed, failed, output if result.returncode != 0 else None
        except subprocess.TimeoutExpired:
            return False, 0, 0, "Test timeout (60s)"
        except Exception as e:
            return False, 0, 0, f"Test error: {e}"


def calculate_verdict(findings: List[Dict]) -> str:
    """Calculate overall verdict from findings."""
    critical_high = sum(1 for f in findings if f["severity"] in ("critical", "high"))
    if critical_high > 0:
        return "blocked"
    if any(f["severity"] == "medium" for f in findings):
        return "needs_attention"
    return "passed"