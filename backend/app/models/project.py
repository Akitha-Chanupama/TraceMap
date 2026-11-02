import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    root_path = Column(String(1024), nullable=False, unique=True, index=True)
    project_type = Column(String(100), nullable=True, default="unknown")
    detected_languages = Column(JSON, nullable=True, default=dict)
    configuration = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    last_analyzed_at = Column(DateTime, nullable=True)
    analysis_status = Column(String(50), default="idle")

    # Relationships
    files = relationship("SourceFile", back_populates="project", cascade="all, delete-orphan")
    symbols = relationship("Symbol", back_populates="project", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="project", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="project", cascade="all, delete-orphan")
    graph_snapshots = relationship("GraphSnapshot", back_populates="project", cascade="all, delete-orphan")
