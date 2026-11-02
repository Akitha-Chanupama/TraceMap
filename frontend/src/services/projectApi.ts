import { request } from './api';
import { Project } from '../types/project';

export const projectApi = {
  listProjects: () => request<Project[]>('/projects'),

  openProject: (root_path: string, name?: string) =>
    request<Project>('/projects/open', {
      method: 'POST',
      body: JSON.stringify({ root_path, name }),
    }),

  selectFolder: () =>
    request<{ selected_path: string | null; error?: string }>('/projects/select-folder', {
      method: 'POST',
    }),

  browseFilesystem: (path?: string) =>
    request<{
      current_path: string;
      parent_path: string | null;
      directories: Array<{ name: string; path: string }>;
      drives: string[];
      quick_locations: Array<{ name: string; path: string }>;
    }>(`/projects/browse-filesystem${path ? `?path=${encodeURIComponent(path)}` : ''}`),

  getProject: (projectId: string) => request<Project>(`/projects/${projectId}`),

  updateProject: (projectId: string, name: string) =>
    request<Project>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteProject: (projectId: string) =>
    request<{ message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    }),

  triggerAnalysis: (projectId: string) =>
    request<{ message: string; status: string }>(`/projects/${projectId}/analyze`, {
      method: 'POST',
    }),

  triggerRefresh: (projectId: string) =>
    request<{ message: string; status: string }>(`/projects/${projectId}/refresh`, {
      method: 'POST',
    }),

  getProjectStatus: (projectId: string) =>
    request<{
      project_id: string;
      status: string;
      last_analyzed_at?: string;
      latest_run?: any;
    }>(`/projects/${projectId}/status`),
};

