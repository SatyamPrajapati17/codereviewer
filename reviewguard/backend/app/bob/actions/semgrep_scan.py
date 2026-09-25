import subprocess
import json
import tempfile
import os
from typing import List, Dict
from pathlib import Path


def semgrep_scan(diff_content: str, hunks: List[Dict], repo_root: str = ".") -> List[Dict]:
    """Run semgrep on changed files and return matches relevant to the diff."""
    matches = []
    
    # Group hunks by file
    files_to_scan = {}
    for hunk in hunks:
        file_path = hunk["file_path"]
        if file_path not in files_to_scan:
            files_to_scan[file_path] = []
        files_to_scan[file_path].extend(hunk["lines"])
    
    # For each file, extract relevant lines and scan
    for file_path, lines in files_to_scan.items():
        full_path = Path(repo_root) / file_path
        if full_path.exists():
            file_matches = run_semgrep_on_file(str(full_path))
            for match in file_matches:
                # Filter to only matches in changed line ranges
                start_line = match.get("start", {}).get("line", 0)
                for hunk in hunks:
                    if hunk["file_path"] == file_path:
                        hunk_start = min(l["target_line_no"] for l in hunk["lines"] if l["target_line_no"])
                        hunk_end = max(l["target_line_no"] for l in hunk["lines"] if l["target_line_no"])
                        if hunk_start <= start_line <= hunk_end:
                            matches.append({
                                "file": file_path,
                                "line": start_line,
                                "rule_id": match.get("check_id", ""),
                                "message": match.get("extra", {}).get("message", ""),
                                "severity": match.get("extra", {}).get("severity", "WARNING"),
                                "code": match.get("extra", {}).get("lines", "")
                            })
                            break
    
    return matches


def run_semgrep_on_file(file_path: str) -> List[Dict]:
    """Run semgrep on a single file."""
    try:
        result = subprocess.run(
            ["semgrep", "scan", "--json", "--config=auto", file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode in (0, 1):
            data = json.loads(result.stdout)
            return data.get("results", [])
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        pass
    
    return []