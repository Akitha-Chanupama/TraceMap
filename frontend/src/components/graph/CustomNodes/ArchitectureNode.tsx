import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  FileCode,
  Folder,
  Code,
  Box,
  Layers,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Component,
} from 'lucide-react';
import { GraphNodeData } from '../../../types/graph';

const entityIcons: Record<string, React.ElementType> = {
  file: FileCode,
  directory: Folder,
  module: Folder,
  class: Layers,
  function: Code,
  component: Component,
  interface: Box,
  external_package: Box,
};

const entityColors: Record<string, string> = {
  file: 'text-accent-blue border-accent-blue/30',
  module: 'text-accent-purple border-accent-purple/30',
  class: 'text-accent-cyan border-accent-cyan/30',
  component: 'text-accent-green border-accent-green/30',
  function: 'text-accent-amber border-accent-amber/30',
  interface: 'text-accent-blue border-accent-blue/30',
  external_package: 'text-text-muted border-border-subtle bg-bg-secondary/40',
};

export const ArchitectureNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as GraphNodeData;
  const Icon = entityIcons[nodeData.entity_type] || FileCode;
  const colorClass = entityColors[nodeData.entity_type] || 'text-text-secondary border-border-subtle';

  return (
    <div
      className={`min-w-[200px] max-w-[260px] bg-bg-panel border rounded-lg p-2.5 shadow-lg transition-all duration-150 select-none ${
        selected ? 'border-accent-blue ring-2 ring-accent-blue/20 bg-bg-elevated' : 'border-border-subtle hover:border-border-highlight'
      } ${nodeData.has_cycle ? 'border-accent-red/60 shadow-accent-red/5' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-accent-blue !border-bg-main" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${nodeData.has_cycle ? 'text-accent-red' : colorClass.split(' ')[0]}`} />
          <span className="text-xs font-semibold text-text-primary truncate" title={nodeData.label}>
            {nodeData.label}
          </span>
        </div>

        {nodeData.has_cycle && (
          <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-accent-red/15 border border-accent-red/30 text-[9px] font-bold text-accent-red">
            <AlertTriangle className="w-2.5 h-2.5" />
            CYCLE
          </span>
        )}
      </div>

      {/* Path or Subtitle */}
      {nodeData.relative_path && (
        <div className="text-[10px] font-mono text-text-muted truncate mb-2" title={nodeData.relative_path}>
          {nodeData.relative_path}
        </div>
      )}

      {/* Stats Bar */}
      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted">
        <div className="flex items-center gap-2">
          {nodeData.incoming_count !== undefined && (
            <span className="flex items-center gap-0.5" title="Incoming Dependencies (Fan-in)">
              <ArrowDownLeft className="w-3 h-3 text-accent-cyan" />
              <span>{nodeData.incoming_count}</span>
            </span>
          )}
          {nodeData.outgoing_count !== undefined && (
            <span className="flex items-center gap-0.5" title="Outgoing Dependencies (Fan-out)">
              <ArrowUpRight className="w-3 h-3 text-accent-purple" />
              <span>{nodeData.outgoing_count}</span>
            </span>
          )}
        </div>

        {nodeData.language && (
          <span className="px-1.5 py-0.5 rounded bg-bg-main border border-border-subtle text-[9px] font-medium text-text-secondary uppercase">
            {nodeData.language}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-accent-blue !border-bg-main" />
    </div>
  );
});
