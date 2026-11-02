import React from 'react';
import { Circle, Database, GitCommit, FileCode, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

export const StatusBar: React.FC = () => {
  const { currentProject, analysisProgress } = useProjectStore();

  const isScanningOrParsing =
    currentProject?.analysis_status === 'scanning' ||
    currentProject?.analysis_status === 'parsing' ||
    currentProject?.analysis_status === 'resolving' ||
    analysisProgress.isAnalyzing;

  return (
    <footer className="h-7 bg-bg-secondary border-t border-border-subtle flex items-center justify-between px-3 text-[11px] text-text-muted select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Circle className="w-2 h-2 fill-accent-green text-accent-green" />
          <span>Local Engine (127.0.0.1:8000)</span>
        </div>

        {currentProject && (
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-text-secondary" />
            <span className="text-text-secondary">{currentProject.project_type || 'Polyglot'}</span>
          </div>
        )}

        {isScanningOrParsing && (
          <div className="flex items-center gap-1.5 text-accent-cyan">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="capitalize">
              {analysisProgress.phase}: {analysisProgress.current} / {analysisProgress.total || '?'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {currentProject?.last_analyzed_at && (
          <span>
            Last indexed: {new Date(currentProject.last_analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <span>SQLite WAL • 100% Offline</span>
      </div>
    </footer>
  );
};

