import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useGraphStore } from '../stores/graphStore';
import { analysisApi } from '../services/analysisApi';
import { CircularDependenciesResponse, CircularDependencyCycle } from '../types/analysis';

export const CircularDependenciesPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { setHighlightedCycleIds, setGraphMode } = useGraphStore();
  const [data, setData] = useState<CircularDependenciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    analysisApi
      .getCircularDependencies(currentProject.id)
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  const handleHighlightCycle = (cycle: CircularDependencyCycle) => {
    const nodeIds = cycle.participants.map((p) => `file_${p.file_id}`);
    setHighlightedCycleIds(nodeIds);
    setGraphMode('file_dependency');
    navigate('/architecture');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-accent-red" />
            <span>Circular Dependency Cycles</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Detects mutual and indirect cyclic dependencies using Tarjan's strongly connected components algorithm.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-bg-panel border border-border-subtle text-xs font-mono">
          <span className="text-text-muted">Detected Cycles: </span>
          <span className="font-bold text-accent-red">{data?.total_cycles || 0}</span>
        </div>
      </div>

      {data && data.total_cycles === 0 ? (
        <div className="p-12 bg-bg-panel border border-border-subtle rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-accent-green/15 text-accent-green flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Clean Architecture</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Zero circular dependencies detected in this codebase. All modules follow unidirectional dependency flow.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data?.cycles.map((cycle, idx) => (
            <div
              key={cycle.cycle_id || idx}
              className="bg-bg-panel border border-accent-red/30 rounded-xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-accent-red/15 text-accent-red flex items-center justify-center text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">
                    {cycle.length}-Node Cycle Loop
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-red/15 text-accent-red border border-accent-red/30">
                    {cycle.severity} Severity
                  </span>
                </div>

                <button
                  onClick={() => handleHighlightCycle(cycle)}
                  className="px-3 py-1.5 bg-accent-red/15 hover:bg-accent-red/25 border border-accent-red/30 text-accent-red rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Highlight on Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cycle Chain */}
              <div className="p-3 bg-bg-main border border-border-subtle rounded-lg space-y-2">
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Cycle Flow
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {cycle.participants.map((part, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-text-secondary">
                      <span className="text-accent-red font-bold">↳</span>
                      <span className="text-text-primary font-medium">{part.relative_path}</span>
                      {part.imports_next && (
                        <span className="text-[11px] text-text-muted truncate max-w-md">
                          ({part.imports_next})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
