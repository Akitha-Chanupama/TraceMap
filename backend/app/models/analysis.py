import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="pending")  # pending, running, completed, failed, cancelled
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    failed_files = Column(Integer, default=0)
    skipped_files = Column(Integer, default=0)
    analysis_duration_ms = Column(Integer, nullable=True)
    summary = Column(JSON, nullable=True)
    error_message = Column(String(2048), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="analysis_runs")


class GraphSnapshot(Base):
    __tablename__ = "graph_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_run_id = Column(String(36), ForeignKey("analysis_runs.id", ondelete="SET NULL"), nullable=True)
    graph_type = Column(String(50), nullable=False)
    graph_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    project = relationship("Project", back_populates="graph_snapshots")
