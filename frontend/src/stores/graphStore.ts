import { create } from 'zustand';
import { GraphNode } from '../types/graph';
import { GitHotspotItem } from '../types/analysis';

export type GraphMode =
  | 'file_dependency'
  | 'module_architecture'
  | 'symbol_explorer'
  | 'dependencies'
  | 'impact';

export type GraphLayout = 'hierarchical_tb' | 'hierarchical_lr' | 'force' | 'radial' | 'clustered';

interface GraphState {
  graphMode: GraphMode;
  layout: GraphLayout;
  selectedNode: GraphNode | null;
  highlightedCycleIds: string[];
  filterLanguage: string | null;
  filterDirectory: string | null;
  searchQuery: string;
  maxNodes: number;
  hotspotOverlay: boolean;
  hotspotsMap: Record<string, GitHotspotItem>;
  setGraphMode: (mode: GraphMode) => void;
  setLayout: (layout: GraphLayout) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setHighlightedCycleIds: (ids: string[]) => void;
  setFilterLanguage: (lang: string | null) => void;
  setFilterDirectory: (dir: string | null) => void;
  setSearchQuery: (query: string) => void;
  setMaxNodes: (max: number) => void;
  toggleHotspotOverlay: () => void;
  setHotspotsMap: (map: Record<string, GitHotspotItem>) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graphMode: 'file_dependency',
  layout: 'hierarchical_tb',
  selectedNode: null,
  highlightedCycleIds: [],
  filterLanguage: null,
  filterDirectory: null,
  searchQuery: '',
  maxNodes: 300,
  hotspotOverlay: false,
  hotspotsMap: {},
  setGraphMode: (graphMode) => set({ graphMode }),
  setLayout: (layout) => set({ layout }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setHighlightedCycleIds: (highlightedCycleIds) => set({ highlightedCycleIds }),
  setFilterLanguage: (filterLanguage) => set({ filterLanguage }),
  setFilterDirectory: (filterDirectory) => set({ filterDirectory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setMaxNodes: (maxNodes) => set({ maxNodes }),
  toggleHotspotOverlay: () => set((state) => ({ hotspotOverlay: !state.hotspotOverlay })),
  setHotspotsMap: (hotspotsMap) => set({ hotspotsMap }),
}));

