import { request } from './api';
import { FileItem, FileTreeNode, SourceCodeResponse } from '../types/file';

export const fileApi = {
  listFiles: (
    projectId: string,
    params: { search?: string; language?: string; directory?: string; page?: number; page_size?: number } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.language) query.set('language', params.language);
    if (params.directory) query.set('directory', params.directory);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return request<FileItem[]>(`/projects/${projectId}/files${qStr}`);
  },

  getFileTree: (projectId: string) => request<FileTreeNode>(`/projects/${projectId}/files/tree`),

  getFileSource: (projectId: string, fileId: string) =>
    request<SourceCodeResponse>(`/projects/${projectId}/files/${fileId}/source`),
};

