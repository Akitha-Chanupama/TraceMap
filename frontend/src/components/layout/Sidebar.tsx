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
  const { currentProject } = useProjectStore();
  const { sidebarOpen } = useUiStore();

  return (
    <aside
      className={`bg-bg-sidebar border-r border-border-subtle flex flex-col transition-all duration-200 z-20 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-border-subtle gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center text-accent-blue flex-shrink-0">
          <FolderGit2 className="w-5 h-5" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-wide text-text-primary">TraceMap</span>
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Local Intel</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel'
                }`
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Settings & Project Label */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-accent-blue/15 text-accent-blue font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel'
            }`
          }
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </NavLink>

        {sidebarOpen && currentProject && (
          <div className="px-3 py-2 bg-bg-panel rounded-md border border-border-subtle text-[11px] text-text-muted">
            <div className="text-text-primary font-medium truncate">{currentProject.name}</div>
            <div className="text-[10px] font-mono truncate text-text-muted mt-0.5">{currentProject.root_path}</div>
          </div>
        )}
      </div>
    </aside>
  );
};

