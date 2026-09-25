from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    diff_content: Optional[str] = None
    pr_url: Optional[str] = None
    repository_full_name: str
    source_branch: Optional[str] = None
    target_branch: Optional[str] = None
    trigger_type: str = "manual_diff"


class ReviewResponse(BaseModel):
    id: str
    repository_id: str
    trigger_type: str
    pr_url: Optional[str] = None
    source_branch: Optional[str] = None
    target_branch: Optional[str] = None
    diff_hash: str
    status: str
    overall_verdict: Optional[str] = None
    lines_added: Optional[int] = None
    lines_removed: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FindingResponse(BaseModel):
    id: str
    review_id: str
    subagent_run_id: str
    category: str
    severity: str
    cwe_ref: Optional[str] = None
    file_path: str
    line_start: int
    line_end: int
    explanation: str
    confidence: float
    is_duplicate_of: bool
    duplicate_of_finding_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PatchResponse(BaseModel):
    id: str
    finding_id: str
    diff_content: str
    status: str
    tests_passed: Optional[bool] = None
    generated_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TestResultResponse(BaseModel):
    id: str
    patch_id: str
    test_command: str
    tests_passed: int
    tests_failed: int
    failure_detail: Optional[str] = None
    run_at: datetime

    class Config:
        from_attributes = True


class ReviewDetailResponse(ReviewResponse):
    findings: list[FindingResponse] = []