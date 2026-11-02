import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  activeInspectorFileId: string | null;
  sourceViewerOpen: boolean;
  openSourceViewer: (fileId: string) => void;
  closeSourceViewer: () => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeInspectorFileId: null,
  sourceViewerOpen: false,
  openSourceViewer: (fileId) => set({ activeInspectorFileId: fileId, sourceViewerOpen: true }),
  closeSourceViewer: () => set({ sourceViewerOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
