import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Layers, Code, ArrowUpRight, ArrowDownLeft, EyeOff } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { analysisApi } from '../services/analysisApi';
import { ComplexityReportResponse, UnusedSymbolItem } from '../types/analysis';

export const CodeQualityPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const [complexityData, setComplexityData] = useState<ComplexityReportResponse | null>(null);
  const [unusedSymbols, setUnusedSymbols] = useState<UnusedSymbolItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);

    Promise.all([
      analysisApi.getComplexity(currentProject.id),
      analysisApi.getUnusedSymbols(currentProject.id),
    ])
      .then(([comp, unused]) => {
        setComplexityData(comp);
        setUnusedSymbols(unused);
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
          Measurable, explainable static metrics: Lines of Code, McCabe Cyclomatic Complexity, Fan-in, Fan-out, and structural risk indicators.
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
