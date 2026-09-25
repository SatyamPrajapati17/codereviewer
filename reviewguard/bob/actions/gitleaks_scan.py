import subprocess
import json
import tempfile
import os
from typing import List, Dict
from pathlib import Path


def gitleaks_scan(diff_content: str, hunks: List[Dict], repo_root: str = ".") -> List[Dict]:
    """Run gitleaks on changed content and return secret matches."""
    matches = []
    
    # Group hunks by file
    files_to_scan = {}
    for hunk in hunks:
        file_path = hunk["file_path"]
        if file_path not in files_to_scan:
            files_to_scan[file_path] = []
        files_to_scan[file_path].extend(hunk["lines"])
    
    # For each file, scan for secrets
    for file_path in files_to_scan.keys():
        full_path = Path(repo_root) / file_path
        if full_path.exists():
            file_matches = run_gitleaks_on_file(str(full_path))
            for match in file_matches:
                # Filter to changed line ranges
                start_line = match.get("startLine", 0)
                for hunk in hunks:
                    if hunk["file_path"] == file_path:
                        hunk_start = min(l["target_line_no"] for l in hunk["lines"] if l["target_line_no"])
                        hunk_end = max(l["target_line_no"] for l in hunk["lines"] if l["target_line_no"])
                        if hunk_start <= start_line <= hunk_end:
                            matches.append({
                                "file": file_path,
                                "line": start_line,
                                "pattern": match.get("ruleId", ""),
                                "entropy": match.get("entropy", 0),
                                "secret_type": match.get("type", ""),
                                "match": match.get("match", "")[:50]  # Truncate for safety
                            })
                            break
    
    return matches


def run_gitleaks_on_file(file_path: str) -> List[Dict]:
    """Run gitleaks on a single file."""
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        report_path = f.name
    
    try:
        result = subprocess.run(
            ["gitleaks", "detect", "--source", file_path, "--report-format", "json", "--report-path", report_path, "--no-banner"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode in (0, 1):
            if os.path.exists(report_path):
                with open(report_path) as f:
                    data = json.load(f)
                return data
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        pass
    finally:
        if os.path.exists(report_path):
            os.unlink(report_path)
    
    return []