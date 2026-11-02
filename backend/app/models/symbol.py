import uuid
from sqlalchemy import Column, String, Integer, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Symbol(Base):
    __tablename__ = "symbols"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("source_files.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_symbol_id = Column(String(36), ForeignKey("symbols.id", ondelete="CASCADE"), nullable=True)
    
    name = Column(String(255), nullable=False, index=True)
    qualified_name = Column(String(512), nullable=False, index=True)
    symbol_type = Column(String(50), nullable=False)  # class, function, method, interface, enum, type_alias, variable, component
    language = Column(String(50), nullable=False)
    
    start_line = Column(Integer, nullable=False)
    end_line = Column(Integer, nullable=False)
    start_column = Column(Integer, nullable=False)
    end_column = Column(Integer, nullable=False)
    
    is_exported = Column(Boolean, default=False)
    visibility = Column(String(50), default="public")  # public, private, protected
    complexity = Column(Integer, default=1)
    metadata_json = Column(JSON, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="symbols")
    source_file = relationship("SourceFile", back_populates="symbols")
    children = relationship("Symbol", backref="parent", remote_side=[id])
