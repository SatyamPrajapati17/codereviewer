import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patch_id: Mapped[str] = mapped_column(String(36), ForeignKey("patches.id"), nullable=False)
    test_command: Mapped[str] = mapped_column(String, nullable=False)
    tests_passed: Mapped[int] = mapped_column(Integer)
    tests_failed: Mapped[int] = mapped_column(Integer)
    failure_detail: Mapped[str | None] = mapped_column(Text)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patch: Mapped["Patch"] = relationship(back_populates="test_results")