from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.models.review import Review
from app.models.finding import Finding
from app.models.patch import Patch
from app.models.subagent_run import SubagentRun
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewDetailResponse
from app.services.diff_ingestion import parse_diff
from app.workers.bob_orchestrator import run_review_workflow

router = APIRouter(prefix="/v1/reviews", tags=["reviews"])

DEFAULT_REPO_ID = "default-repo-00000000-0000-0001"


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new review from a diff or PR URL and start the review workflow."""
    diff_content = review_data.diff_content
    
    if not diff_content:
        raise HTTPException(status_code=400, detail="diff_content is required for manual_diff trigger")
    
    parsed = parse_diff(diff_content)
    
    existing = await db.execute(
        select(Review).where(
            Review.repository_id == DEFAULT_REPO_ID,
            Review.diff_hash == parsed.diff_hash
        )
    )
    existing_review = existing.scalar_one_or_none()
    if existing_review:
        return existing_review
    
    review = Review(
        repository_id=DEFAULT_REPO_ID,
        trigger_type=review_data.trigger_type,
        pr_url=review_data.pr_url,
        source_branch=review_data.source_branch,
        target_branch=review_data.target_branch,
        diff_hash=parsed.diff_hash,
        status="pending",
        overall_verdict=None,
        lines_added=parsed.lines_added,
        lines_removed=parsed.lines_removed,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    
    # Run workflow in background
    background_tasks.add_task(run_review_workflow, review.id, diff_content)
    
    return review


@router.get("/{review_id}", response_model=ReviewDetailResponse)
async def get_review(review_id: str, db: AsyncSession = Depends(get_db)):
    """Get a review with all its findings."""
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    findings_result = await db.execute(
        select(Finding).where(Finding.review_id == review_id).order_by(Finding.severity.desc())
    )
    findings = findings_result.scalars().all()
    
    return ReviewDetailResponse(
        id=review.id,
        repository_id=review.repository_id,
        trigger_type=review.trigger_type,
        pr_url=review.pr_url,
        source_branch=review.source_branch,
        target_branch=review.target_branch,
        diff_hash=review.diff_hash,
        status=review.status,
        overall_verdict=review.overall_verdict,
        lines_added=review.lines_added,
        lines_removed=review.lines_removed,
        started_at=review.started_at,
        completed_at=review.completed_at,
        findings=findings
    )


@router.get("", response_model=list[ReviewResponse])
async def list_reviews(
    repository_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List reviews with optional filters."""
    query = select(Review)
    
    if repository_id:
        query = query.where(Review.repository_id == repository_id)
    if status:
        query = query.where(Review.status == status)
    
    query = query.order_by(Review.started_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    return result.scalars().all()