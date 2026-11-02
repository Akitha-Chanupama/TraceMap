import React, { useState } from 'react';
import { Settings, ShieldCheck, Check, Save, Type, Eye } from 'lucide-react';
import { useGraphStore, GraphLayout, GraphMode } from '../stores/graphStore';
import { useUiStore, FONT_SIZES_ORDER, FONT_SIZE_CONFIG, FontSize } from '../stores/uiStore';

export const SettingsPage: React.FC = () => {
  const { layout, setLayout, graphMode, setGraphMode, maxNodes, setMaxNodes } = useGraphStore();
  const { fontSize, setFontSize } = useUiStore();
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
          Configure local parser defaults, font sizing, graph performance limits, and visualization styles.
        </p>
      </div>

      {/* Typography & Font Sizing Card */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-accent-blue" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Interface Typography & Font Sizing
            </h2>
          </div>
          <span className="text-[11px] text-text-muted">
            Current: <strong className="text-accent-blue">{FONT_SIZE_CONFIG[fontSize]?.label}</strong>
          </span>
        </div>

        <p className="text-xs text-text-secondary">
          Choose a comfortable font size for the whole application. This scales the UI text, menus, graph badges, and source code viewer.
        </p>

        {/* Font size radio buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {FONT_SIZES_ORDER.map((sizeKey) => {
            const cfg = FONT_SIZE_CONFIG[sizeKey];
            const isSelected = fontSize === sizeKey;
            return (
              <div
                key={sizeKey}
                onClick={() => setFontSize(sizeKey)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-accent-blue/10 border-accent-blue shadow-sm'
                    : 'bg-bg-main border-border-subtle hover:bg-bg-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-text-primary">{cfg.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-panel text-text-muted border border-border-subtle">
                    {cfg.basePx}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mb-2">{cfg.desc}</p>
                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-mono">
                  <span>Code:</span>
                  <span className="text-accent-cyan font-bold">{cfg.codePx}px</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Font Size Preview Card */}
        <div className="bg-bg-main border border-border-subtle rounded-lg p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
            <Eye className="w-3.5 h-3.5" />
            <span>Live Typography Preview</span>
          </div>
          <div className="text-xs text-text-primary space-y-1">
            <p className="font-semibold text-text-primary">
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-text-secondary">
              TraceMap AST parser extracts classes, functions, and import relationships automatically.
            </p>
          </div>
          <div className="font-mono text-[11px] p-2 bg-bg-panel rounded border border-border-subtle text-accent-cyan">
            import &#123; UserService &#125; from './services/user'; // Code size: {FONT_SIZE_CONFIG[fontSize]?.codePx}px
          </div>
        </div>
      </div>

      {/* Visualization Preferences */}
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
