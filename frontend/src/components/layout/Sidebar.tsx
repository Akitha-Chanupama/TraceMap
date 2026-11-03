import React, { useState } from 'react';
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
  ChevronDown,
  Layers,
  Puzzle,
  Users,
  Crown,
  ArrowRight,
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

const workspaceItems = [
  { name: 'Projects', href: '/settings', icon: Layers },
  { name: 'Integrations', href: '/settings', icon: Puzzle },
  { name: 'Team', href: '/settings', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentProject, projectSummary } = useProjectStore();
  const { sidebarOpen } = useUiStore();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const cycleCount = projectSummary?.circular_cycles_count || 0;
  const unresolvedCount = projectSummary?.unresolved_dependencies_count || 0;

  return (
    <aside
      className={`bg-[#060b13]/95 backdrop-blur-xl border-r border-sky-500/10 flex flex-col transition-all duration-200 z-20 select-none ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-sky-500/10 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-lg shadow-sky-500/20 font-black tracking-tighter text-sm">
          <span>Tm</span>
        </div>
        {sidebarOpen && (
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-white">TraceMap</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30">
                Pro
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">Code Intelligence</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold shadow-lg shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`
              }
              title={!sidebarOpen ? item.name : undefined}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </div>

              {sidebarOpen && item.href === '/circular' && cycleCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {cycleCount}
                </span>
              )}

              {sidebarOpen && item.href === '/dependencies' && unresolvedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {unresolvedCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Collapsible Workspace Section */}
        {sidebarOpen && (
          <div className="pt-5 pb-2">
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="w-full flex items-center justify-between px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase hover:text-slate-300 transition-colors"
            >
              <span>Workspace</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${workspaceOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {workspaceOpen && (
              <div className="mt-2 space-y-0.5">
                {workspaceItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom Enterprise Card */}
      {sidebarOpen && (
        <div className="p-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1a30] via-[#091322] to-[#040812] border border-sky-500/20 p-3.5 shadow-xl">
            {/* Ambient cyber glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Enterprise Plan</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Advanced code intelligence for your organization.
            </p>
            <button
              type="button"
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
            >
              <span>Manage Plan</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
