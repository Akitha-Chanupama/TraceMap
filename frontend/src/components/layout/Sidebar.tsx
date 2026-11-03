import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  FolderTree,
  Boxes,
  RotateCw,
  Zap,
  ShieldCheck,
  Settings,
  FolderGit2,
  Flame,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';

const navigationItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Architecture', href: '/architecture', icon: Network },
  { name: 'File Explorer', href: '/files', icon: FolderTree },
  { name: 'Dependencies', href: '/dependencies', icon: Boxes },
  { name: 'Circular Cycles', href: '/circular', icon: RotateCw },
  { name: 'Impact Analysis', href: '/impact', icon: Zap },
  { name: 'Code Quality', href: '/quality', icon: ShieldCheck },
];

export const Sidebar: React.FC = () => {
  const { currentProject, projectSummary } = useProjectStore();
  const { sidebarOpen } = useUiStore();

  const cycleCount = projectSummary?.circular_cycles_count || 0;
  const unresolvedCount = projectSummary?.unresolved_dependencies_count || 0;

  return (
    <aside
      className={`bg-bg-sidebar border-r border-border-subtle flex flex-col transition-all duration-200 z-20 select-none ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-border-subtle gap-3 bg-bg-secondary/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/40 flex items-center justify-center text-accent-blue flex-shrink-0 shadow-md shadow-accent-blue/15">
          <FolderGit2 className="w-4.5 h-4.5 text-accent-blue" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-text-primary">TraceMap</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/25">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-text-muted font-mono tracking-wider">Code Intelligence</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent-blue/15 text-accent-blue font-semibold border-l-2 border-accent-blue shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel/70'
                }`
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </div>

              {sidebarOpen && item.href === '/circular' && cycleCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-accent-red/20 text-accent-red border border-accent-red/30 animate-pulse">
                  {cycleCount}
                </span>
              )}

              {sidebarOpen && item.href === '/dependencies' && unresolvedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-accent-amber/20 text-accent-amber border border-accent-amber/30">
                  {unresolvedCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Settings & Project Label */}
      <div className="p-3 border-t border-border-subtle space-y-2 bg-bg-secondary/30">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-accent-blue/15 text-accent-blue font-semibold border-l-2 border-accent-blue'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel/70'
            }`
          }
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>

        {sidebarOpen && currentProject && (
          <div className="p-2.5 bg-bg-panel/80 rounded-xl border border-border-subtle text-[11px] text-text-muted shadow-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-text-primary font-semibold truncate">{currentProject.name}</span>
            </div>
            <div className="text-[10px] font-mono truncate text-text-muted" title={currentProject.root_path}>
              {currentProject.root_path}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
