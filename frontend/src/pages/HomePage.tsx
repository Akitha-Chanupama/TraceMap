import React, { useEffect, useState, useMemo } from 'react';
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
  Flame,
  CheckCircle2,
  AlertTriangle,
  GitCommit,
  GitBranch,
  TrendingUp,
  BarChart3,
  Sliders,
  Code,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { analysisApi } from '../services/analysisApi';
import { ProjectSummary } from '../types/project';
import { ComplexityReportResponse, GitHotspotsResponse, CircularDependenciesResponse } from '../types/analysis';

const PALETTE = {
  blue: '#4C8DFF',
  cyan: '#36C5E8',
  purple: '#9A78FF',
  green: '#35C98A',
  amber: '#F1B85B',
  red: '#EF6464',
  textMuted: '#627187',
  gridLine: 'rgba(40, 50, 68, 0.45)',
  panelBg: '#151B25',
};

const CHART_COLORS = [PALETTE.blue, PALETTE.cyan, PALETTE.purple, PALETTE.green, PALETTE.amber, PALETTE.red];

type DashboardTab = 'overview' | 'coupling' | 'complexity' | 'hotspots';

export const HomePage: React.FC<{ onOpenProject: () => void }> = ({ onOpenProject }) => {
  const { currentProject, projectSummary, setProjectSummary } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [complexityData, setComplexityData] = useState<ComplexityReportResponse | null>(null);
  const [gitHotspots, setGitHotspots] = useState<GitHotspotsResponse | null>(null);
  const [cyclesData, setCyclesData] = useState<CircularDependenciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);

    Promise.all([
      analysisApi.getSummary(currentProject.id).then(setProjectSummary).catch(() => null),
      analysisApi.getComplexity(currentProject.id).then(setComplexityData).catch(() => null),
      analysisApi.getGitHotspots(currentProject.id).then(setGitHotspots).catch(() => null),
      analysisApi.getCircularDependencies(currentProject.id).then(setCyclesData).catch(() => null),
    ]).finally(() => setIsLoading(false));
  }, [currentProject, setProjectSummary]);

  const s = projectSummary;

  // Language Breakdown Data
  const langData = useMemo(() => {
    if (!s?.language_breakdown) return [];
    return Object.entries(s.language_breakdown)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [s?.language_breakdown]);

  const totalLanguageFiles = useMemo(() => {
    return langData.reduce((acc, curr) => acc + curr.value, 0);
  }, [langData]);

  // Coupling Data: Fan-In vs Fan-Out (Prioritize real connected modules)
  const couplingData = useMemo(() => {
    // 1. Gather all files with metrics and find those with active internal dependencies
    const allFiles = complexityData?.metrics_by_file || [];
    const connected = allFiles.filter((item) => (item.fan_in || 0) + (item.fan_out || 0) > 0);

    if (connected.length > 0) {
      return connected
        .slice()
        .sort((a, b) => (b.fan_in + b.fan_out) - (a.fan_in + a.fan_out))
        .slice(0, 8)
        .map((item) => {
          const shortName = item.relative_path.split(/[/\\]/).pop() || item.relative_path;
          const total = item.fan_in + item.fan_out;
          const instability = total > 0 ? Number((item.fan_out / total).toFixed(2)) : 0;
          return {
            name: shortName,
            fullPath: item.relative_path,
            fanIn: item.fan_in,
            fanOut: item.fan_out,
            totalLinks: total,
            instability,
            complexity: item.cyclomatic_complexity,
            fileId: item.file_id,
          };
        });
    }

    // 2. Fallback to summary's top_connected_files if metrics_by_file is empty
    if (s?.top_connected_files && s.top_connected_files.length > 0) {
      return s.top_connected_files.slice(0, 8).map((f) => {
        const shortName = f.file.split(/[/\\]/).pop() || f.file;
        const inLinks = Math.max(1, Math.floor(f.connections * 0.6));
        const outLinks = Math.max(0, f.connections - inLinks);
        return {
          name: shortName,
          fullPath: f.file,
          fanIn: inLinks,
          fanOut: outLinks,
          totalLinks: f.connections,
          instability: Number((outLinks / f.connections).toFixed(2)),
          complexity: 1,
          fileId: undefined as string | undefined,
        };
      });
    }

    return [];
  }, [complexityData?.metrics_by_file, s?.top_connected_files]);

  // Scale & Complexity Curve Data
  const scaleData = useMemo(() => {
    const largest = s?.largest_files || [];
    return largest.slice(0, 8).map((f) => {
      const shortName = f.file.split(/[/\\]/).pop() || f.file;
      const matchingComp = complexityData?.metrics_by_file?.find((m) => m.relative_path === f.file);
      return {
        name: shortName,
        fullPath: f.file,
        lines: f.lines,
        complexity: matchingComp?.cyclomatic_complexity || 1,
        language: f.language,
      };
    });
  }, [s?.largest_files, complexityData]);

  // Hotspots Breakdown Data
  const hotspotChartData = useMemo(() => {
    if (!gitHotspots?.hotspots) return [];
    return gitHotspots.hotspots.slice(0, 8).map((h) => {
      const shortName = h.relative_path.split(/[/\\]/).pop() || h.relative_path;
      return {
        name: shortName,
        fullPath: h.relative_path,
        churnScore: h.churn_score,
        commits: h.commit_count,
        linesAdded: h.lines_added,
        linesDeleted: h.lines_deleted,
        level: h.hotspot_level,
      };
    });
  }, [gitHotspots?.hotspots]);

  // Architecture Health Score Calculation (0-100)
  const healthScore = useMemo(() => {
    if (!s) return 100;
    let score = 100;

    // Penalty for circular dependency cycles
    const cyclesCount = cyclesData?.total_cycles ?? s.circular_cycles_count ?? 0;
    score -= Math.min(30, cyclesCount * 10);

    // Penalty for unresolved dependencies
    const unresolved = s.unresolved_dependencies_count || 0;
    score -= Math.min(20, unresolved * 4);

    // Penalty for critical churn hotspots
    const criticalHotspots = gitHotspots?.hotspots?.filter((h) => h.hotspot_level === 'critical').length || 0;
    score -= Math.min(20, criticalHotspots * 6);

    // Penalty for high cyclomatic complexity
    const avgComplexity = complexityData?.average_complexity || 0;
    if (avgComplexity > 15) score -= 15;
    else if (avgComplexity > 8) score -= 8;

    return Math.max(25, Math.min(100, Math.round(score)));
  }, [s, cyclesData, gitHotspots, complexityData]);

  const healthGrade = useMemo(() => {
    if (healthScore >= 90) return { grade: 'A+', label: 'Optimal Architecture', color: 'text-accent-green', border: 'border-accent-green/40', bg: 'bg-accent-green/15' };
    if (healthScore >= 80) return { grade: 'A', label: 'Strong Health', color: 'text-accent-cyan', border: 'border-accent-cyan/40', bg: 'bg-accent-cyan/15' };
    if (healthScore >= 65) return { grade: 'B', label: 'Moderate Risk', color: 'text-accent-amber', border: 'border-accent-amber/40', bg: 'bg-accent-amber/15' };
    return { grade: 'C', label: 'Refactoring Advised', color: 'text-accent-red', border: 'border-accent-red/40', bg: 'bg-accent-red/15' };
  }, [healthScore]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 border border-accent-blue/40 flex items-center justify-center text-accent-blue mb-5 shadow-2xl shadow-accent-blue/15 animate-in zoom-in-95 duration-200">
          <Network className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">TraceMap Code Intelligence</h2>
        <p className="text-xs text-text-muted max-w-md mb-8 leading-relaxed">
          Open any local Git repository or source code directory to instantly analyze dependencies,
          detect circular cycles, inspect symbols, and explore architecture visualizations.
        </p>
        <button
          onClick={onOpenProject}
          className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-blue/90 hover:from-accent-blue/95 hover:to-accent-blue text-white rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xl shadow-accent-blue/20 hover:shadow-accent-blue/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open a Local Project</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Top Hero Architecture Health Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-panel via-bg-panel to-accent-blue/10 border border-border-subtle p-6 shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">{currentProject.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-blue/15 border border-accent-blue/30 text-accent-blue uppercase tracking-wider">
                {currentProject.project_type || 'Polyglot'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-green/15 border border-accent-green/30 text-accent-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                Live AST Sync
              </span>
            </div>

            <p className="text-xs font-mono text-text-muted truncate max-w-xl" title={currentProject.root_path}>
              {currentProject.root_path}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-text-secondary">
              <span>{s?.total_files || 0} files</span>
              <span>•</span>
              <span>{s?.total_lines?.toLocaleString() || 0} lines</span>
              <span>•</span>
              <span>{s?.total_symbols || 0} symbols</span>
              <span>•</span>
              <span className="text-accent-cyan font-medium">{langData.length} languages detected</span>
            </div>
          </div>

          {/* Architecture Health Rating Widget */}
          <div className="flex items-center gap-4 bg-bg-secondary/80 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-md">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-bg-main flex items-center justify-center bg-bg-panel shadow-inner">
                <span className={`text-xl font-black font-mono ${healthGrade.color}`}>
                  {healthScore}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Health Score</div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${healthGrade.bg} ${healthGrade.border} ${healthGrade.color}`}>
                  {healthGrade.grade}
                </span>
                <span className="text-xs font-semibold text-text-primary">{healthGrade.label}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/architecture')}
              className="ml-2 px-3.5 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-accent-blue/20 hover:scale-[1.02]"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Files */}
        <div className="glass-panel glow-card-blue rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Files</span>
            <FileCode className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="text-2xl font-bold text-text-primary font-mono">{s?.total_files || 0}</div>
          <div className="text-[10px] text-text-muted truncate">{langData.length} languages</div>
        </div>

        {/* Lines of Code */}
        <div className="glass-panel glow-card-cyan rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Lines of Code</span>
            <Activity className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold text-text-primary font-mono">
            {s?.total_lines ? s.total_lines.toLocaleString() : 0}
          </div>
          <div className="text-[10px] text-text-muted truncate">
            ~{s?.total_files ? Math.round(s.total_lines / s.total_files) : 0} lines/file
          </div>
        </div>

        {/* Symbols */}
        <div className="glass-panel glow-card-purple rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Symbols</span>
            <Layers className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="text-2xl font-bold text-text-primary font-mono">{s?.total_symbols || 0}</div>
          <div className="text-[10px] text-text-muted truncate">Classes, funcs, types</div>
        </div>

        {/* Dependencies */}
        <div className="glass-panel glow-card-blue rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Dependencies</span>
            <Boxes className="w-4 h-4 text-accent-green" />
          </div>
          <div className="text-2xl font-bold text-text-primary font-mono">{s?.total_dependencies || 0}</div>
          <div className="text-[10px] text-text-muted truncate">Import connections</div>
        </div>

        {/* Circular Cycles */}
        <div
          onClick={() => navigate('/circular')}
          className={`glass-panel glow-card-red rounded-xl p-4 space-y-1 cursor-pointer transition-all ${
            (s?.circular_cycles_count || 0) > 0 ? 'border-accent-red/40 bg-accent-red/5' : ''
          }`}
        >
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Circular Cycles</span>
            <RotateCw className={`w-4 h-4 ${(s?.circular_cycles_count || 0) > 0 ? 'text-accent-red animate-spin' : 'text-accent-green'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${(s?.circular_cycles_count || 0) > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
            {s?.circular_cycles_count || 0}
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {(s?.circular_cycles_count || 0) > 0 ? 'Requires isolation' : 'Zero cycles detected'}
          </div>
        </div>

        {/* Git Hotspots */}
        <div
          onClick={() => navigate('/quality')}
          className="glass-panel glow-card-amber rounded-xl p-4 space-y-1 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-medium">Churn Hotspots</span>
            <Flame className="w-4 h-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-accent-amber font-mono">
            {gitHotspots?.hotspots?.length || 0}
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {gitHotspots?.total_commits_analyzed ? `${gitHotspots.total_commits_analyzed} commits analyzed` : 'Defect risk files'}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-1 bg-bg-panel/80 p-1 rounded-xl border border-border-subtle">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & Distribution</span>
          </button>
          <button
            onClick={() => setActiveTab('coupling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'coupling'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Coupling (Fan-In vs Fan-Out)</span>
          </button>
          <button
            onClick={() => setActiveTab('complexity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'complexity'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scale & Complexity</span>
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'hotspots'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Git Churn Velocity</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Offline AST Static Analysis · Zero Cloud Transmission</span>
        </div>
      </div>

      {/* Tab 1: Overview & Distribution */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Language Distribution Donut Chart */}
            <div className="bg-bg-panel border border-border-subtle rounded-2xl p-5 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <PieIcon className="w-4 h-4 text-accent-blue" />
                  <span>Language Distribution</span>
                </div>
                <span className="text-[11px] font-mono text-text-muted">{totalLanguageFiles} files</span>
              </div>

              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={langData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="#0B0D12"
                      strokeWidth={2}
                    >
                      {langData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#151B25',
                        borderColor: '#283244',
                        fontSize: '11px',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                      itemStyle={{ color: '#E8EDF5' }}
                      formatter={(value: any, name: any) => [
                        `${value} files (${Math.round(((Number(value) || 0) / (totalLanguageFiles || 1)) * 100)}%)`,
                        String(name).toUpperCase(),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono text-text-primary">{totalLanguageFiles}</span>
                  <span className="text-[10px] uppercase font-mono text-text-muted">Total Files</span>
                </div>
              </div>

              {/* Language Legend */}
              <div className="flex flex-wrap gap-2.5 mt-2 justify-center border-t border-border-subtle pt-3">
                {langData.map((l, i) => (
                  <span key={l.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="capitalize font-medium">{l.name}</span>
                    <span className="font-mono text-text-muted text-[11px]">
                      ({Math.round((l.value / (totalLanguageFiles || 1)) * 100)}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Architecture Coupling Preview (Fan-In vs Fan-Out) */}
            <div className="bg-bg-panel border border-border-subtle rounded-2xl p-5 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <Boxes className="w-4 h-4 text-accent-cyan" />
                  <span>Top Architectural Hubs</span>
                </div>
                <button
                  onClick={() => setActiveTab('coupling')}
                  className="text-[11px] text-accent-blue hover:underline font-medium"
                >
                  View Details →
                </button>
              </div>

              <div className="h-56 w-full pt-2">
                {couplingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={couplingData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke={PALETTE.textMuted}
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke={PALETTE.textMuted} fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151B25',
                          borderColor: '#283244',
                          fontSize: '11px',
                          borderRadius: '10px',
                        }}
                      />
                      <Bar dataKey="fanIn" name="Fan-In (Dependants)" fill={PALETTE.cyan} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fanOut" name="Fan-Out (Dependencies)" fill={PALETTE.purple} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-text-muted">
                    <Boxes className="w-8 h-8 text-text-muted/30 mb-2" />
                    <p className="font-medium text-text-secondary">No Coupled Modules Detected</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Scanned files have zero internal import dependencies.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-border-subtle pt-3 text-xs">
                <span className="flex items-center gap-1.5 text-accent-cyan font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-accent-cyan" />
                  <span>Fan-In (Core Stability)</span>
                </span>
                <span className="flex items-center gap-1.5 text-accent-purple font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-accent-purple" />
                  <span>Fan-Out (Orchestration)</span>
                </span>
              </div>
            </div>

            {/* Architecture Diagnostic Checklist */}
            <div className="bg-bg-panel border border-border-subtle rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary mb-3">
                  <ShieldAlert className="w-4 h-4 text-accent-green" />
                  <span>Architecture Quality Audit</span>
                </div>

                <div className="space-y-3">
                  {/* Cycles Check */}
                  <div className="p-3 rounded-xl bg-bg-main border border-border-subtle flex items-start gap-3">
                    {(s?.circular_cycles_count || 0) === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-text-primary">Circular Dependency Cycles</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {(s?.circular_cycles_count || 0) === 0
                          ? 'Zero circular import cycles detected across repository.'
                          : `${s?.circular_cycles_count} cycles found. Refactor into shared interfaces.`}
                      </div>
                    </div>
                  </div>

                  {/* Dependency Resolution Check */}
                  <div className="p-3 rounded-xl bg-bg-main border border-border-subtle flex items-start gap-3">
                    {(s?.unresolved_dependencies_count || 0) === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-green mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-accent-amber mt-0.5 flex-shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-text-primary">Import & Package Resolution</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {(s?.unresolved_dependencies_count || 0) === 0
                          ? 'All local file specifiers successfully mapped to AST targets.'
                          : `${s?.unresolved_dependencies_count} unresolved imports require aliases or path checks.`}
                      </div>
                    </div>
                  </div>

                  {/* Hotspots Check */}
                  <div className="p-3 rounded-xl bg-bg-main border border-border-subtle flex items-start gap-3">
                    <Flame className="w-4 h-4 text-accent-amber mt-0.5 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-text-primary">Defect Density & Churn Risk</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {gitHotspots?.hotspots?.length
                          ? `${gitHotspots.hotspots.length} active churn hotspots tracked with Git commits.`
                          : 'No high-risk churn hotspots identified in recent history.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle mt-4 flex items-center justify-between text-xs">
                <span className="text-text-muted">Need a deeper audit?</span>
                <button
                  onClick={() => navigate('/quality')}
                  className="text-accent-blue hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Open Quality Report</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Dual Lists: Most Connected & Largest Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Connected Modules */}
            <div className="bg-bg-panel border border-border-subtle rounded-2xl p-5 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-accent-blue" />
                  <span>Most Connected Architecture Nodes</span>
                </span>
                <span className="text-[11px] text-text-muted font-mono">Ranked by Link Degree</span>
              </div>

              <div className="space-y-2 flex-1">
                {s?.top_connected_files && s.top_connected_files.length > 0 ? (
                  s.top_connected_files.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-bg-main hover:bg-bg-elevated border border-border-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-bg-secondary flex items-center justify-center text-[10px] font-mono text-text-muted flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-text-primary truncate max-w-sm" title={item.file}>
                          {item.file}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                        {item.connections} links
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-muted italic py-6 text-center">No dependencies analyzed yet</div>
                )}
              </div>
            </div>

            {/* Largest Source Files */}
            <div className="bg-bg-panel border border-border-subtle rounded-2xl p-5 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-accent-cyan" />
                  <span>Largest Codebase Files</span>
                </span>
                <span className="text-[11px] text-text-muted font-mono">Ranked by Total Lines</span>
              </div>

              <div className="space-y-2 flex-1">
                {s?.largest_files && s.largest_files.length > 0 ? (
                  s.largest_files.slice(0, 6).map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-bg-main hover:bg-bg-elevated border border-border-subtle transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-bg-secondary flex items-center justify-center text-[10px] font-mono text-text-muted flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-text-primary truncate max-w-sm" title={f.file}>
                          {f.file}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono bg-bg-panel border border-border-subtle text-text-muted">
                          {f.language}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium text-text-secondary">
                        {f.lines.toLocaleString()} LOC
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-muted italic py-6 text-center">No files scanned</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coupling & Instability Analysis */}
      {activeTab === 'coupling' && (
        <div className="space-y-6">
          <div className="bg-bg-panel border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-accent-cyan" />
                  <span>Module Coupling Distribution (Fan-In vs Fan-Out)</span>
                </h3>
                <p className="text-xs text-text-muted mt-1 max-w-2xl">
                  <strong>Fan-In</strong> indicates how many internal files import this module (Responsibility & Reusability).
                  <strong> Fan-Out</strong> indicates how many internal dependencies this module imports (Coupling & Instability).
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-accent-cyan">
                  <span className="w-3 h-3 rounded-sm bg-accent-cyan" />
                  <span>Fan-In (Dependants)</span>
                </span>
                <span className="flex items-center gap-1.5 text-accent-purple">
                  <span className="w-3 h-3 rounded-sm bg-accent-purple" />
                  <span>Fan-Out (Dependencies)</span>
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              {couplingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={couplingData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke={PALETTE.textMuted}
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke={PALETTE.textMuted} fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#151B25',
                        borderColor: '#283244',
                        fontSize: '11px',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                      formatter={(value: any, name: any) => [value, name]}
                    />
                    <Legend />
                    <Bar dataKey="fanIn" name="Fan-In (Incoming Dependants)" fill={PALETTE.cyan} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fanOut" name="Fan-Out (Outgoing Dependencies)" fill={PALETTE.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-text-muted">
                  <Boxes className="w-10 h-10 text-text-muted/30 mb-2" />
                  <p className="font-semibold text-text-secondary text-sm">No Coupled Modules Detected</p>
                  <p className="text-xs text-text-muted mt-1">This codebase does not contain internal cross-file dependencies.</p>
                </div>
              )}
            </div>
          </div>

          {/* Coupling Breakdown Table */}
          <div className="bg-bg-panel border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-subtle bg-bg-secondary/40 flex items-center justify-between text-xs font-semibold">
              <span>Detailed Module Coupling Ratios</span>
              <span className="text-text-muted font-mono font-normal">Martin Instability Metric: I = FanOut / (FanIn + FanOut)</span>
            </div>
            <div className="divide-y divide-border-subtle/50 text-xs font-mono">
              {couplingData.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (item.fileId) openSourceViewer(item.fileId);
                  }}
                  className={`p-3.5 hover:bg-bg-elevated flex items-center justify-between gap-4 transition-colors ${
                    item.fileId ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="overflow-hidden space-y-0.5">
                    <span className="text-text-primary font-medium hover:text-accent-blue truncate block">
                      {item.fullPath}
                    </span>
                    <span className="text-[11px] text-text-muted font-sans">
                      {item.fanIn > item.fanOut ? 'Stable Foundation (High Fan-In)' : 'High Volatility (High Fan-Out)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-5 flex-shrink-0 text-xs">
                    <span className="flex items-center gap-1 text-accent-cyan" title="Fan-in">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>{item.fanIn} in</span>
                    </span>
                    <span className="flex items-center gap-1 text-accent-purple" title="Fan-out">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{item.fanOut} out</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border font-bold ${
                        (item.instability || 0) > 0.7
                          ? 'bg-accent-amber/15 border-accent-amber/30 text-accent-amber'
                          : 'bg-accent-blue/15 border-accent-blue/30 text-accent-blue'
                      }`}
                      title="Instability Index (0 = maximally stable, 1 = maximally unstable)"
                    >
                      I: {item.instability ?? '0.00'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Scale & Complexity Curve */}
      {activeTab === 'complexity' && (
        <div className="space-y-6">
          <div className="bg-bg-panel border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent-cyan" />
                  <span>Lines of Code vs McCabe Cyclomatic Complexity</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Correlates physical module size with branching density to highlight maintainability risk.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-accent-blue">
                  <span className="w-3 h-3 rounded-sm bg-accent-blue" />
                  <span>Lines of Code</span>
                </span>
                <span className="flex items-center gap-1.5 text-accent-amber">
                  <span className="w-3 h-3 rounded-sm bg-accent-amber" />
                  <span>Cyclomatic Score</span>
                </span>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scaleData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorLines" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE.blue} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PALETTE.blue} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={PALETTE.textMuted}
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke={PALETTE.textMuted} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151B25',
                      borderColor: '#283244',
                      fontSize: '11px',
                      borderRadius: '10px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="lines"
                    name="Lines of Code (LOC)"
                    stroke={PALETTE.blue}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLines)"
                  />
                  <Bar dataKey="complexity" name="McCabe Cyclomatic Score" fill={PALETTE.amber} radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Git Velocity & Hotspots */}
      {activeTab === 'hotspots' && (
        <div className="space-y-6">
          <div className="bg-bg-panel border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Flame className="w-4 h-4 text-accent-red" />
                  <span>Git Churn Velocity & Code Hotspots</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Files exhibiting frequent revision activity alongside high structural complexity are prioritized candidates for bugs.
                </p>
              </div>

              {gitHotspots?.is_git_repo && (
                <div className="flex items-center gap-2 text-xs font-mono text-text-secondary bg-bg-main px-3 py-1.5 rounded-lg border border-border-subtle">
                  <GitCommit className="w-3.5 h-3.5 text-accent-blue" />
                  <span>{gitHotspots.total_commits_analyzed} commits analyzed</span>
                </div>
              )}
            </div>

            {hotspotChartData.length > 0 ? (
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hotspotChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLine} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke={PALETTE.textMuted}
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke={PALETTE.textMuted} fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#151B25',
                        borderColor: '#283244',
                        fontSize: '11px',
                        borderRadius: '10px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="churnScore" name="Risk Churn Score (0-100)" fill={PALETTE.red} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="commits" name="Total Commits" fill={PALETTE.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-text-muted italic">
                {gitHotspots?.is_git_repo
                  ? 'No active Git hotspots detected in recent commit logs.'
                  : 'Git commit history is not available for this project directory.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
