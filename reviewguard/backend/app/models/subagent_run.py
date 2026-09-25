import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SubagentRun(Base):
    __tablename__ = "subagent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id"), nullable=False)
    agent_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    findings_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    review: Mapped["Review"] = relationship(back_populates="subagent_runs")
    findings: Mapped[list["Finding"]] = relationship(back_populates="subagent_run")

    __table_args__ = (
        CheckConstraint(
            "agent_type IN ('security', 'correctness', 'performance', 'testing', 'maintainability', 'patch_generator', 'test_runner')",
            name="ck_subagent_runs_agent_type",
        ),
        CheckConstraint("status IN ('queued', 'running', 'completed', 'timed_out', 'error')", name="ck_subagent_runs_status"),
        Index("idx_subagent_runs_review_id", "review_id"),
    )