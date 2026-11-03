import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  FolderOpen,
  Search,
  Type,
  Bell,
  HelpCircle,
  Layers,
  ChevronDown,
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
    <header className="h-16 bg-[#060b13]/90 backdrop-blur-xl border-b border-sky-500/10 flex items-center justify-between px-5 z-10 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-sky-500/10"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Project Selector Dropdown & Quick Open */}
        <div className="flex items-center gap-2.5">
          {projectsList.length > 0 ? (
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 bg-[#0d1627]/90 border border-sky-500/20 text-white text-xs rounded-xl pl-3 pr-2.5 py-1.5 font-medium shadow-sm">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <select
                  value={currentProject?.id || ''}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0b1322] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500">No project loaded</span>
          )}

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1627]/80 hover:bg-[#121f37] border border-sky-500/20 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Open Local Project</span>
          </button>

          {currentProject && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>{analysisProgress.isAnalyzing ? 'Analyzing...' : 'Ready'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Search, Font Size Selector, User Profile & Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#0d1627]/80 hover:bg-[#121f37] border border-sky-500/20 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-all w-64 justify-between shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Search files, symbols, dependencies...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-sky-500/20 rounded text-slate-400 font-mono font-bold">
            ⌘ K
          </kbd>
        </button>

        {/* Font Size Quick Selector */}
        <div className="flex items-center bg-[#0d1627]/80 border border-sky-500/20 rounded-xl px-2 py-0.5 gap-1 text-xs">
          <button
            type="button"
            onClick={decreaseFontSize}
            title="Decrease Font Size (A-)"
            className="px-1 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-[11px]"
          >
            A-
          </button>
          <div className="flex items-center gap-1 px-1 py-0.5 text-[11px] font-medium text-sky-400 select-none">
            <Type className="w-3 h-3 opacity-80" />
            <span>{FONT_SIZE_CONFIG[fontSize]?.label.split(' ')[0]}</span>
          </div>
          <button
            type="button"
            onClick={increaseFontSize}
            title="Increase Font Size (A+)"
            className="px-1 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-[11px]"
          >
            A+
          </button>
        </div>

        {/* Re-analyze Button */}
        {currentProject && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || analysisProgress.isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-sky-500/25"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || analysisProgress.isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-sky-500/10 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
        </button>

        {/* Help Circle */}
        <button
          className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-sky-500/10 transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 border border-sky-300/40 flex items-center justify-center text-white text-xs font-bold tracking-wider shadow-lg shadow-sky-500/20 cursor-pointer"
          title="Account Profile (AK)"
        >
          <span>AK</span>
        </div>
      </div>
    </header>
  );
};
