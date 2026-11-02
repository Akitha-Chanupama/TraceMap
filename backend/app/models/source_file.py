import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class SourceFile(Base):
    __tablename__ = "source_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    relative_path = Column(String(1024), nullable=False)
    absolute_path = Column(String(1024), nullable=False)
    filename = Column(String(255), nullable=False, index=True)
    extension = Column(String(50), nullable=False)
    language = Column(String(50), nullable=False, index=True)
    file_size = Column(Integer, default=0)
    content_hash = Column(String(64), nullable=False)
    line_count = Column(Integer, default=0)
    parse_status = Column(String(50), default="pending")  # pending, success, error, skipped
    parse_error = Column(String(2048), nullable=True)
    last_modified = Column(DateTime, nullable=False)
    last_analyzed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("project_id", "relative_path", name="uix_project_relative_path"),
    )

    # Relationships
    project = relationship("Project", back_populates="files")
    symbols = relationship("Symbol", back_populates="source_file", cascade="all, delete-orphan")
    outgoing_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.source_file_id",
        back_populates="source_file",
        cascade="all, delete-orphan",
    )
    incoming_dependencies = relationship(
        "Dependency",
        foreign_keys="Dependency.target_file_id",
        back_populates="target_file",
    )

