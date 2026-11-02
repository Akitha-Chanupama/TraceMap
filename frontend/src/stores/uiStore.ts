import { create } from 'zustand';

export type FontSize = 'compact' | 'normal' | 'medium' | 'large' | 'xlarge';

export const FONT_SIZES_ORDER: FontSize[] = ['compact', 'normal', 'medium', 'large', 'xlarge'];

export const FONT_SIZE_CONFIG: Record<
  FontSize,
  { label: string; basePx: string; codePx: number; desc: string }
> = {
  compact: { label: 'Compact', basePx: '13.5px', codePx: 12, desc: 'High-density compact layout' },
  normal: { label: 'Normal', basePx: '15px', codePx: 13.5, desc: 'Standard UI font size' },
  medium: { label: 'Medium', basePx: '16.5px', codePx: 15, desc: 'Comfortable readable size (Default)' },
  large: { label: 'Large', basePx: '18px', codePx: 16.5, desc: 'Larger text for high-res displays' },
  xlarge: { label: 'Extra Large', basePx: '19.5px', codePx: 18, desc: 'Maximum legibility and large text' },
};

export function applyHtmlFontSize(size: FontSize) {
  if (typeof document !== 'undefined') {
    const config = FONT_SIZE_CONFIG[size] || FONT_SIZE_CONFIG.medium;
    document.documentElement.style.fontSize = config.basePx;
    document.documentElement.setAttribute('data-font-size', size);
    try {
      localStorage.setItem('tracemap_font_size', size);
    } catch {
      // Ignore storage errors in test or restricted environments
    }
  }
}

const getInitialFontSize = (): FontSize => {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('tracemap_font_size') as FontSize;
      if (stored && FONT_SIZE_CONFIG[stored]) {
        return stored;
      }
    } catch {
      // fallback
    }
  }
  return 'medium';
};

const initialFontSize = getInitialFontSize();
if (typeof document !== 'undefined') {
  applyHtmlFontSize(initialFontSize);
}

interface UiState {
  sidebarOpen: boolean;
  activeInspectorFileId: string | null;
  sourceViewerOpen: boolean;
  fontSize: FontSize;
  openSourceViewer: (fileId: string) => void;
  closeSourceViewer: () => void;
  toggleSidebar: () => void;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeInspectorFileId: null,
  sourceViewerOpen: false,
  fontSize: initialFontSize,
  openSourceViewer: (fileId) => set({ activeInspectorFileId: fileId, sourceViewerOpen: true }),
  closeSourceViewer: () => set({ sourceViewerOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setFontSize: (fontSize) => {
    applyHtmlFontSize(fontSize);
    set({ fontSize });
  },
  increaseFontSize: () =>
    set((state) => {
      const idx = FONT_SIZES_ORDER.indexOf(state.fontSize);
      if (idx < FONT_SIZES_ORDER.length - 1) {
        const next = FONT_SIZES_ORDER[idx + 1];
        applyHtmlFontSize(next);
        return { fontSize: next };
      }
      return {};
    }),
  decreaseFontSize: () =>
    set((state) => {
      const idx = FONT_SIZES_ORDER.indexOf(state.fontSize);
      if (idx > 0) {
        const prev = FONT_SIZES_ORDER[idx - 1];
        applyHtmlFontSize(prev);
        return { fontSize: prev };
      }
      return {};
    }),
}));
