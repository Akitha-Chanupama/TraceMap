import { request } from './api';
import { GraphDataResponse } from '../types/graph';

export const graphApi = {
  getGraph: (
    projectId: string,
    params: {
      type?: string;
      language?: string;
      directory?: string;
      search?: string;
      max_nodes?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.language) query.set('language', params.language);
    if (params.directory) query.set('directory', params.directory);
    if (params.search) query.set('search', params.search);
    if (params.max_nodes) query.set('max_nodes', params.max_nodes.toString());
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<GraphDataResponse>(`/projects/${projectId}/graph${qStr}`);
  },

  getNodeNeighbors: (projectId: string, nodeId: string) =>
    request<{
      incoming: Array<{ file: string; statement?: string }>;
      outgoing: Array<{ file: string; statement?: string }>;
    }>(`/projects/${projectId}/graph/neighbors/${nodeId}`),
};

