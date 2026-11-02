export interface FileItem {
  id: string;
  project_id: string;
  relative_path: string;
  absolute_path: string;
  filename: string;
  extension: string;
  language: string;
  file_size: number;
  content_hash: string;
  line_count: number;
  parse_status: string;
  parse_error?: string;
  last_modified: string;
  last_analyzed_at?: string;
  symbols_count: number;
  dependencies_count: number;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'directory' | 'file';
  extension?: string;
  language?: string;
  size?: number;
  file_id?: string;
  has_cycles?: boolean;
  children?: FileTreeNode[];
}

export interface SourceCodeResponse {
  file_id: string;
  filename: string;
  relative_path: string;
  language: string;
  content: string;
  line_count: number;
  symbols: Array<{
    id: string;
    name: string;
    type: string;
    start_line: number;
    end_line: number;
    complexity: number;
  }>;
  imports: Array<{
    id: string;
    statement: string;
    line: number;
    status: string;
    external_package?: string;
  }>;
  exports: Array<any>;
}

