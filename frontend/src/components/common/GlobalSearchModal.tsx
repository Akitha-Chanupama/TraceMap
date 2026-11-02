import React, { useState, useEffect } from 'react';
import { Search, FileCode, Code, Package, X, ArrowRight } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { request } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ files: any[]; symbols: any[]; packages: string[] }>({
    files: [],
    symbols: [],
    packages: [],
  });

  useEffect(() => {
    if (!query.trim() || !currentProject) {
      setResults({ files: [], symbols: [], packages: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await request<any>(`/projects/${currentProject.id}/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, currentProject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-bg-panel border border-border-subtle rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-100">
        <div className="p-3 border-b border-border-subtle flex items-center gap-3">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Search files, classes, components, functions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {results.files.length === 0 && results.symbols.length === 0 && query && (
            <div className="text-center py-8 text-text-muted">No matches found for "{query}"</div>
          )}

          {results.files.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Files</div>
              <div className="space-y-1">
                {results.files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      openSourceViewer(f.id);
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCode className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <span className="font-medium text-text-primary truncate">{f.name}</span>
                      <span className="text-text-muted text-[11px] truncate">{f.path}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.symbols.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Symbols</div>
              <div className="space-y-1">
                {results.symbols.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      openSourceViewer(s.file_id);
                      onClose();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Code className="w-3.5 h-3.5 text-accent-blue flex-shrink-0" />
                      <span className="font-medium text-text-primary truncate">{s.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-bg-main border border-border-subtle text-accent-purple capitalize">
                        {s.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">L{s.line}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

