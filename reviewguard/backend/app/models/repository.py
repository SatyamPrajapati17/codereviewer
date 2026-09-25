import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    external_repo_id: Mapped[str | None] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    default_branch: Mapped[str] = mapped_column(String, nullable=False, default="main")
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner: Mapped["User"] = relationship(back_populates="repositories")
    reviews: Mapped[list["Review"]] = relationship(back_populates="repository")
    rules_config: Mapped["RulesConfig | None"] = relationship(back_populates="repository", uselist=False)

    __table_args__ = (
        CheckConstraint("provider IN ('github', 'gitlab', 'local')", name="ck_repositories_provider"),
    )