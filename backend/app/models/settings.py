import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    settings_key = Column(String(100), unique=True, nullable=False, index=True)
    settings_value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
