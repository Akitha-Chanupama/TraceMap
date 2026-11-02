export interface GraphNodeData {
  [key: string]: any;
  label: string;
  entity_type: 'project' | 'directory' | 'file' | 'module' | 'class' | 'function' | 'interface' | 'component' | 'external_package';
  language?: string;
  file_id?: string;
  symbol_id?: string;
  relative_path?: string;
  incoming_count?: number;
  outgoing_count?: number;
  complexity?: number;
  has_cycle?: boolean;
  is_external?: boolean;
  metrics?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  type?: string;
  data: GraphNodeData;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  data?: Record<string, any>;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
  };
}
