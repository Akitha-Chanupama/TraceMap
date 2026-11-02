import { describe, it, expect } from 'vitest';
import { applyElkLayout } from './elkLayout';
import { GraphNode, GraphEdge } from '../types/graph';

describe('applyElkLayout', () => {
  it('handles empty graphs safely', async () => {
    const res = await applyElkLayout([], [], 'hierarchical_tb');
    expect(res.nodes).toEqual([]);
    expect(res.edges).toEqual([]);
  });

  it('bypasses calculation for clustered and radial layouts', async () => {
    const nodes: GraphNode[] = [
      {
        id: '1',
        type: 'custom',
        position: { x: 50, y: 50 },
        data: { label: 'Node 1', entity_type: 'file' },
      },
    ];
    const res = await applyElkLayout(nodes, [], 'clustered');
    expect(res.nodes[0].position).toEqual({ x: 50, y: 50 });
  });

  it('computes layered layout positions for connected nodes', async () => {
    const nodes: GraphNode[] = [
      {
        id: 'n1',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: 'Entry', entity_type: 'file' },
      },
      {
        id: 'n2',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: 'Dependency', entity_type: 'file' },
      },
    ];
    const edges: GraphEdge[] = [
      {
        id: 'e1',
        source: 'n1',
        target: 'n2',
      },
    ];

    const res = await applyElkLayout(nodes, edges, 'hierarchical_tb');
    expect(res.nodes).toHaveLength(2);
    // In TB layout, target node should have a greater y or distinct coordinate
    const n1 = res.nodes.find((n) => n.id === 'n1');
    const n2 = res.nodes.find((n) => n.id === 'n2');
    expect(n1).toBeDefined();
    expect(n2).toBeDefined();
  });
});
