import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, FileCode, Layers, Code, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { fileApi } from '../../services/fileApi';
import { SourceCodeResponse } from '../../types/file';

export const SourceViewer: React.FC = () => {
  const { activeInspectorFileId, sourceViewerOpen, closeSourceViewer } = useUiStore();
  const { currentProject } = useProjectStore();

  const [sourceData, setSourceData] = useState<SourceCodeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!activeInspectorFileId || !currentProject || !sourceViewerOpen) return;

    setIsLoading(true);
    setError(null);
    fileApi
      .getFileSource(currentProject.id, activeInspectorFileId)
      .then((data) => setSourceData(data))
      .catch((err) => setError(err.message || 'Failed to load file source'))
      .finally(() => setIsLoading(false));
  }, [activeInspectorFileId, currentProject, sourceViewerOpen]);

  if (!sourceViewerOpen) return null;

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const jumpToLine = (lineNumber: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const getMonacoLanguage = (lang?: string) => {
    switch (lang?.toLowerCase()) {
      case 'typescript':
      case 'tsx':
        return 'typescript';
      case 'javascript':
      case 'jsx':
        return 'javascript';
      case 'python':
        return 'python';
      case 'dart':
        return 'dart';
      case 'json':
        return 'json';
      case 'markdown':
        return 'markdown';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-subtle rounded-xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="h-12 px-4 border-b border-border-subtle flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileCode className="w-4 h-4 text-accent-cyan flex-shrink-0" />
            <span className="font-semibold text-xs text-text-primary truncate">
              {sourceData?.filename || 'Source Code Inspector'}
            </span>
            {sourceData?.relative_path && (
              <span className="text-[11px] font-mono text-text-muted truncate">
                ({sourceData.relative_path})
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-bg-main border border-border-subtle uppercase text-text-secondary">
              Read-Only
            </span>
          </div>

          <div className="flex items-center gap-3">
            {sourceData && (
              <span className="text-[11px] text-text-muted font-mono">
                {sourceData.line_count} lines
              </span>
            )}
            <button
              onClick={closeSourceViewer}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-panel transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Monaco Editor */}
          <div className="flex-1 h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-panel/50 backdrop-blur-xs z-10">
                <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
              </div>
            )}

            {error ? (
              <div className="p-8 flex flex-col items-center justify-center text-accent-red gap-2">
                <AlertCircle className="w-8 h-8" />
                <p className="text-xs">{error}</p>
              </div>
            ) : (
              <Editor
                height="100%"
                theme="vs-dark"
                language={getMonacoLanguage(sourceData?.language)}
                value={sourceData?.content || ''}
                onMount={handleEditorDidMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  fontSize: 12,
                  fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderWhitespace: 'selection',
                }}
              />
            )}
          </div>

          {/* Right Sidebar: Extracted Symbols & Imports */}
          {sourceData && (sourceData.symbols.length > 0 || sourceData.imports.length > 0) && (
            <div className="w-72 border-l border-border-subtle bg-bg-secondary flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border-subtle text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent-blue" />
                <span>Extracted Entities</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
                {/* Symbols */}
                {sourceData.symbols.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Symbols ({sourceData.symbols.length})
                    </div>
                    <div className="space-y-1">
                      {sourceData.symbols.map((sym) => (
                        <button
                          key={sym.id}
                          onClick={() => jumpToLine(sym.start_line)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-bg-panel flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <Code className="w-3 h-3 text-accent-cyan flex-shrink-0" />
                            <span className="font-mono text-text-primary truncate">{sym.name}</span>
                          </div>
                          <span className="text-[10px] text-text-muted font-mono">L{sym.start_line}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Imports */}
                {sourceData.imports.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Imports ({sourceData.imports.length})
                    </div>
                    <div className="space-y-1">
                      {sourceData.imports.map((imp) => (
                        <button
                          key={imp.id}
                          onClick={() => jumpToLine(imp.line)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-bg-panel block transition-colors"
                        >
                          <div className="font-mono text-[11px] text-text-secondary truncate" title={imp.statement}>
                            {imp.statement}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-text-muted mt-0.5">
                            <span className="capitalize">{imp.status.replace('_', ' ')}</span>
                            <span className="font-mono">L{imp.line}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

