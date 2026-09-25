from typing import List, Dict, Any
from collections import defaultdict


def dedupe_and_rank(all_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate findings by (file_path, line_range_overlap, category).
    Cross-category merging: only merge if same category AND overlapping lines.
    Keep highest severity, preserve all rationales.
    """
    # Group by file_path and category
    groups = defaultdict(list)
    for f in all_findings:
        key = (f["file_path"], f["category"])
        groups[key].append(f)
    
    deduplicated = []
    
    for (file_path, category), findings in groups.items():
        if len(findings) == 1:
            deduplicated.append(findings[0])
            continue
        
        # Sort by line_start for consistent merging
        findings.sort(key=lambda f: f.get("line_start") or 0)
        
        merged = []
        for f in findings:
            merged_with = False
            for m in merged:
                if lines_overlap(f, m):
                    # Merge: keep higher severity, combine rationales
                    if severity_rank(f["severity"]) > severity_rank(m["severity"]):
                        m["severity"] = f["severity"]
                    m.setdefault("rationales", []).append({
                        "category": f["category"],
                        "explanation": f["explanation"],
                        "confidence": f["confidence"]
                    })
                    merged_with = True
                    break
            if not merged_with:
                f["rationales"] = [{
                    "category": f["category"],
                    "explanation": f["explanation"],
                    "confidence": f["confidence"]
                }]
                merged.append(f)
        
        deduplicated.extend(merged)
    
    # Sort by severity (critical first), then by file, then line
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    deduplicated.sort(key=lambda f: (
        severity_order.get(f["severity"], 5),
        f["file_path"],
        f.get("line_start") or 0
    ))
    
    return deduplicated


def lines_overlap(f1: Dict, f2: Dict) -> bool:
    """Check if two findings have overlapping line ranges."""
    ls1 = f1.get("line_start") or 0
    le1 = f1.get("line_end") or 0
    ls2 = f2.get("line_start") or 0
    le2 = f2.get("line_end") or 0
    # Consider adjacent lines (within 2 lines) as overlap for same-category
    return not (le1 < ls2 - 2 or le2 < ls1 - 2)


def severity_rank(severity: str) -> int:
    ranks = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
    return ranks.get(severity, 0)