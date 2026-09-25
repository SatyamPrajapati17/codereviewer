import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RulesConfig(Base):
    __tablename__ = "rules_config"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: Mapped[str] = mapped_column(String(36), ForeignKey("repositories.id"), unique=True, nullable=False)
    category_toggles: Mapped[dict] = mapped_column(JSONB, nullable=False, default={"security": True, "correctness": True, "performance": True, "testing": True, "maintainability": True})
    blocking_severity_threshold: Mapped[str] = mapped_column(String, nullable=False, default="high")
    ignored_paths: Mapped[list] = mapped_column(JSONB, nullable=False, default=[])
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    repository: Mapped["Repository"] = relationship(back_populates="rules_config")