import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import AuditAction

class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=func.gen_random_uuid()
    )
    secret_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("secrets.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction, native_enum=True), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)

    user: Mapped["User"] = relationship()
    secret: Mapped[Optional["Secret"]] = relationship(back_populates="audit_entries")

    __table_args__ = (
        Index("ix_audit_log_user_id_timestamp", "user_id", "timestamp"),
    )
