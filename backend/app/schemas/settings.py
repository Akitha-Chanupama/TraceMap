from typing import Dict, Any, List
from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    default_graph_layout: str = "hierarchical_tb"
    default_graph_mode: str = "file_dependency"
    ignored_directories: List[str] = Field(default_factory=list)
    maximum_graph_nodes: int = 500
    theme_preference: str = "dark"
    auto_file_watching: bool = True
    max_file_size_bytes: int = 2 * 1024 * 1024


class SettingsUpdate(BaseModel):
    default_graph_layout: str | None = None
    default_graph_mode: str | None = None
    ignored_directories: List[str] | None = None
    maximum_graph_nodes: int | None = None
    theme_preference: str | None = None
    auto_file_watching: bool | None = None
    max_file_size_bytes: int | None = None

