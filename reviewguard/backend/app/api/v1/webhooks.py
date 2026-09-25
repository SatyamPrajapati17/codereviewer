from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.security import verify_github_webhook, verify_gitlab_webhook
from app.core.config import get_settings
from app.models.repository import Repository
from app.models.review import Review
from app.services.diff_ingestion import parse_diff

router = APIRouter(prefix="/v1/webhooks", tags=["webhooks"])


@router.post("/github")
async def github_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    await verify_github_webhook(request, settings.GITHUB_WEBHOOK_SECRET)
    
    payload = await request.json()
    
    if payload.get("action") not in ("opened", "synchronize", "reopened"):
        return {"status": "ignored"}
    
    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})
    
    repo_result = await db.execute(
        select(Repository).where(Repository.external_repo_id == str(repo.get("id")))
    )
    repository = repo_result.scalar_one_or_none()
    
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not connected")
    
    diff_url = pr.get("diff_url")
    # In real implementation, fetch diff from diff_url
    # For M1 stub, we'll just create a placeholder review
    
    review = Review(
        repository_id=repository.id,
        trigger_type="webhook",
        pr_url=pr.get("html_url"),
        source_branch=pr.get("head", {}).get("ref"),
        target_branch=pr.get("base", {}).get("ref"),
        diff_hash="webhook_placeholder",
        status="pending",
    )
    db.add(review)
    await db.commit()
    
    return {"status": "accepted", "review_id": str(review.id)}


@router.post("/gitlab")
async def gitlab_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    await verify_gitlab_webhook(request, settings.GITLAB_WEBHOOK_SECRET)
    
    payload = await request.json()
    
    if payload.get("object_kind") != "merge_request":
        return {"status": "ignored"}
    
    mr = payload.get("object_attributes", {})
    repo = payload.get("project", {})
    
    if mr.get("action") not in ("open", "update", "reopen"):
        return {"status": "ignored"}
    
    repo_result = await db.execute(
        select(Repository).where(Repository.external_repo_id == str(repo.get("id")))
    )
    repository = repo_result.scalar_one_or_none()
    
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not connected")
    
    review = Review(
        repository_id=repository.id,
        trigger_type="webhook",
        pr_url=mr.get("url"),
        source_branch=mr.get("source_branch"),
        target_branch=mr.get("target_branch"),
        diff_hash="webhook_placeholder",
        status="pending",
    )
    db.add(review)
    await db.commit()
    
    return {"status": "accepted", "review_id": str(review.id)}