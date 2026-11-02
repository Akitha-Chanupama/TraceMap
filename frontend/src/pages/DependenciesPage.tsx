import React, { useEffect, useState } from 'react';
import { Boxes, Package, AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { analysisApi } from '../services/analysisApi';
import { UnresolvedDependencyItem } from '../types/analysis';

export const DependenciesPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const [unresolved, setUnresolved] = useState<UnresolvedDependencyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    setIsLoading(true);
    analysisApi
      .getUnresolvedDependencies(currentProject.id)
      .then(setUnresolved)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [currentProject]);

  const filtered = unresolved.filter(
    (u) =>
      u.source_relative_path.toLowerCase().includes(search.toLowerCase()) ||
      u.import_statement.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Boxes className="w-5 h-5 text-accent-green" />
            <span>Dependency Inspector</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Tracks unresolved local imports, missing aliases, and external library packages.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-bg-panel border border-border-subtle text-xs font-mono">
          <span className="text-text-muted">Unresolved Imports: </span>
          <span className="font-bold text-accent-amber">{unresolved.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by file or statement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-panel border border-border-subtle rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>
      </div>

      <div className="bg-bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border-subtle bg-bg-secondary text-xs font-semibold text-text-primary flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-amber" />
          <span>Unresolved Imports</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted italic">
            No unresolved imports found in this project.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/50">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 hover:bg-bg-elevated flex items-center justify-between gap-4 transition-colors text-xs"
              >
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => openSourceViewer(item.source_file_id)}
                      className="font-mono font-medium text-accent-blue hover:underline cursor-pointer truncate"
                      title={item.source_relative_path}
                    >
                      {item.source_relative_path}
                    </span>
                    {item.line_number && (
                      <span className="text-[10px] text-text-muted font-mono">Line {item.line_number}</span>
                    )}
                  </div>
                  <div className="font-mono text-text-secondary text-[11px] truncate" title={item.import_statement}>
                    {item.import_statement}
                  </div>
                  <div className="text-[10px] text-text-muted">{item.possible_reason}</div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-amber/15 text-accent-amber border border-accent-amber/30 flex-shrink-0">
                  Unresolved
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
