from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class ProjectCreate(BaseModel):
    root_path: str = Field(..., description="Absolute path to the local project root directory")
    name: Optional[str] = Field(None, description="Optional custom display name for the project")


class ProjectUpdate(BaseModel):
    name: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    root_path: str
    project_type: Optional[str] = "unknown"
    detected_languages: Dict[str, Any] = Field(default_factory=dict)
    configuration: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    last_analyzed_at: Optional[datetime] = None
    analysis_status: str

    model_config = ConfigDict(from_attributes=True)


class ProjectSummary(BaseModel):
    id: str
    name: str
    root_path: str
    project_type: str
    total_files: int = 0
    total_lines: int = 0
    total_symbols: int = 0
    total_dependencies: int = 0
    circular_dependency_count: int = 0
    unresolved_dependency_count: int = 0
    detected_languages: Dict[str, int] = Field(default_factory=dict)
    last_analyzed_at: Optional[datetime] = None
    analysis_status: str
