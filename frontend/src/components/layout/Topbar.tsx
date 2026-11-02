import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  FolderOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { projectApi } from '../../services/projectApi';

interface TopbarProps {
  onOpenNewProject: () => void;
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenNewProject, onOpenSearch }) => {
  const { currentProject, projectsList, setCurrentProject, setProjectsList } = useProjectStore();
  const { toggleSidebar } = useUiStore();
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
    <header className="h-14 bg-bg-secondary border-b border-border-subtle flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-bg-panel text-text-secondary hover:text-text-primary transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          {projectsList.length > 0 ? (
            <select
              value={currentProject?.id || ''}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-bg-panel border border-border-subtle text-text-primary text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-accent-blue"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-text-muted">No project loaded</span>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-panel hover:bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary rounded-md text-xs transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-accent-blue" />
            <span>Open Project</span>
          </button>
        </div>
      </div>

      {/* Global Search and Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-panel hover:bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-secondary rounded-md text-xs transition-colors w-52 justify-between"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search files, symbols...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-bg-main border border-border-subtle rounded text-text-muted">
            /
          </kbd>
        </button>

        {currentProject && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>
        )}
      </div>
    </header>
  );
};
