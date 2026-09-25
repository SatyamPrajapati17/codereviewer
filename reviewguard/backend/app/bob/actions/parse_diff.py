import unidiff
import hashlib
from typing import List, Dict


def parse_diff(diff_content: str) -> Dict:
    """Parse a unified diff into structured hunks with context."""
    patch_set = unidiff.PatchSet(diff_content)
    
    files_changed = len(patch_set)
    lines_added = sum(pf.added for pf in patch_set)
    lines_removed = sum(pf.removed for pf in patch_set)
    
    hunks = []
    for pf in patch_set:
        for hunk in pf:
            hunks.append({
                "file_path": pf.path,
                "source_start": hunk.source_start,
                "source_length": hunk.source_length,
                "target_start": hunk.target_start,
                "target_length": hunk.target_length,
                "lines": [
                    {
                        "line_type": line.line_type,
                        "content": line.value.rstrip('\n'),
                        "source_line_no": line.source_line_no,
                        "target_line_no": line.target_line_no
                    }
                    for line in hunk
                ]
            })
    
    diff_hash = hashlib.sha256(diff_content.encode()).hexdigest()[:16]
    
    return {
        "files_changed": files_changed,
        "lines_added": lines_added,
        "lines_removed": lines_removed,
        "hunks": hunks,
        "diff_hash": diff_hash,
        "raw_diff": diff_content
    }