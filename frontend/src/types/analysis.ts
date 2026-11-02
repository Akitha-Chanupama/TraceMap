export interface CycleParticipant {
  file_id: string;
  relative_path: string;
  imports_next?: string;
}

export interface CircularDependencyCycle {
  cycle_id: string;
  length: number;
  severity: 'low' | 'medium' | 'high';
  participants: CycleParticipant[];
  paths: string[];
}

export interface CircularDependenciesResponse {
  total_cycles: number;
  cycles: CircularDependencyCycle[];
}

export interface ImpactNode {
  file_id: string;
  relative_path: string;
  depth: number;
  via_import?: string;
}

export interface ImpactAnalysisResponse {
  root_node_id: string;
  root_label: string;
  root_relative_path: string;
  direct_dependants: ImpactNode[];
  transitive_dependants: ImpactNode[];
  total_affected_files: number;
  max_depth: number;
  explanation: string;
}

export interface ComplexityItem {
  file_id: string;
  relative_path: string;
  language: string;
  lines_of_code: number;
  function_count: number;
  class_count: number;
  cyclomatic_complexity: number;
  fan_in: number;
  fan_out: number;
  warnings: string[];
}

export interface ComplexityReportResponse {
  total_lines_of_code: number;
  average_complexity: number;
  high_complexity_files: ComplexityItem[];
  metrics_by_file: ComplexityItem[];
}

export interface UnresolvedDependencyItem {
  source_file_id: string;
  source_relative_path: string;
  import_statement: string;
  line_number?: number;
  target_specifier: string;
  possible_reason: string;
}

export interface UnusedSymbolItem {
  symbol_id: string;
  name: string;
  symbol_type: string;
  relative_path: string;
  line_number: number;
  confidence: number;
  reason: string;
}
