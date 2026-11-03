import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from './graphStore';
import { GraphNode } from '../types/graph';
import { GitHotspotItem } from '../types/analysis';

describe('useGraphStore', () => {
  beforeEach(() => {
    useGraphStore.setState({
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
    });
  });

  it('updates mode and layout', () => {
    useGraphStore.getState().setGraphMode('symbol_explorer');
    expect(useGraphStore.getState().graphMode).toBe('symbol_explorer');

    useGraphStore.getState().setLayout('force');
    expect(useGraphStore.getState().layout).toBe('force');
  });

  it('updates selected node and highlighted cycles', () => {
    const mockNode: GraphNode = {
      id: 'file_1',
      type: 'custom',
      position: { x: 10, y: 20 },
      data: {
        label: 'index.ts',
        entity_type: 'file',
        language: 'typescript',
        incoming_count: 2,
        outgoing_count: 3,
      },
    };

    useGraphStore.getState().setSelectedNode(mockNode);
    expect(useGraphStore.getState().selectedNode).toEqual(mockNode);

    useGraphStore.getState().setHighlightedCycleIds(['file_1', 'file_2']);
    expect(useGraphStore.getState().highlightedCycleIds).toEqual(['file_1', 'file_2']);
  });

  it('updates filters and query', () => {
    useGraphStore.getState().setFilterLanguage('python');
    useGraphStore.getState().setFilterDirectory('src/services');
    useGraphStore.getState().setSearchQuery('auth');

    expect(useGraphStore.getState().filterLanguage).toBe('python');
    expect(useGraphStore.getState().filterDirectory).toBe('src/services');
    expect(useGraphStore.getState().searchQuery).toBe('auth');
  });

  it('toggles hotspot overlay and updates hotspots map', () => {
    expect(useGraphStore.getState().hotspotOverlay).toBe(false);
    useGraphStore.getState().toggleHotspotOverlay();
    expect(useGraphStore.getState().hotspotOverlay).toBe(true);
    useGraphStore.getState().toggleHotspotOverlay();
    expect(useGraphStore.getState().hotspotOverlay).toBe(false);

    const mockHotspot: GitHotspotItem = {
      relative_path: 'backend/app/main.py',
      commit_count: 12,
      lines_added: 300,
      lines_deleted: 45,
      author_count: 2,
      churn_score: 85,
      complexity_lines: 150,
      hotspot_level: 'critical',
      risk_summary: 'Frequent revisions with high complexity',
    };

    useGraphStore.getState().setHotspotsMap({ 'backend/app/main.py': mockHotspot });
    expect(useGraphStore.getState().hotspotsMap['backend/app/main.py']).toEqual(mockHotspot);
  });
});
