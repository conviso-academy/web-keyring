import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, LargeBinary, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

class SecretVersion(Base):
    __tablename__ = "secret_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=func.gen_random_uuid()
    )
    secret_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("secrets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    encrypted_value: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    secret: Mapped["Secret"] = relationship(back_populates="versions")
    creator: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("secret_id", "version_number", name="uq_secret_version"),
        Index("ix_secret_versions_secret_id_version", "secret_id", "version_number"),
    )
