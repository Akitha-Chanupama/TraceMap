export interface Project {
  id: string;
  name: string;
  root_path: string;
  project_type: string;
  detected_languages: Record<string, any>;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
  analysis_status: 'idle' | 'scanning' | 'parsing' | 'resolving' | 'completed' | 'failed';
}

export interface ProjectSummary {
  project_id: string;
  total_files: number;
  total_lines: number;
  total_symbols: number;
  total_dependencies: number;
  circular_cycles_count: number;
  unresolved_dependencies_count: number;
  potential_unused_symbols_count: number;
  language_breakdown: Record<string, number>;
  top_connected_files: Array<{ file: string; connections: number }>;
  largest_files: Array<{ file: string; lines: number; language: string }>;
}
