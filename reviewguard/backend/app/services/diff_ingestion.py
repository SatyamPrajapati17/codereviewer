import hashlib
import unidiff
import re
from typing import Optional
from dataclasses import dataclass


@dataclass
class ParsedDiff:
    files_changed: int
    lines_added: int
    lines_removed: int
    hunks: list[dict]
    diff_hash: str


def split_multi_file_diff(diff_content: str) -> list[str]:
    """Split a multi-file unified diff into individual file diffs."""
    diff_header_pattern = r'^diff --git a/'
    
    headers = [(m.start(), m.group()) for m in re.finditer(diff_header_pattern, diff_content, re.MULTILINE)]
    
    if len(headers) <= 1:
        return [diff_content]
    
    diffs = []
    for i, (start, _) in enumerate(headers):
        end = headers[i + 1][0] if i + 1 < len(headers) else len(diff_content)
        diffs.append(diff_content[start:end].strip())
    
    return diffs


def parse_diff(diff_content: str) -> ParsedDiff:
    """Parse a unified diff (single or multi-file) into structured hunks."""
    # Handle both str and bytes
    if isinstance(diff_content, bytes):
        # Try to decode with common encodings
        for encoding in ['utf-8', 'utf-16', 'latin-1']:
            try:
                diff_content = diff_content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
    
    file_diffs = split_multi_file_diff(diff_content)
    
    all_hunks = []
    total_files = 0
    total_added = 0
    total_removed = 0
    
    for file_diff in file_diffs:
        try:
            patch_set = unidiff.PatchSet(file_diff)
            total_files += len(patch_set)
            total_added += sum(pf.added for pf in patch_set)
            total_removed += sum(pf.removed for pf in patch_set)
            
            for pf in patch_set:
                for hunk in pf:
                    all_hunks.append({
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
        except Exception:
            # If parsing fails for a file, skip it
            continue
    
    diff_hash = hashlib.sha256(diff_content.encode() if isinstance(diff_content, str) else diff_content).hexdigest()[:16]
    
    return ParsedDiff(
        files_changed=total_files,
        lines_added=total_added,
        lines_removed=total_removed,
        hunks=all_hunks,
        diff_hash=diff_hash
    )