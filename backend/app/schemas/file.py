from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class FileResponse(BaseModel):
    id: str
    project_id: str
    relative_path: str
    absolute_path: str
    filename: str
    extension: str
    language: str
    file_size: int
    content_hash: str
    line_count: int
    parse_status: str
    parse_error: Optional[str] = None
    last_modified: datetime
    last_analyzed_at: Optional[datetime] = None
    symbols_count: int = 0
    dependencies_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class FileTreeNode(BaseModel):
    id: str
    name: str
    path: str
    type: str  # "directory" | "file"
    extension: Optional[str] = None
    language: Optional[str] = None
    size: Optional[int] = None
    file_id: Optional[str] = None
    has_cycles: Optional[bool] = False
    children: Optional[List["FileTreeNode"]] = None


class SourceCodeResponse(BaseModel):
    file_id: str
    filename: str
    relative_path: str
    language: str
    content: str
    line_count: int
    symbols: List[Dict[str, Any]] = []
    imports: List[Dict[str, Any]] = []
    exports: List[Dict[str, Any]] = []
