import uuid
from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Dependency(Base):
    __tablename__ = "dependencies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source_file_id = Column(String(36), ForeignKey("source_files.id", ondelete="CASCADE"), nullable=False, index=True)
    target_file_id = Column(String(36), ForeignKey("source_files.id", ondelete="SET NULL"), nullable=True, index=True)
    
    external_package = Column(String(255), nullable=True, index=True)
    source_symbol_id = Column(String(36), ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True)
    target_symbol_id = Column(String(36), ForeignKey("symbols.id", ondelete="SET NULL"), nullable=True)
    
    dependency_type = Column(String(50), nullable=False)  # IMPORTS, EXPORTS, CALLS, EXTENDS, IMPLEMENTS, REFERENCES, CONTAINS
    import_statement = Column(String(1024), nullable=True)
    line_number = Column(Integer, nullable=True)
    resolution_status = Column(String(50), default="unresolved")  # resolved_internal, resolved_external, unresolved, builtin
    confidence = Column(Float, default=1.0)
    metadata_json = Column(JSON, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="dependencies")
    source_file = relationship("SourceFile", foreign_keys=[source_file_id], back_populates="outgoing_dependencies")
    target_file = relationship("SourceFile", foreign_keys=[target_file_id], back_populates="incoming_dependencies")
    source_symbol = relationship("Symbol", foreign_keys=[source_symbol_id])
    target_symbol = relationship("Symbol", foreign_keys=[target_symbol_id])
