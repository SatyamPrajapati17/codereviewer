from typing import List, Dict, Any
from collections import defaultdict


def dedupe_and_rank(all_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate findings by (file_path, line_range_overlap, category).
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
        
        # Check for line overlap
        merged = []
        for f in findings:
            merged_with = False
            for m in merged:
                if lines_overlap(f, m):
                    # Merge: keep higher severity, combine explanations
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
    
    # Sort by severity (critical first)
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    deduplicated.sort(key=lambda f: severity_order.get(f["severity"], 5))
    
    return deduplicated


def lines_overlap(f1: Dict, f2: Dict) -> bool:
    """Check if two findings have overlapping line ranges."""
    return not (f1["line_end"] < f2["line_start"] or f2["line_end"] < f1["line_start"])


def severity_rank(severity: str) -> int:
    ranks = {"critical": 5, "high": 4, "medium": 3, "low": 2, "info": 1}
    return ranks.get(severity, 0)