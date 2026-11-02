import React, { useState } from 'react';
import { Settings, ShieldCheck, Check, Save } from 'lucide-react';
import { useGraphStore, GraphLayout, GraphMode } from '../stores/graphStore';

export const SettingsPage: React.FC = () => {
  const { layout, setLayout, graphMode, setGraphMode, maxNodes, setMaxNodes } = useGraphStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-blue" />
          <span>TraceMap Preferences & Settings</span>
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Configure local parser defaults, graph performance limits, and visualization styles.
        </p>
      </div>

      <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 space-y-5">
        <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Visualization Preferences
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Default Architecture Layout
            </label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as GraphLayout)}
              className="w-full bg-bg-main border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            >
              <option value="hierarchical_tb">Hierarchical (Top-to-Bottom)</option>
              <option value="hierarchical_lr">Hierarchical (Left-to-Right)</option>
              <option value="clustered">Directory Clustered</option>
              <option value="radial">Radial Layout</option>
              <option value="force">Force Directed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Default View Mode
            </label>
            <select
              value={graphMode}
              onChange={(e) => setGraphMode(e.target.value as GraphMode)}
              className="w-full bg-bg-main border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            >
              <option value="file_dependency">File Dependencies</option>
              <option value="module_architecture">Module Architecture</option>
              <option value="symbol_explorer">Symbol Explorer</option>
              <option value="dependencies">External Packages</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Maximum Graph Nodes Rendered
            </label>
            <input
              type="number"
              min={50}
              max={2000}
              step={50}
              value={maxNodes}
              onChange={(e) => setMaxNodes(parseInt(e.target.value) || 300)}
              className="w-full bg-bg-main border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-blue font-mono"
            />
            <p className="text-[10px] text-text-muted mt-1">Prevents canvas freezing on large codebases.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex items-center justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved Locally' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Local Privacy & Security Card */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <span>Local Privacy & Zero-Cloud Guarantee</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          TraceMap is strictly local software. It runs entirely on your local machine, binds exclusively to{' '}
          <span className="font-mono text-accent-cyan">127.0.0.1</span>, stores data in SQLite (WAL mode), and
          makes zero outbound telemetry or cloud requests. Source code is never modified, deleted, or executed.
        </p>
      </div>
    </div>
  );
};
