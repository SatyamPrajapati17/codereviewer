import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Patch(Base):
    __tablename__ = "patches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_id: Mapped[str] = mapped_column(String(36), ForeignKey("findings.id"), unique=True, nullable=False)
    diff_content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="suggested")
    tests_passed: Mapped[bool | None] = mapped_column(Boolean)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    finding: Mapped["Finding"] = relationship(back_populates="patch")
    test_results: Mapped[list["TestResult"]] = relationship(back_populates="patch")

    __table_args__ = (
        CheckConstraint("status IN ('suggested', 'applied', 'verified', 'failed')", name="ck_patches_status"),
    )