import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import { Project } from '../types/project';

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: null,
      projectsList: [],
      projectSummary: null,
      analysisProgress: {
        isAnalyzing: false,
        phase: 'idle',
        current: 0,
        total: 0,
      },
    });
  });

  it('sets and clears current project', () => {
    const mockProj: Project = {
      id: 'proj-123',
      name: 'Test Project',
      root_path: 'D:/repos/test',
      project_type: 'typescript',
      detected_languages: { typescript: 1 },
      configuration: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      analysis_status: 'completed',
    };

    useProjectStore.getState().setCurrentProject(mockProj);
    expect(useProjectStore.getState().currentProject).toEqual(mockProj);

    useProjectStore.getState().setCurrentProject(null);
    expect(useProjectStore.getState().currentProject).toBeNull();
  });

  it('updates analysis progress partially', () => {
    useProjectStore.getState().setAnalysisProgress({
      isAnalyzing: true,
      phase: 'parsing',
      current: 5,
      total: 10,
    });

    const state = useProjectStore.getState().analysisProgress;
    expect(state.isAnalyzing).toBe(true);
    expect(state.phase).toBe('parsing');
    expect(state.current).toBe(5);
    expect(state.total).toBe(10);
  });
});
