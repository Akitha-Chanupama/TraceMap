import React from 'react';
import {
  Layers,
  LayoutGrid,
  Filter,
  Download,
  Search,
  Maximize,
  RotateCcw,
} from 'lucide-react';
import { useGraphStore, GraphMode, GraphLayout } from '../../stores/graphStore';

interface GraphControlsProps {
  onFitView: () => void;
  onExport: (format: 'png' | 'svg' | 'json') => void;
  languages?: string[];
}

export const GraphControls: React.FC<GraphControlsProps> = ({ onFitView, onExport, languages = [] }) => {
  const {
    graphMode,
    layout,
    searchQuery,
    filterLanguage,
    setGraphMode,
    setLayout,
    setSearchQuery,
    setFilterLanguage,
  } = useGraphStore();

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Left group: Graph Mode & Layout */}
      <div className="flex items-center gap-2 bg-bg-panel/90 backdrop-blur-md border border-border-subtle p-1.5 rounded-xl shadow-xl pointer-events-auto">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-bg-main p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => setGraphMode('file_dependency')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              graphMode === 'file_dependency' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setGraphMode('module_architecture')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              graphMode === 'module_architecture' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Modules
          </button>
          <button
            onClick={() => setGraphMode('symbol_explorer')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              graphMode === 'symbol_explorer' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Symbols
          </button>
          <button
            onClick={() => setGraphMode('dependencies')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              graphMode === 'dependencies' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Packages
          </button>
        </div>

        {/* Layout Selector */}
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as GraphLayout)}
          className="bg-bg-main border border-border-subtle text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent-blue"
        >
          <option value="hierarchical_tb">Hierarchical (Top-Down)</option>
          <option value="hierarchical_lr">Hierarchical (Left-Right)</option>
          <option value="clustered">Directory Clustered</option>
          <option value="radial">Radial Layout</option>
          <option value="force">Force Directed</option>
        </select>
      </div>

      {/* Right group: Search, Filter, Export & Zoom */}
      <div className="flex items-center gap-2 bg-bg-panel/90 backdrop-blur-md border border-border-subtle p-1.5 rounded-xl shadow-xl pointer-events-auto">
        {/* Node search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-36 bg-bg-main border border-border-subtle rounded-lg pl-8 pr-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Language Filter */}
        {languages.length > 0 && (
          <select
            value={filterLanguage || ''}
            onChange={(e) => setFilterLanguage(e.target.value || null)}
            className="bg-bg-main border border-border-subtle text-text-secondary text-xs rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="">All Languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={onFitView}
          className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-text-primary border border-transparent hover:border-border-subtle transition-colors"
          title="Fit Graph to Screen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        {/* Export Dropdown */}
        <div className="flex items-center gap-1 border-l border-border-subtle pl-2">
          <button
            onClick={() => onExport('png')}
            className="px-2.5 py-1 bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Export as PNG image"
          >
            <Download className="w-3 h-3" />
            <span>PNG</span>
          </button>
          <button
            onClick={() => onExport('json')}
            className="px-2.5 py-1 bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium transition-colors"
            title="Export as JSON"
          >
            JSON
          </button>
        </div>
      </div>
    </div>
  );
};
