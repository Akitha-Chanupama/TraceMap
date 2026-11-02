from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CycleParticipant(BaseModel):
    file_id: str
    relative_path: str
    imports_next: Optional[str] = None


class CircularDependencyCycle(BaseModel):
    cycle_id: str
    length: int
    severity: str  # low, medium, high
    participants: List[CycleParticipant]
    paths: List[str]


class CircularDependenciesResponse(BaseModel):
    total_cycles: int
    cycles: List[CircularDependencyCycle]


class ImpactNode(BaseModel):
    file_id: str
    relative_path: str
    depth: int
    via_import: Optional[str] = None


class ImpactAnalysisResponse(BaseModel):
    root_node_id: str
    root_label: str
    root_relative_path: str
    direct_dependants: List[ImpactNode]
    transitive_dependants: List[ImpactNode]
    total_affected_files: int
    max_depth: int
    explanation: str


class ComplexityItem(BaseModel):
    file_id: str
    relative_path: str
    language: str
    lines_of_code: int
    function_count: int
    class_count: int
    cyclomatic_complexity: int
    fan_in: int
    fan_out: int
    warnings: List[str] = []


class ComplexityReportResponse(BaseModel):
    total_lines_of_code: int
    average_complexity: float
    high_complexity_files: List[ComplexityItem]
    metrics_by_file: List[ComplexityItem]


class UnusedSymbolItem(BaseModel):
    symbol_id: str
    name: str
    symbol_type: str
    relative_path: str
    line_number: int
    confidence: float
    reason: str


class UnresolvedDependencyItem(BaseModel):
    source_file_id: str
    source_relative_path: str
    import_statement: str
    line_number: Optional[int] = None
    target_specifier: str
    possible_reason: str


class AnalysisSummaryResponse(BaseModel):
    project_id: str
    total_files: int
    total_lines: int
    total_symbols: int
    total_dependencies: int
    circular_cycles_count: int
    unresolved_dependencies_count: int
    potential_unused_symbols_count: int
    language_breakdown: Dict[str, int]
    top_connected_files: List[Dict[str, Any]]
    largest_files: List[Dict[str, Any]]

