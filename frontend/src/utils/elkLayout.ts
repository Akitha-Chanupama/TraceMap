import ELK from 'elkjs/lib/elk.bundled.js';
import { GraphNode, GraphEdge } from '../types/graph';
import { GraphLayout } from '../stores/graphStore';

const elk = new ELK();

export async function applyElkLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layoutType: GraphLayout
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  if (nodes.length === 0) return { nodes, edges };

  // For clustered or custom layouts already positioned by backend
  if (layoutType === 'clustered' || layoutType === 'radial') {
    return { nodes, edges };
  }

  const isLeftRight = layoutType === 'hierarchical_lr';

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': layoutType === 'force' ? 'org.eclipse.elk.force' : 'layered',
      'elk.direction': isLeftRight ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '60',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
      'elk.edgeRouting': 'SPLINES',
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: 240,
      height: 90,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  try {
    const layouted = await elk.layout(elkGraph);
    const layoutedNodeMap = new Map<string, { x: number; y: number }>();
    layouted.children?.forEach((child) => {
      layoutedNodeMap.set(child.id, { x: child.x || 0, y: child.y || 0 });
    });

    const positionedNodes = nodes.map((n) => {
      const pos = layoutedNodeMap.get(n.id);
      return {
        ...n,
        position: pos || n.position,
      };
    });

    return { nodes: positionedNodes, edges };
  } catch (err) {
    console.error('ELK layout error, falling back to default positions:', err);
    return { nodes, edges };
  }
}

