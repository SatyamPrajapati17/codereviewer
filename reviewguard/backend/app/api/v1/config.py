from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.repository import Repository
from app.models.rules_config import RulesConfig

router = APIRouter(prefix="/v1/config", tags=["config"])


class RulesConfigUpdate(BaseModel):
    category_toggles: dict[str, bool] | None = None
    blocking_severity_threshold: str | None = None
    ignored_paths: list[str] | None = None


class RulesConfigResponse(BaseModel):
    id: str
    repository_id: str
    category_toggles: dict[str, bool]
    blocking_severity_threshold: str
    ignored_paths: list[str]
    updated_at: str | None = None

    class Config:
        from_attributes = True


@router.get("/rules/{repository_id}", response_model=RulesConfigResponse)
async def get_rules_config(repository_id: str, db: AsyncSession = Depends(get_db)):
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    result = await db.execute(
        select(RulesConfig).where(RulesConfig.repository_id == repository_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        config = RulesConfig(repository_id=repository_id)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    
    return config


@router.put("/rules/{repository_id}", response_model=RulesConfigResponse)
async def update_rules_config(
    repository_id: str,
    update: RulesConfigUpdate,
    db: AsyncSession = Depends(get_db)
):
    repo = await db.get(Repository, repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    result = await db.execute(
        select(RulesConfig).where(RulesConfig.repository_id == repository_id)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        config = RulesConfig(repository_id=repository_id)
        db.add(config)
    
    if update.category_toggles is not None:
        config.category_toggles = update.category_toggles
    if update.blocking_severity_threshold is not None:
        config.blocking_severity_threshold = update.blocking_severity_threshold
    if update.ignored_paths is not None:
        config.ignored_paths = update.ignored_paths
    
    await db.commit()
    await db.refresh(config)
    
    return config