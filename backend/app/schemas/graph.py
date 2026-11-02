from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class GraphNodeData(BaseModel):
    label: str
    entity_type: str  # project, directory, file, module, class, function, interface, component, external_package
    language: Optional[str] = None
    file_id: Optional[str] = None
    symbol_id: Optional[str] = None
    relative_path: Optional[str] = None
    incoming_count: int = 0
    outgoing_count: int = 0
    complexity: Optional[int] = None
    has_cycle: bool = False
    is_external: bool = False
    metrics: Dict[str, Any] = Field(default_factory=dict)


class GraphNode(BaseModel):
    id: str
    type: str = "custom"  # React Flow node type
    data: GraphNodeData
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str = "smoothstep"
    label: Optional[str] = None
    animated: bool = False
    data: Dict[str, Any] = Field(default_factory=dict)


class GraphDataResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: Dict[str, Any] = Field(default_factory=dict)

