from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class DependencyResponse(BaseModel):
    id: str
    project_id: str
    source_file_id: str
    target_file_id: Optional[str] = None
    external_package: Optional[str] = None
    source_symbol_id: Optional[str] = None
    target_symbol_id: Optional[str] = None
    dependency_type: str
    import_statement: Optional[str] = None
    line_number: Optional[int] = None
    resolution_status: str
    confidence: float
    metadata_json: Optional[Dict[str, Any]] = None
    source_file_path: Optional[str] = None
    target_file_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

