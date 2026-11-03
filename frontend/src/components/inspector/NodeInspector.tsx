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
  Flame,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { graphApi } from '../../services/graphApi';
import { useNavigate } from 'react-router-dom';

export const NodeInspector: React.FC = () => {
  const { selectedNode, setSelectedNode, hotspotsMap } = useGraphStore();
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
  const relPath = data.relative_path || '';
  const hotspot = hotspotsMap[relPath] || hotspotsMap[relPath.replace(/\\/g, '/')];

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

      {/* Details & Relationships */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Hotspot Risk Card */}
        {hotspot && (
          <div className="p-3 rounded-xl bg-bg-secondary border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <Flame
                  className={`w-4 h-4 ${
                    hotspot.hotspot_level === 'critical'
                      ? 'text-accent-red animate-pulse'
                      : hotspot.hotspot_level === 'high'
                      ? 'text-accent-amber'
                      : 'text-accent-blue'
                  }`}
                />
                <span>Git Churn Hotspot</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                  hotspot.hotspot_level === 'critical'
                    ? 'bg-accent-red/20 text-accent-red border border-accent-red/35'
                    : hotspot.hotspot_level === 'high'
                    ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/35'
                    : hotspot.hotspot_level === 'medium'
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/35'
                    : 'bg-accent-green/20 text-accent-green border border-accent-green/35'
                }`}
              >
                {hotspot.hotspot_level} ({hotspot.churn_score}/100)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-text-muted pt-1">
              <div className="p-1.5 rounded bg-bg-main border border-border-subtle">
                <div className="text-[10px] text-text-muted">Revisions</div>
                <div className="text-text-primary font-bold">{hotspot.commit_count} commits</div>
              </div>
              <div className="p-1.5 rounded bg-bg-main border border-border-subtle">
                <div className="text-[10px] text-text-muted">Contributors</div>
                <div className="text-text-primary font-bold">{hotspot.author_count} authors</div>
              </div>
              <div className="p-1.5 rounded bg-bg-main border border-border-subtle">
                <div className="text-[10px] text-text-muted">Lines Added</div>
                <div className="text-accent-green font-bold">+{hotspot.lines_added.toLocaleString()}</div>
              </div>
              <div className="p-1.5 rounded bg-bg-main border border-border-subtle">
                <div className="text-[10px] text-text-muted">Lines Deleted</div>
                <div className="text-accent-red font-bold">-{hotspot.lines_deleted.toLocaleString()}</div>
              </div>
            </div>

            <p className="text-[11px] text-text-secondary leading-snug pt-1 border-t border-border-subtle">
              {hotspot.risk_summary}
            </p>
          </div>
        )}

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
