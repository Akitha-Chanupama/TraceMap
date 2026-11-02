import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, ArrowDownLeft, AlertCircle, Info, Search, FileCode } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { analysisApi } from '../services/analysisApi';
import { fileApi } from '../services/fileApi';
import { ImpactAnalysisResponse } from '../types/analysis';
import { FileItem } from '../types/file';

export const ImpactAnalysisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fileParam = searchParams.get('file');

  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(fileParam || '');
  const [impactData, setImpactData] = useState<ImpactAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    fileApi
      .listFiles(currentProject.id, { page: 1, page_size: 500 })
      .then((data) => {
        setFiles(data);
        if (!selectedFile && data.length > 0) {
          setSelectedFile(data[0].relative_path);
        }
      })
      .catch((err) => console.error(err));
  }, [currentProject]);

  useEffect(() => {
    if (!selectedFile || !currentProject) return;
    setIsLoading(true);
    setError(null);
    analysisApi
      .getImpactAnalysis(currentProject.id, selectedFile)
      .then((res) => setImpactData(res))
      .catch((err) => setError(err.message || 'Failed to calculate blast radius'))
      .finally(() => setIsLoading(false));
  }, [selectedFile, currentProject]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-blue" />
            <span>Blast Radius & Impact Analysis</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Reverse dependency traversal calculates which modules may be affected if a selected file is modified.
          </p>
        </div>
      </div>

      {/* Target Selector */}
      <div className="bg-bg-panel border border-border-subtle rounded-xl p-4 flex items-center gap-4">
        <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5 flex-shrink-0">
          <FileCode className="w-4 h-4 text-accent-blue" />
          <span>Target File:</span>
        </label>

        <select
          value={selectedFile}
          onChange={(e) => {
            setSelectedFile(e.target.value);
            setSearchParams({ file: e.target.value });
          }}
          className="flex-1 bg-bg-main border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue"
        >
          {files.map((f) => (
            <option key={f.id} value={f.relative_path}>
              {f.relative_path} ({f.language})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      {impactData && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">Direct Dependants (Depth 1)</div>
            <div className="text-2xl font-bold font-mono text-accent-cyan">
              {impactData.direct_dependants.length}
            </div>
          </div>
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">Transitive Dependants (Depth 2+)</div>
            <div className="text-2xl font-bold font-mono text-accent-purple">
              {impactData.transitive_dependants.length}
            </div>
          </div>
          <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
            <div className="text-xs text-text-muted mb-1">Max Propagation Depth</div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {impactData.max_depth} levels
            </div>
          </div>
        </div>
      )}

      {/* Advisory Banner */}
      <div className="p-3.5 bg-accent-blue/10 border border-accent-blue/30 rounded-xl flex items-start gap-3 text-xs text-accent-blue">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Static Impact Notice: </span>
          <span>{impactData?.explanation || 'Static impact analysis shows structural import dependencies.'}</span>
        </div>
      </div>

      {/* Results Columns */}
      {impactData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Direct Dependants */}
          <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-accent-cyan" />
                <span>Direct Dependants ({impactData.direct_dependants.length})</span>
              </span>
              <span className="text-[10px] text-text-muted">Level 1</span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {impactData.direct_dependants.length === 0 ? (
                <div className="text-xs text-text-muted italic py-6 text-center">
                  No internal files directly import this file.
                </div>
              ) : (
                impactData.direct_dependants.map((dep, idx) => (
                  <div
                    key={idx}
                    onClick={() => dep.file_id && openSourceViewer(dep.file_id)}
                    className="p-3 rounded-lg bg-bg-main border border-border-subtle hover:border-accent-cyan/40 cursor-pointer transition-colors"
                  >
                    <div className="font-mono text-xs text-text-primary truncate">{dep.relative_path}</div>
                    {dep.via_import && (
                      <div className="text-[11px] font-mono text-text-muted truncate mt-1">
                        ↳ {dep.via_import}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transitive Dependants */}
          <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-accent-purple" />
                <span>Transitive Dependants ({impactData.transitive_dependants.length})</span>
              </span>
              <span className="text-[10px] text-text-muted">Level 2+</span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {impactData.transitive_dependants.length === 0 ? (
                <div className="text-xs text-text-muted italic py-6 text-center">
                  No transitive dependants detected.
                </div>
              ) : (
                impactData.transitive_dependants.map((dep, idx) => (
                  <div
                    key={idx}
                    onClick={() => dep.file_id && openSourceViewer(dep.file_id)}
                    className="p-3 rounded-lg bg-bg-main border border-border-subtle hover:border-accent-purple/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between font-mono text-xs text-text-primary">
                      <span className="truncate">{dep.relative_path}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-bg-elevated text-accent-purple">
                        Depth {dep.depth}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
