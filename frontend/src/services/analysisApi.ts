import { request } from './api';
import {
  CircularDependenciesResponse,
  ImpactAnalysisResponse,
  ComplexityReportResponse,
  UnresolvedDependencyItem,
  UnusedSymbolItem,
} from '../types/analysis';
import { ProjectSummary } from '../types/project';

export const analysisApi = {
  getSummary: (projectId: string) => request<ProjectSummary>(`/projects/${projectId}/analysis/summary`),

  getCircularDependencies: (projectId: string) =>
    request<CircularDependenciesResponse>(`/projects/${projectId}/analysis/circular-dependencies`),

  getImpactAnalysis: (projectId: string, nodeId: string) =>
    request<ImpactAnalysisResponse>(`/projects/${projectId}/analysis/impact/${nodeId}`),

  getComplexity: (projectId: string) =>
    request<ComplexityReportResponse>(`/projects/${projectId}/analysis/complexity`),

  getUnresolvedDependencies: (projectId: string) =>
    request<UnresolvedDependencyItem[]>(`/projects/${projectId}/analysis/unresolved-dependencies`),

  getUnusedSymbols: (projectId: string) =>
    request<UnusedSymbolItem[]>(`/projects/${projectId}/analysis/unused-symbols`),
};
