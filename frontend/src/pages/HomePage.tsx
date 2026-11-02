import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  Layers,
  RotateCw,
  Boxes,
  ShieldAlert,
  ArrowRight,
  Network,
  FolderOpen,
  PieChart as PieIcon,
  Activity,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useProjectStore } from '../stores/projectStore';
import { analysisApi } from '../services/analysisApi';
import { ProjectSummary } from '../types/project';

const CHART_COLORS = ['#4C8DFF', '#36C5E8', '#9A78FF', '#35C98A', '#F1B85B', '#EF6464'];

export const HomePage: React.FC<{ onOpenProject: () => void }> = ({ onOpenProject }) => {
  const { currentProject, projectSummary, setProjectSummary } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    analysisApi
      .getSummary(currentProject.id)
      .then(setProjectSummary)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [currentProject, setProjectSummary]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue mb-4">
          <Network className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Welcome to TraceMap</h2>
        <p className="text-xs text-text-muted max-w-md mb-6 leading-relaxed">
          Open any local Git repository or source code directory to instantly analyze dependencies,
          detect circular cycles, inspect symbols, and explore architecture visualizations.
        </p>
        <button
          onClick={onOpenProject}
          className="px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open a Local Project</span>
        </button>
      </div>
    );
  }

  const s = projectSummary;
  const langData = s
    ? Object.entries(s.language_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-text-primary">{currentProject.name}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-blue/15 border border-accent-blue/30 text-accent-blue">
              {currentProject.project_type || 'Polyglot'}
            </span>
          </div>
          <p className="text-xs font-mono text-text-muted">{currentProject.root_path}</p>
        </div>

        <button
          onClick={() => navigate('/architecture')}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Network className="w-4 h-4" />
          <span>Explore Architecture Graph</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-bg-panel border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <FileCode className="w-4 h-4 text-accent-blue" />
            <span>Files</span>
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">{s?.total_files || 0}</div>
        </div>

        <div className="bg-bg-panel border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <span>Lines of Code</span>
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">{s?.total_lines?.toLocaleString() || 0}</div>
        </div>

        <div className="bg-bg-panel border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Layers className="w-4 h-4 text-accent-purple" />
            <span>Symbols</span>
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">{s?.total_symbols || 0}</div>
        </div>

        <div className="bg-bg-panel border border-border-subtle rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Boxes className="w-4 h-4 text-accent-green" />
            <span>Dependencies</span>
          </div>
          <div className="text-xl font-bold text-text-primary font-mono">{s?.total_dependencies || 0}</div>
        </div>

        <div
          onClick={() => navigate('/circular')}
          className="bg-bg-panel border border-border-subtle hover:border-accent-red/40 rounded-xl p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <RotateCw className="w-4 h-4 text-accent-red" />
            <span>Cycles</span>
          </div>
          <div className="text-xl font-bold text-accent-red font-mono">{s?.circular_cycles_count || 0}</div>
        </div>

        <div
          onClick={() => navigate('/dependencies')}
          className="bg-bg-panel border border-border-subtle hover:border-accent-amber/40 rounded-xl p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-accent-amber" />
            <span>Unresolved</span>
          </div>
          <div className="text-xl font-bold text-accent-amber font-mono">{s?.unresolved_dependencies_count || 0}</div>
        </div>
      </div>

      {/* Middle Charts & Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Breakdown */}
        <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary mb-4">
            <PieIcon className="w-4 h-4 text-accent-blue" />
            <span>Language Distribution</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={langData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} stroke="#151B25">
                  {langData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#151B25', borderColor: '#283244', fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {langData.map((l, i) => (
              <span key={l.name} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="capitalize">{l.name}</span>
                <span className="font-mono text-text-muted">({String(l.value)})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Top Connected Modules */}
        <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-col">
          <div className="text-xs font-semibold text-text-primary mb-3">Most Connected Files</div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {s?.top_connected_files && s.top_connected_files.length > 0 ? (
              s.top_connected_files.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg-main border border-border-subtle">
                  <span className="font-mono text-text-primary truncate max-w-[200px]" title={item.file}>
                    {item.file}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                    {item.connections} links
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-text-muted italic py-6 text-center">No dependencies analyzed yet</div>
            )}
          </div>
        </div>

        {/* Largest Files */}
        <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-col">
          <div className="text-xs font-semibold text-text-primary mb-3">Largest Source Files</div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {s?.largest_files && s.largest_files.length > 0 ? (
              s.largest_files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg-main border border-border-subtle">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-mono text-text-primary truncate max-w-[180px]" title={f.file}>
                      {f.file}
                    </span>
                    <span className="text-[10px] uppercase text-text-muted">{f.language}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{f.lines} lines</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-text-muted italic py-6 text-center">No files scanned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
