import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FindingAction(Base):
    __tablename__ = "finding_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id: Mapped[str] = mapped_column(String(36), ForeignKey("findings.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    finding: Mapped["Finding"] = relationship(back_populates="actions")
    user: Mapped["User"] = relationship(back_populates="finding_actions")

    __table_args__ = (
        CheckConstraint("action_type IN ('dismiss', 'mark_false_positive', 'apply_patch', 'comment')", name="ck_finding_actions_action_type"),
    )