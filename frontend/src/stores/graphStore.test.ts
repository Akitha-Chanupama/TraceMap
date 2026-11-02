import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from './graphStore';
import { GraphNode } from '../types/graph';

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
});

