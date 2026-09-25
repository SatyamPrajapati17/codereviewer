import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: Mapped[str] = mapped_column(String(36), ForeignKey("repositories.id"), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String, nullable=False)
    pr_url: Mapped[str | None] = mapped_column(String)
    source_branch: Mapped[str | None] = mapped_column(String)
    target_branch: Mapped[str | None] = mapped_column(String)
    diff_hash: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    overall_verdict: Mapped[str | None] = mapped_column(String)
    lines_added: Mapped[int | None] = mapped_column(Integer)
    lines_removed: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    repository: Mapped["Repository"] = relationship(back_populates="reviews")
    subagent_runs: Mapped[list["SubagentRun"]] = relationship(back_populates="review")
    findings: Mapped[list["Finding"]] = relationship(back_populates="review")

    __table_args__ = (
        CheckConstraint("trigger_type IN ('webhook', 'manual_diff', 'cli')", name="ck_reviews_trigger_type"),
        CheckConstraint("status IN ('pending', 'running', 'completed', 'failed')", name="ck_reviews_status"),
        CheckConstraint("overall_verdict IN ('passed', 'blocked', 'needs_attention')", name="ck_reviews_verdict"),
        Index("idx_reviews_repo_diff_hash", "repository_id", "diff_hash", unique=True),
    )