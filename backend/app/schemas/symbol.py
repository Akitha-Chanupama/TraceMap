from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class SymbolResponse(BaseModel):
    id: str
    project_id: str
    file_id: str
    parent_symbol_id: Optional[str] = None
    name: str
    qualified_name: str
    symbol_type: str
    language: str
    start_line: int
    end_line: int
    start_column: int
    end_column: int
    is_exported: bool
    visibility: str
    complexity: int
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

