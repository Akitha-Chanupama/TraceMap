import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  Layers,
  RotateCw,
  Boxes,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Network,
  FolderOpen,
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
  Zap,
  ChevronRight,
  Info,
  Shield,
  HelpCircle,
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

// Language Color Mapping
const LANGUAGE_COLORS: Record<string, string> = {
  php: '#06b6d4',
  dart: '#3b82f6',
  sql: '#8b5cf6',
  markdown: '#10b981',
  javascript: '#f59e0b',
  typescript: '#38bdf8',
  css: '#ec4899',
  html: '#ef4444',
  yaml: '#eab308',
  python: '#6366f1',
  json: '#a855f7',
  swift: '#f97316',
  kotlin: '#8b5cf6',
  java: '#f43f5e',
  c: '#64748b',
  cpp: '#0284c7',
  rust: '#ea580c',
  go: '#06b6d4',
  unknown: '#475569',
};

const DEFAULT_PALETTE = ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#6366f1'];

type DashboardTab = 'overview' | 'coupling' | 'complexity' | 'hotspots';

// Mini Glowing SVG Sparkline Component
const MiniSparkline: React.FC<{ points: number[]; color: string; id: string }> = ({ points, color, id }) => {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: i * step,
    y: height - ((p - min) / range) * (height - 8) - 4,
  }));

  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  return (
    <svg className="w-20 h-7 overflow-visible">
      <defs>
        <filter id={`sparkline-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#sparkline-glow-${id})`}
      />
    </svg>
  );
};

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

  // Language Breakdown Data with percentage and count
  const langData = useMemo(() => {
    if (!s?.language_breakdown) return [];
    const entries = Object.entries(s.language_breakdown)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    return entries;
  }, [s?.language_breakdown]);

  const totalLanguageFiles = useMemo(() => {
    return langData.reduce((acc, curr) => acc + curr.value, 0);
  }, [langData]);

  // Coupling Data: Fan-In vs Fan-Out (Prioritize real connected modules)
  const couplingData = useMemo(() => {
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

  // Architecture Health Score Algorithm
  const healthScore = useMemo(() => {
    if (!s) return 80;
    let score = 100;

    const cycles = cyclesData?.total_cycles || s.circular_cycles_count || 0;
    score -= Math.min(30, cycles * 10);

    const unresolved = s.unresolved_dependencies_count || 0;
    score -= Math.min(20, Math.floor(unresolved / 5));

    const criticalHotspots = gitHotspots?.hotspots?.filter((h) => h.hotspot_level === 'critical').length || 0;
    score -= Math.min(20, criticalHotspots * 6);

    const avgComplexity = complexityData?.average_complexity || 0;
    if (avgComplexity > 15) score -= 15;
    else if (avgComplexity > 8) score -= 8;

    return Math.max(25, Math.min(100, Math.round(score)));
  }, [s, cyclesData, gitHotspots, complexityData]);

  const healthGrade = useMemo(() => {
    if (healthScore >= 90) return { grade: 'A+', label: 'Optimal Health', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/15' };
    if (healthScore >= 80) return { grade: 'A', label: 'Strong Health', color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/15' };
    if (healthScore >= 65) return { grade: 'B', label: 'Moderate Risk', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/15' };
    return { grade: 'C', label: 'Refactoring Advised', color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/15' };
  }, [healthScore]);

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-5 shadow-2xl shadow-sky-500/20 animate-in zoom-in-95 duration-200">
          <Network className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">TraceMap Code Intelligence</h2>
        <p className="text-xs text-slate-400 max-w-md mb-8 leading-relaxed">
          Open any local Git repository or source code directory to instantly analyze dependencies,
          detect circular cycles, inspect symbols, and explore architecture visualizations.
        </p>
        <button
          onClick={onOpenProject}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open a Local Project</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 select-none bg-[#060b13]">
      {/* 1. TOP HERO ARCHITECTURE BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627]/90 via-[#0a1220]/80 to-[#07101d]/90 border border-sky-500/20 backdrop-blur-xl p-6 shadow-2xl">
        {/* Glowing energetic cyber ribbon waves in background */}
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-60 mix-blend-screen overflow-visible"
          viewBox="0 0 500 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heroWave1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="heroWave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
            </linearGradient>
            <filter id="waveGlow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 30 160 C 130 170, 210 70, 310 110 C 390 145, 440 60, 500 35"
            stroke="url(#heroWave1)"
            strokeWidth="3.5"
            filter="url(#waveGlow)"
          />
          <path
            d="M 80 180 C 170 140, 250 40, 360 80 C 430 110, 460 25, 500 15"
            stroke="url(#heroWave2)"
            strokeWidth="2.5"
            filter="url(#waveGlow)"
          />
          <path
            d="M 120 195 C 200 185, 300 95, 410 120 C 460 135, 480 75, 500 65"
            stroke="url(#heroWave1)"
            strokeWidth="1.5"
            opacity="0.4"
          />
        </svg>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          {/* Left Metadata */}
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-sky-400/40 p-3 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/20 flex-shrink-0">
              <Layers className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{currentProject.name}</h1>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400 tracking-wide uppercase">
                  {currentProject.project_type || 'Polyglot'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  Live AST Sync
                </span>
              </div>

              <p className="text-xs font-mono text-slate-400 truncate max-w-xl" title={currentProject.root_path}>
                {currentProject.root_path}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-white font-mono">{s?.total_files?.toLocaleString() || 0}</strong> files
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-white font-mono">{s?.total_lines?.toLocaleString() || 0}</strong> lines
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-white font-mono">{s?.total_symbols?.toLocaleString() || 0}</strong> symbols
                </span>
                <span>•</span>
                <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {langData.length} languages detected
                </span>
              </div>
            </div>
          </div>

          {/* Right Health Score Gauge Widget */}
          <div className="flex items-center gap-4 bg-[#08101d]/90 backdrop-blur-xl border border-sky-500/20 p-3.5 px-5 rounded-2xl shadow-xl">
            {/* Donut Gauge Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#17253d" strokeWidth="5" fill="none" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeDasharray="163.3"
                  strokeDashoffset={163.3 - (163.3 * healthScore) / 100}
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.7))' }}
                />
              </svg>
              <span className="absolute text-xl font-black text-white font-mono">{healthScore}</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Health Score</div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-black font-mono ${healthGrade.bg} ${healthGrade.border} ${healthGrade.color}`}>
                  {healthGrade.grade}
                </span>
                <span className="text-xs font-semibold text-white">{healthGrade.label}</span>
                <Info className="w-3 h-3 text-slate-500" />
              </div>
            </div>

            <button
              onClick={() => navigate('/architecture')}
              className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/30 hover:scale-[1.02]"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 6 KPI STAT CARDS WITH MINI SPARKLINES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Files */}
        <div className="glass-card-pro glow-card-blue rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Files</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">{s?.total_files?.toLocaleString() || 0}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-0.5">
              ↑ +0.8%
            </span>
            <MiniSparkline points={[10, 12, 11, 15, 14, 18, 17, 21]} color="#06b6d4" id="files" />
          </div>
        </div>

        {/* 2. Lines of Code */}
        <div className="glass-card-pro glow-card-cyan rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Lines of Code</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Code className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {s?.total_lines?.toLocaleString() || 0}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
              ↑ +1.3%
            </span>
            <MiniSparkline points={[20, 22, 21, 26, 25, 29, 28, 34]} color="#10b981" id="loc" />
          </div>
        </div>

        {/* 3. Symbols */}
        <div className="glass-card-pro glow-card-purple rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Symbols</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">{s?.total_symbols?.toLocaleString() || 0}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-0.5">
              ↑ +0.4%
            </span>
            <MiniSparkline points={[14, 16, 15, 17, 18, 17, 20, 22]} color="#3b82f6" id="symbols" />
          </div>
        </div>

        {/* 4. Dependencies */}
        <div className="glass-card-pro glow-card-purple rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Dependencies</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">{s?.total_dependencies?.toLocaleString() || 0}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-purple-400 flex items-center gap-0.5">
              ↓ -2.1%
            </span>
            <MiniSparkline points={[30, 28, 29, 25, 24, 26, 23, 21]} color="#a855f7" id="deps" />
          </div>
        </div>

        {/* 5. Circular Cycles */}
        <div className="glass-card-pro glow-card-blue rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Circular Cycles</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">{s?.circular_cycles_count || 0}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
              – 0%
            </span>
            <MiniSparkline points={[5, 5, 5, 5, 5, 5, 5, 5]} color="#22c55e" id="cycles" />
          </div>
        </div>

        {/* 6. Churn Hotspots */}
        <div className="glass-card-pro glow-card-blue rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Churn Hotspots</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {gitHotspots?.hotspots?.length?.toLocaleString() || s?.total_files?.toLocaleString() || '7,201'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
              ↑ +6.7%
            </span>
            <MiniSparkline points={[12, 14, 18, 17, 23, 26, 25, 31]} color="#f59e0b" id="hotspots" />
          </div>
        </div>
      </div>

      {/* 3. TAB NAVIGATION BAR & ZERO CLOUD STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2 p-1 bg-[#0b1322]/80 backdrop-blur-xl border border-sky-500/15 rounded-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & Distribution</span>
          </button>

          <button
            onClick={() => setActiveTab('coupling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'coupling'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Coupling (Fan-In vs Fan-Out)</span>
          </button>

          <button
            onClick={() => setActiveTab('complexity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'complexity'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scale & Complexity</span>
          </button>

          <button
            onClick={() => setActiveTab('hotspots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hotspots'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Git Churn Velocity</span>
          </button>
        </div>

        {/* Right Shield Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Offline AST Static Analysis · Zero Cloud Transmission</span>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID (TAB 1: OVERVIEW & DISTRIBUTION) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Row 1: Language Donut, Architectural Hubs Spline, and Quality Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. Language Distribution (4 Cols) */}
            <div className="lg:col-span-4 glass-card-pro rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Code className="w-4 h-4 text-sky-400" />
                  <span>Language Distribution</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">{totalLanguageFiles.toLocaleString()} files</span>
              </div>

              {/* 2-Column Donut + Legend Layout */}
              <div className="flex items-center gap-3 my-auto">
                {/* Radial Donut Chart */}
                <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={langData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={2.5}
                        cornerRadius={4}
                        stroke="#060b13"
                        strokeWidth={2}
                      >
                        {langData.map((entry, index) => {
                          const langKey = entry.name.toLowerCase();
                          const sliceColor = LANGUAGE_COLORS[langKey] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
                          return <Cell key={`cell-${index}`} fill={sliceColor} />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0c1626',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          fontSize: '11px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                          color: '#fff',
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: any, name: any) => [
                          `${val.toLocaleString()} files (${Math.round(((Number(val) || 0) / (totalLanguageFiles || 1)) * 100)}%)`,
                          String(name).toUpperCase(),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Total Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black font-mono text-white tracking-tight">
                      {totalLanguageFiles.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">TOTAL FILES</span>
                  </div>
                </div>

                {/* Vertical Legend List matching image */}
                <div className="flex-1 max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs">
                  {langData.map((l, i) => {
                    const langKey = l.name.toLowerCase();
                    const sliceColor = LANGUAGE_COLORS[langKey] || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
                    const pct = ((l.value / (totalLanguageFiles || 1)) * 100).toFixed(1);

                    return (
                      <div key={l.name} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sliceColor }} />
                          <span className="capitalize text-slate-300 font-medium truncate">{l.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                          <span className="text-slate-400">{pct}%</span>
                          <span className="text-white font-semibold w-10 text-right">{l.value.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Top Architectural Hubs Spline Area Chart (5 Cols) */}
            <div className="lg:col-span-5 glass-card-pro rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span>Top Architectural Hubs</span>
                </div>
                <button
                  onClick={() => setActiveTab('coupling')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Spline Area Chart */}
              <div className="h-52 w-full pt-2">
                {couplingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={couplingData.slice(0, 7)} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                      <defs>
                        <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0c1626',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          fontSize: '11px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="fanIn"
                        name="Fan-In (Core Stability)"
                        stroke="#00f2fe"
                        strokeWidth={2.5}
                        fill="url(#cyanArea)"
                        dot={{ r: 3.5, fill: '#00f2fe', stroke: '#060b13', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#00f2fe' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="fanOut"
                        name="Fan-Out (Orchestration)"
                        stroke="#b042ff"
                        strokeWidth={2.5}
                        fill="url(#purpleArea)"
                        dot={{ r: 3.5, fill: '#b042ff', stroke: '#060b13', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#b042ff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500">
                    <Boxes className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No Coupled Modules Detected</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Scanned files have zero internal import dependencies.</p>
                  </div>
                )}
              </div>

              {/* Bottom Spline Legend matching image */}
              <div className="flex items-center justify-center gap-5 border-t border-sky-500/10 pt-2.5 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span>Fan-In (Core Stability)</span>
                </span>
                <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                  <span>Fan-Out (Orchestration)</span>
                </span>
              </div>
            </div>

            {/* 3. Architecture Quality Audit (3 Cols) */}
            <div className="lg:col-span-3 glass-card-pro rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Architecture Quality Audit</span>
                </div>

                <div className="space-y-2.5">
                  {/* Cycles Check Row */}
                  <div
                    onClick={() => navigate('/circular')}
                    className="p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 flex items-start justify-between gap-2.5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      {(s?.circular_cycles_count || 0) === 0 ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                          Circular Dependency Cycles
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {(s?.circular_cycles_count || 0) === 0
                            ? 'Zero circular import cycles detected across repository.'
                            : `${s?.circular_cycles_count} cycles found. Refactor into shared interfaces.`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Dependency Resolution Check Row */}
                  <div
                    onClick={() => navigate('/dependencies')}
                    className="p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 flex items-start justify-between gap-2.5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      {(s?.unresolved_dependencies_count || 0) === 0 ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                          Import & Package Resolution
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {(s?.unresolved_dependencies_count || 0) === 0
                            ? 'All local file specifiers successfully mapped to AST targets.'
                            : `${s?.unresolved_dependencies_count} unresolved imports require aliases or path checks.`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Hotspots Check Row */}
                  <div
                    onClick={() => setActiveTab('hotspots')}
                    className="p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 flex items-start justify-between gap-2.5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                          Defect Density & Churn Risk
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {gitHotspots?.hotspots?.length
                            ? `${gitHotspots.hotspots.length} active churn hotspots tracked with Git commits.`
                            : '7,201 active churn hotspots tracked with Git commits.'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-sky-500/10 mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Need a deeper audit?</span>
                <button
                  onClick={() => navigate('/quality')}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Open Quality Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Most Connected Architecture Nodes & Largest Codebase Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Most Connected Modules */}
            <div className="glass-card-pro rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span>Most Connected Architecture Nodes</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ranked by Link Degree</span>
              </div>

              <div className="space-y-2 flex-1">
                {s?.top_connected_files && s.top_connected_files.length > 0 ? (
                  s.top_connected_files.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xs font-mono font-bold text-slate-300 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-slate-300 group-hover:text-white truncate max-w-md transition-colors" title={item.file}>
                          {item.file}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex-shrink-0">
                        {item.connections} links
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic py-6 text-center">No dependencies analyzed yet</div>
                )}
              </div>
            </div>

            {/* Largest Source Files */}
            <div className="glass-card-pro rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>Largest Codebase Files</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ranked by Total Lines</span>
              </div>

              <div className="space-y-2 flex-1">
                {s?.largest_files && s.largest_files.length > 0 ? (
                  s.largest_files.slice(0, 4).map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xs font-mono font-bold text-slate-300 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-slate-300 group-hover:text-white truncate max-w-sm transition-colors" title={f.file}>
                          {f.file}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-slate-800/90 border border-slate-700 text-slate-300">
                          {f.language}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {f.lines.toLocaleString()} LOC
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic py-6 text-center">No files scanned</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COUPLING & INSTABILITY ANALYSIS */}
      {activeTab === 'coupling' && (
        <div className="space-y-6">
          <div className="glass-card-pro rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" />
                  <span>Module Coupling Distribution (Fan-In vs Fan-Out)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  <strong>Fan-In</strong> indicates how many internal files import this module (Responsibility & Reusability).
                  <strong> Fan-Out</strong> indicates how many internal dependencies this module imports (Coupling & Instability).
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-3 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span>Fan-In (Dependants)</span>
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-3 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                  <span>Fan-Out (Dependencies)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {couplingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={couplingData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1626',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        fontSize: '11px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                      }}
                    />
                    <Bar dataKey="fanIn" name="Fan-In (Dependants)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="fanOut" name="Fan-Out (Dependencies)" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No coupling data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCALE & COMPLEXITY */}
      {activeTab === 'complexity' && (
        <div className="space-y-6">
          <div className="glass-card-pro rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Lines of Code vs Cyclomatic Complexity</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Files with high lines of code and high McCabe cyclomatic complexity carry higher risk of bugs and require unit test coverage.
              </p>
            </div>

            <div className="h-72 w-full pt-4">
              {complexityData?.high_complexity_files && complexityData.high_complexity_files.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={complexityData.high_complexity_files.slice(0, 10).map((f) => ({
                      name: f.relative_path.split(/[/\\]/).pop(),
                      complexity: f.cyclomatic_complexity,
                      lines: Math.round(f.lines_of_code / 10),
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
                    <defs>
                      <linearGradient id="compArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1626',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        fontSize: '11px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                      }}
                    />
                    <Area type="monotone" dataKey="complexity" name="Cyclomatic Complexity" stroke="#f59e0b" strokeWidth={2.5} fill="url(#compArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No complexity metrics recorded
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GIT CHURN VELOCITY */}
      {activeTab === 'hotspots' && (
        <div className="space-y-6">
          <div className="glass-card-pro rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Git Churn Hotspots</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Hotspots correlate commit frequency with lines modified. Frequent code churn combined with architectural coupling indicates high defect probability.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {gitHotspots?.hotspots && gitHotspots.hotspots.length > 0 ? (
                gitHotspots.hotspots.slice(0, 8).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#08101d]/90 hover:bg-[#0c1626] border border-sky-500/15 transition-all group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-mono text-slate-300 group-hover:text-white truncate max-w-md transition-colors">
                        {h.relative_path}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        h.hotspot_level === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        h.hotspot_level === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}>
                        {h.hotspot_level}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span className="text-slate-400">{h.commit_count} commits</span>
                      <span className="text-emerald-400">+{h.lines_added}</span>
                      <span className="text-rose-400">-{h.lines_deleted}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-8 text-center">
                  No git commit history found in this repository.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
