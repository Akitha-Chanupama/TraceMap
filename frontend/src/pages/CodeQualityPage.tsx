import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Layers,
  Code,
  ArrowUpRight,
  ArrowDownLeft,
  EyeOff,
  Flame,
  GitCommit,
  Users,
  GitBranch,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { analysisApi } from '../services/analysisApi';
import { ComplexityReportResponse, UnusedSymbolItem, GitHotspotsResponse } from '../types/analysis';

export const CodeQualityPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const [complexityData, setComplexityData] = useState<ComplexityReportResponse | null>(null);
  const [unusedSymbols, setUnusedSymbols] = useState<UnusedSymbolItem[]>([]);
  const [gitHotspots, setGitHotspots] = useState<GitHotspotsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);

    Promise.all([
      analysisApi.getComplexity(currentProject.id),
      analysisApi.getUnusedSymbols(currentProject.id),
      analysisApi.getGitHotspots(currentProject.id).catch((err) => {
        console.warn('Git hotspots unavailable', err);
        return null;
      }),
    ])
      .then(([comp, unused, hotspots]) => {
        setComplexityData(comp);
        setUnusedSymbols(unused);
        if (hotspots) {
          setGitHotspots(hotspots);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent-cyan" />
          <span>Code Quality & Complexity Report</span>
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Measurable, explainable metrics: Lines of Code, Cyclomatic Complexity, Fan-in/Fan-out, and Git Churn Hotspots.
        </p>
      </div>

      {/* Summary Cards */}
      {complexityData && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">Total Analyzed Lines</div>
            <div className="text-xl font-bold font-mono text-text-primary">
              {complexityData.total_lines_of_code.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">Avg Cyclomatic Complexity / File</div>
            <div className="text-xl font-bold font-mono text-accent-cyan">
              {complexityData.average_complexity}
            </div>
          </div>
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">High Complexity Files Flagged</div>
            <div className="text-xl font-bold font-mono text-accent-amber">
              {complexityData.high_complexity_files.length}
            </div>
          </div>
        </div>
      )}

      {/* Git Churn & Hotspots Section */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border-subtle bg-bg-secondary text-xs font-semibold text-text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent-red" />
            <span>Git Churn & Code Hotspots</span>
          </div>
          {gitHotspots?.is_git_repo ? (
            <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-mono">
              <GitCommit className="w-3.5 h-3.5 text-accent-blue" />
              <span>{gitHotspots.total_commits_analyzed} revisions analyzed</span>
            </span>
          ) : (
            <span className="text-[11px] text-text-muted italic">Git log not detected</span>
          )}
        </div>

        {gitHotspots?.is_git_repo ? (
          <div>
            {/* Top Authors & Hotspots Snapshot */}
            {gitHotspots.top_authors && gitHotspots.top_authors.length > 0 && (
              <div className="p-3 border-b border-border-subtle/60 bg-bg-elevated/40 flex items-center gap-4 text-xs">
                <span className="text-text-muted flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-accent-purple" />
                  <span>Top Contributors:</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {gitHotspots.top_authors.slice(0, 5).map((auth) => (
                    <span
                      key={auth.author}
                      className="px-2 py-0.5 rounded bg-bg-main border border-border-subtle text-[11px] font-mono text-text-secondary"
                    >
                      {auth.author} ({auth.commits})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hotspots List */}
            <div className="divide-y divide-border-subtle/50 text-xs">
              {gitHotspots.hotspots && gitHotspots.hotspots.length > 0 ? (
                gitHotspots.hotspots.map((item) => (
                  <div
                    key={item.relative_path}
                    onClick={() => {
                      if (item.file_id) openSourceViewer(item.file_id);
                    }}
                    className={`p-3.5 hover:bg-bg-elevated flex items-center justify-between gap-4 transition-colors ${
                      item.file_id ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-text-primary hover:text-accent-blue truncate">
                          {item.relative_path}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                            item.hotspot_level === 'critical'
                              ? 'bg-accent-red/20 text-accent-red border border-accent-red/35 animate-pulse'
                              : item.hotspot_level === 'high'
                              ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/35'
                              : item.hotspot_level === 'medium'
                              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/35'
                              : 'bg-accent-green/20 text-accent-green border border-accent-green/35'
                          }`}
                        >
                          {item.hotspot_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">{item.risk_summary}</p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 font-mono text-xs">
                      <span className="text-text-muted" title="Commits modifying this file">
                        {item.commit_count} commits
                      </span>
                      <span className="text-accent-green" title="Lines added">
                        +{item.lines_added.toLocaleString()}
                      </span>
                      <span className="text-accent-red" title="Lines deleted">
                        -{item.lines_deleted.toLocaleString()}
                      </span>
                      <span className="text-text-muted" title="Unique authors">
                        {item.author_count} auth
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border font-bold ${
                          item.hotspot_level === 'critical'
                            ? 'bg-accent-red/15 border-accent-red/30 text-accent-red'
                            : item.hotspot_level === 'high'
                            ? 'bg-accent-amber/15 border-accent-amber/30 text-accent-amber'
                            : 'bg-bg-main border-border-subtle text-accent-blue'
                        }`}
                        title="Risk Score based on Churn and Complexity"
                      >
                        Churn: {item.churn_score}/100
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-text-muted italic">
                  No active Git churn hotspots detected in repository history.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-text-muted space-y-1">
            <GitBranch className="w-6 h-6 text-text-muted mx-auto opacity-50 mb-2" />
            <p className="font-medium text-text-secondary">Local Git History Not Available</p>
            <p className="text-[11px]">
              {gitHotspots?.message ||
                'This folder is not recognized as a Git repository. Initialize git and commit changes to unlock hotspot overlays.'}
            </p>
          </div>
        )}
      </div>

      {/* High Complexity Modules Table */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border-subtle bg-bg-secondary text-xs font-semibold text-text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-amber" />
            <span>Highest Complexity & Coupling Files</span>
          </div>
          <span className="text-[11px] text-text-muted">Ranked by Cyclomatic Score</span>
        </div>

        <div className="divide-y divide-border-subtle/50 text-xs">
          {complexityData?.high_complexity_files && complexityData.high_complexity_files.length > 0 ? (
            complexityData.high_complexity_files.map((item) => (
              <div
                key={item.file_id}
                onClick={() => openSourceViewer(item.file_id)}
                className="p-3.5 hover:bg-bg-elevated flex items-center justify-between gap-4 transition-colors cursor-pointer"
              >
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-text-primary hover:text-accent-blue truncate">
                      {item.relative_path}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-bg-main border border-border-subtle uppercase text-text-muted">
                      {item.language}
                    </span>
                  </div>
                  {item.warnings.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.warnings.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-accent-amber/10 text-accent-amber border border-accent-amber/20"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 font-mono text-xs">
                  <span className="text-text-muted" title="Lines of Code">
                    {item.lines_of_code} LOC
                  </span>
                  <span className="flex items-center gap-0.5 text-accent-cyan" title="Fan-in">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>{item.fan_in}</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-accent-purple" title="Fan-out">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{item.fan_out}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-bg-main border border-border-subtle text-accent-amber font-bold">
                    Cyclo: {item.cyclomatic_complexity}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-text-muted italic">
              All files within recommended complexity thresholds.
            </div>
          )}
        </div>
      </div>

      {/* Cautious Potential Unused Symbols */}
      {unusedSymbols.length > 0 && (
        <div className="bg-bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-border-subtle bg-bg-secondary text-xs font-semibold text-text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-text-muted" />
              <span>Cautious Static Unreferenced Exports</span>
            </div>
            <span className="text-[11px] text-text-muted">Potential Dead Code Candidates</span>
          </div>

          <div className="divide-y divide-border-subtle/50 text-xs max-h-72 overflow-y-auto">
            {unusedSymbols.map((item) => (
              <div key={item.symbol_id} className="p-3 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-text-primary font-medium truncate">{item.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-bg-main border border-border-subtle text-accent-blue uppercase">
                      {item.symbol_type}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                    {item.relative_path}:L{item.line_number}
                  </div>
                </div>
                <span className="text-[10px] text-text-muted italic flex-shrink-0">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
