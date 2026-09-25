import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean, Numeric, CheckConstraint, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id"), nullable=False)
    subagent_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("subagent_runs.id"), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    cwe_ref: Mapped[str | None] = mapped_column(String)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    line_start: Mapped[int] = mapped_column(Integer, nullable=False)
    line_end: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False)
    is_duplicate_of: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duplicate_of_finding_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("findings.id"))
    status: Mapped[str] = mapped_column(String, nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    review: Mapped["Review"] = relationship(back_populates="findings")
    subagent_run: Mapped["SubagentRun"] = relationship(back_populates="findings")
    patch: Mapped["Patch | None"] = relationship(back_populates="finding", uselist=False)
    duplicate_of: Mapped["Finding | None"] = relationship(remote_side=[id], backref="duplicates")
    actions: Mapped[list["FindingAction"]] = relationship(back_populates="finding")

    __table_args__ = (
        CheckConstraint("category IN ('security', 'correctness', 'performance', 'testing', 'maintainability')", name="ck_findings_category"),
        CheckConstraint("severity IN ('critical', 'high', 'medium', 'low', 'info')", name="ck_findings_severity"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_findings_confidence"),
        CheckConstraint("status IN ('open', 'patched', 'verified', 'dismissed', 'false_positive')", name="ck_findings_status"),
        Index("idx_findings_review_severity", "review_id", "severity"),
    )