import React, { useEffect, useState } from 'react';
import {
  X,
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  Code,
  Zap,
  ExternalLink,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { graphApi } from '../../services/graphApi';
import { useNavigate } from 'react-router-dom';

export const NodeInspector: React.FC = () => {
  const { selectedNode, setSelectedNode } = useGraphStore();
  const { openSourceViewer } = useUiStore();
  const { currentProject } = useProjectStore();
  const navigate = useNavigate();

  const [neighbors, setNeighbors] = useState<{
    incoming: Array<{ file: string; statement?: string }>;
    outgoing: Array<{ file: string; statement?: string }>;
  }>({ incoming: [], outgoing: [] });

  useEffect(() => {
    if (!selectedNode || !currentProject) return;

    graphApi
      .getNodeNeighbors(currentProject.id, selectedNode.id)
      .then(setNeighbors)
      .catch((err) => console.error(err));
  }, [selectedNode, currentProject]);

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const isFile = data.entity_type === 'file';

  return (
    <div className="w-80 bg-bg-panel border-l border-border-subtle h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-start justify-between">
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-accent-blue/15 border border-accent-blue/30 text-accent-blue">
              {data.entity_type}
            </span>
            {data.language && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted bg-bg-main border border-border-subtle uppercase">
                {data.language}
              </span>
            )}
            {data.has_cycle && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-accent-red bg-accent-red/15 border border-accent-red/30">
                CYCLE
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-text-primary truncate" title={data.label}>
            {data.label}
          </h3>
          {data.relative_path && (
            <p className="text-[11px] font-mono text-text-muted truncate mt-0.5" title={data.relative_path}>
              {data.relative_path}
            </p>
          )}
        </div>

        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-b border-border-subtle grid grid-cols-2 gap-2">
        {isFile && data.file_id && (
          <button
            onClick={() => openSourceViewer(data.file_id!)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-elevated hover:bg-border-subtle border border-border-subtle rounded-lg text-xs font-medium text-text-primary transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-accent-cyan" />
            <span>View Source</span>
          </button>
        )}

        {isFile && (
          <button
            onClick={() => navigate(`/impact?file=${encodeURIComponent(data.relative_path || '')}`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-blue/15 hover:bg-accent-blue/25 border border-accent-blue/30 rounded-lg text-xs font-semibold text-accent-blue transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Impact Analysis</span>
          </button>
        )}
      </div>

      {/* Relationships */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Outgoing Dependencies */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-accent-purple" />
              <span>Imports ({neighbors.outgoing.length})</span>
            </span>
          </div>
          {neighbors.outgoing.length === 0 ? (
            <div className="text-[11px] text-text-muted italic">No internal imports detected</div>
          ) : (
            <div className="space-y-1.5">
              {neighbors.outgoing.map((out, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-bg-main border border-border-subtle">
                  <div className="font-mono text-text-primary truncate" title={out.file}>
                    {out.file}
                  </div>
                  {out.statement && (
                    <div className="text-[10px] text-text-muted truncate mt-0.5 font-mono" title={out.statement}>
                      {out.statement}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Dependants */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Imported By ({neighbors.incoming.length})</span>
            </span>
          </div>
          {neighbors.incoming.length === 0 ? (
            <div className="text-[11px] text-text-muted italic">No internal files import this module</div>
          ) : (
            <div className="space-y-1.5">
              {neighbors.incoming.map((inc, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-bg-main border border-border-subtle">
                  <div className="font-mono text-text-primary truncate" title={inc.file}>
                    {inc.file}
                  </div>
                  {inc.statement && (
                    <div className="text-[10px] text-text-muted truncate mt-0.5 font-mono" title={inc.statement}>
                      {inc.statement}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

