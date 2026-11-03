import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArchitectureNode } from './CustomNodes/ArchitectureNode';
import { GraphControls, ExportFormat } from './GraphControls';
import { NodeInspector } from '../inspector/NodeInspector';
import { useGraphStore } from '../../stores/graphStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { graphApi } from '../../services/graphApi';
import { applyElkLayout } from '../../utils/elkLayout';
import { GraphNode, GraphEdge } from '../../types/graph';
import { Loader2, AlertCircle } from 'lucide-react';

const nodeTypes = {
  custom: ArchitectureNode,
};

const ArchitectureGraphInner: React.FC = () => {
  const {
    graphMode,
    layout,
    searchQuery,
    filterLanguage,
    filterDirectory,
    maxNodes,
    selectedNode,
    setSelectedNode,
    highlightedCycleIds,
  } = useGraphStore();

  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>([]);

  // Fetch Graph Data
  const loadGraph = useCallback(async () => {
    if (!currentProject) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await graphApi.getGraph(currentProject.id, {
        type: graphMode,
        language: filterLanguage || undefined,
        directory: filterDirectory || undefined,
        search: searchQuery || undefined,
        max_nodes: maxNodes,
      });

      // Extract unique languages
      const langs = new Set<string>();
      data.nodes.forEach((n) => {
        if (n.data.language) langs.add(n.data.language);
      });
      setDetectedLanguages(Array.from(langs));

      // Apply ELK Layout
      const layouted = await applyElkLayout(data.nodes, data.edges, layout);

      // Map to React Flow Nodes & Edges
      const rfNodes: Node[] = layouted.nodes.map((n) => ({
        id: n.id,
        type: 'custom',
        position: n.position,
        data: n.data as any,
        selected: selectedNode?.id === n.id,
      }));

      const rfEdges: Edge[] = layouted.edges.map((e) => {
        const isCycle = e.data?.is_cycle || (highlightedCycleIds.length > 0 && highlightedCycleIds.includes(e.source));
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          label: e.label,
          animated: isCycle,
          style: {
            stroke: isCycle ? '#EF6464' : '#283244',
            strokeWidth: isCycle ? 2.5 : 1.5,
          },
          labelStyle: {
            fill: isCycle ? '#EF6464' : '#929EB0',
            fontSize: 10,
            fontFamily: 'monospace',
          },
          labelBgStyle: {
            fill: '#0B0D12',
            fillOpacity: 0.8,
          },
        };
      });

      setNodes(rfNodes);
      setEdges(rfEdges);

      setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
    } catch (err: any) {
      setError(err.message || 'Failed to load architecture graph');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentProject,
    graphMode,
    layout,
    filterLanguage,
    filterDirectory,
    searchQuery,
    maxNodes,
    highlightedCycleIds,
    fitView,
  ]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as unknown as GraphNode);
    },
    [setSelectedNode]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as any;
      if (data?.file_id) {
        openSourceViewer(data.file_id);
      }
    },
    [openSourceViewer]
  );

  const generateSvgContent = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 240);
      maxY = Math.max(maxY, n.position.y + 90);
    });
    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 800;
      maxY = 600;
    }
    const padding = 80;
    const width = Math.max(800, Math.round(maxX - minX + padding * 2));
    const height = Math.max(600, Math.round(maxY - minY + padding * 2));
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const edgeSvgs = edges
      .map((e) => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return '';
        const sx = s.position.x + offsetX + 110;
        const sy = s.position.y + offsetY + 35;
        const tx = t.position.x + offsetX + 110;
        const ty = t.position.y + offsetY + 35;
        const isCycle = e.animated;
        const stroke = isCycle ? '#EF6464' : '#4C8DFF';
        return `<path d="M ${sx} ${sy} Q ${(sx + tx) / 2} ${(sy + ty) / 2 - 25} ${tx} ${ty}" stroke="${stroke}" stroke-width="2" fill="none" opacity="0.65" marker-end="url(#arrow)"/>`;
      })
      .join('\n');

    const nodeSvgs = nodes
      .map((n) => {
        const x = n.position.x + offsetX;
        const y = n.position.y + offsetY;
        const label = (n.data as any)?.label || n.id;
        const type = (n.data as any)?.entity_type || 'file';
        const lang = (n.data as any)?.language || '';
        const hasCycle = (n.data as any)?.has_cycle;
        const stroke = hasCycle ? '#EF6464' : '#283244';
        return `
          <g transform="translate(${x}, ${y})">
            <rect width="220" height="70" rx="8" fill="#151B25" stroke="${stroke}" stroke-width="${hasCycle ? 2 : 1}"/>
            <text x="14" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#E8EDF5">${label}</text>
            <text x="14" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#929EB0">${type} ${lang ? '· ' + lang : ''}</text>
          </g>
        `;
      })
      .join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#0B0D12"/>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#4C8DFF" />
        </marker>
      </defs>
      <g id="edges">${edgeSvgs}</g>
      <g id="nodes">${nodeSvgs}</g>
    </svg>`;
  };

  const handleExport = (format: ExportFormat) => {
    const projName = currentProject?.name || 'tracemap';

    if (format === 'json') {
      const exportData = {
        project: currentProject?.name,
        root_path: currentProject?.root_path,
        exported_at: new Date().toISOString(),
        graphMode,
        stats: { total_nodes: nodes.length, total_edges: edges.length },
        nodes: nodes.map((n) => ({ id: n.id, data: n.data, position: n.position })),
        edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}-architecture.json`;
      a.click();
    } else if (format === 'svg') {
      const svg = generateSvgContent();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}-architecture.svg`;
      a.click();
    } else if (format === 'png') {
      const svg = generateSvgContent();
      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const pngUrl = URL.createObjectURL(pngBlob);
              const a = document.createElement('a');
              a.href = pngUrl;
              a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}-architecture.png`;
              a.click();
              URL.revokeObjectURL(pngUrl);
            }
          });
        }
        URL.revokeObjectURL(blobUrl);
      };
      img.src = blobUrl;
    } else if (format === 'markdown') {
      const timestamp = new Date().toLocaleString();
      const md = `# ${projName} — Architecture & Dependency Report\n*Generated by TraceMap on ${timestamp}*\n\n## Project Overview\n- **Project Root**: \`${currentProject?.root_path || 'N/A'}\`\n- **Project Type**: ${currentProject?.project_type || 'Polyglot'}\n- **Rendered Mode**: ${graphMode}\n- **Total Visible Nodes**: ${nodes.length}\n- **Total Visible Connections**: ${edges.length}\n\n## Visible Nodes\n${nodes.map((n) => `- **${(n.data as any)?.label || n.id}** (${(n.data as any)?.entity_type || 'file'})`).join('\n')}\n\n---\n*Report generated locally with 100% offline codebase intelligence by TraceMap.*\n`;
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}-architecture-report.md`;
      a.click();
    }
  };

  return (
    <div className="flex-1 h-full relative overflow-hidden flex">
      <div className="flex-1 h-full relative">
        <GraphControls
          onFitView={() => fitView({ padding: 0.15, duration: 300 })}
          onExport={handleExport}
          languages={detectedLanguages}
        />

        {isLoading && (
          <div className="absolute inset-0 bg-bg-main/60 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl shadow-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
              <span className="text-xs font-medium text-text-primary">Generating architecture layout...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="p-5 bg-bg-panel border border-accent-red/40 rounded-xl shadow-xl max-w-md text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-accent-red mx-auto" />
              <h3 className="text-sm font-semibold text-text-primary">Failed to load graph</h3>
              <p className="text-xs text-text-muted">{error}</p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          minZoom={0.1}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#283244" gap={24} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            position="bottom-left"
            nodeColor="#3B4861"
            maskColor="rgba(11, 13, 18, 0.75)"
            className="!bg-bg-panel !border !border-border-subtle !rounded-lg overflow-hidden !shadow-lg"
          />
        </ReactFlow>
      </div>

      {/* Right Contextual Inspector */}
      <NodeInspector />
    </div>
  );
};

export const ArchitectureGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ArchitectureGraphInner />
    </ReactFlowProvider>
  );
};
