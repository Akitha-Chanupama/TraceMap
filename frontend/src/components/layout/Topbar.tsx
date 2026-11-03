import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  FolderOpen,
  Search,
  Type,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore, FONT_SIZE_CONFIG } from '../../stores/uiStore';
import { projectApi } from '../../services/projectApi';

interface TopbarProps {
  onOpenNewProject: () => void;
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenNewProject, onOpenSearch }) => {
  const { currentProject, projectsList, setCurrentProject, analysisProgress } = useProjectStore();
  const { toggleSidebar, fontSize, increaseFontSize, decreaseFontSize } = useUiStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!currentProject) return;
    setIsRefreshing(true);
    try {
      await projectApi.triggerRefresh(currentProject.id);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleSelectProject = (projectId: string) => {
    const selected = projectsList.find((p) => p.id === projectId);
    if (selected) {
      setCurrentProject(selected);
    }
  };

  return (
    <header className="h-14 bg-bg-secondary/90 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-4 z-10 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-bg-panel text-text-secondary hover:text-text-primary transition-colors border border-transparent hover:border-border-subtle"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Project Selector Dropdown & Quick Open */}
        <div className="flex items-center gap-2">
          {projectsList.length > 0 ? (
            <div className="relative">
              <select
                value={currentProject?.id || ''}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-bg-panel border border-border-subtle text-text-primary text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-accent-blue font-medium transition-all cursor-pointer shadow-xs"
              >
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-xs text-text-muted">No project loaded</span>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-panel hover:bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium transition-all shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-accent-blue" />
            <span>Open Local Project</span>
          </button>

          {currentProject && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-[11px] font-medium text-accent-green">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span>{analysisProgress.isAnalyzing ? 'Analyzing...' : 'Ready'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Search, Font Size Selector, and Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-panel hover:bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-secondary rounded-lg text-xs transition-all w-56 justify-between shadow-xs"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search files, symbols...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-bg-main border border-border-subtle rounded-md text-text-muted font-mono font-semibold">
            /
          </kbd>
        </button>

        {/* Font Size Quick Selector */}
        <div className="flex items-center bg-bg-panel border border-border-subtle rounded-lg px-1.5 py-0.5 gap-1 text-xs shadow-xs">
          <button
            type="button"
            onClick={decreaseFontSize}
            title="Decrease Font Size (A-)"
            className="px-1.5 py-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors font-medium text-[11px]"
          >
            A-
          </button>
          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-accent-blue select-none">
            <Type className="w-3 h-3 opacity-70" />
            <span>{FONT_SIZE_CONFIG[fontSize]?.label.split(' ')[0]}</span>
          </div>
          <button
            type="button"
            onClick={increaseFontSize}
            title="Increase Font Size (A+)"
            className="px-1.5 py-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors font-medium text-[11px]"
          >
            A+
          </button>
        </div>

        {currentProject && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || analysisProgress.isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-accent-blue/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || analysisProgress.isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>
        )}
      </div>
    </header>
  );
};
