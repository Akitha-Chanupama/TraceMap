import { create } from 'zustand';
import { Project, ProjectSummary } from '../types/project';

interface ProjectState {
  currentProject: Project | null;
  projectsList: Project[];
  projectSummary: ProjectSummary | null;
  analysisProgress: {
    isAnalyzing: boolean;
    phase: string;
    current: number;
    total: number;
  };
  setCurrentProject: (project: Project | null) => void;
  setProjectsList: (projects: Project[]) => void;
  setProjectSummary: (summary: ProjectSummary | null) => void;
  setAnalysisProgress: (progress: Partial<ProjectState['analysisProgress']>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projectsList: [],
  projectSummary: null,
  analysisProgress: {
    isAnalyzing: false,
    phase: 'idle',
    current: 0,
    total: 0,
  },
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjectsList: (projectsList) => set({ projectsList }),
  setProjectSummary: (projectSummary) => set({ projectSummary }),
  setAnalysisProgress: (progress) =>
    set((state) => ({
      analysisProgress: { ...state.analysisProgress, ...progress },
    })),
}));
