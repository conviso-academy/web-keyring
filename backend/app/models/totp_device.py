import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, LargeBinary, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

class TOTPDevice(Base):
    __tablename__ = "totp_devices"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    encrypted_secret: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, server_default=text("false"), nullable=False
    )
    encrypted_backup_codes: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="totp_device")
