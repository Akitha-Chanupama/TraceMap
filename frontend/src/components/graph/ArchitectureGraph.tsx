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
import { GraphControls } from './GraphControls';
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

  const handleExport = (format: 'png' | 'svg' | 'json') => {
    if (format === 'json') {
      const exportData = {
        project: currentProject?.name,
        graphMode,
        nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
        edges: edges.map((e) => ({ source: e.source, target: e.target })),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.name || 'tracemap'}-architecture.json`;
      a.click();
    } else {
      // SVG/PNG export prompt or fallback to print/screenshot
      window.print();
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
