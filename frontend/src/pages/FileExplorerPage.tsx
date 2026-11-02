import React, { useEffect, useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Code,
  Layers,
  Search,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { fileApi } from '../services/fileApi';
import { FileTreeNode, FileItem } from '../types/file';

const TreeNodeView: React.FC<{
  node: FileTreeNode;
  onSelectFile: (fileId: string) => void;
  selectedId: string | null;
}> = ({ node, onSelectFile, selectedId }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'directory') {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-bg-panel cursor-pointer text-xs text-text-secondary hover:text-text-primary transition-colors select-none"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
          {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-accent-blue" /> : <Folder className="w-3.5 h-3.5 text-accent-blue" />}
          <span className="font-medium truncate">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="pl-4 border-l border-border-subtle/50 ml-3 space-y-0.5 mt-0.5">
            {node.children.map((child) => (
              <TreeNodeView key={child.id} node={child} onSelectFile={onSelectFile} selectedId={selectedId} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedId === node.file_id;

  return (
    <div
      onClick={() => node.file_id && onSelectFile(node.file_id)}
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors select-none ${
        isSelected ? 'bg-accent-blue/15 text-accent-blue font-semibold border border-accent-blue/30' : 'text-text-secondary hover:bg-bg-panel hover:text-text-primary'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <FileCode className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
      {node.language && (
        <span className="px-1.5 py-0.2 rounded text-[9px] uppercase bg-bg-main border border-border-subtle text-text-muted">
          {node.language}
        </span>
      )}
    </div>
  );
};

export const FileExplorerPage: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { openSourceViewer } = useUiStore();
  const [treeData, setTreeData] = useState<FileTreeNode | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<FileItem | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    fileApi
      .getFileTree(currentProject.id)
      .then(setTreeData)
      .catch((err) => console.error(err));
  }, [currentProject]);

  useEffect(() => {
    if (!selectedFileId || !currentProject) return;
    fileApi
      .listFiles(currentProject.id, { page: 1, page_size: 500 })
      .then((files) => {
        const found = files.find((f) => f.id === selectedFileId);
        if (found) setFileDetails(found);
      })
      .catch((err) => console.error(err));
  }, [selectedFileId, currentProject]);

  return (
    <div className="flex-1 h-full flex overflow-hidden">
      {/* Left Tree Explorer */}
      <div className="w-80 border-r border-border-subtle bg-bg-secondary flex flex-col h-full">
        <div className="p-3 border-b border-border-subtle">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter file tree..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-bg-main border border-border-subtle rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {treeData ? (
            <TreeNodeView node={treeData} onSelectFile={setSelectedFileId} selectedId={selectedFileId} />
          ) : (
            <div className="text-xs text-text-muted italic text-center py-6">Loading file tree...</div>
          )}
        </div>
      </div>

      {/* Right File Detail & Action Panel */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        {fileDetails ? (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-bg-panel border border-border-subtle rounded-xl p-5 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                  {fileDetails.language}
                </span>
                <h2 className="text-lg font-bold text-text-primary mt-2">{fileDetails.filename}</h2>
                <p className="text-xs font-mono text-text-muted mt-0.5">{fileDetails.relative_path}</p>
              </div>

              <button
                onClick={() => openSourceViewer(fileDetails.id)}
                className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Code className="w-4 h-4" />
                <span>Open in Monaco Inspector</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
                <div className="text-xs text-text-muted mb-1">Lines of Code</div>
                <div className="text-xl font-bold font-mono text-text-primary">{fileDetails.line_count}</div>
              </div>
              <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
                <div className="text-xs text-text-muted mb-1">File Size</div>
                <div className="text-xl font-bold font-mono text-text-primary">{(fileDetails.file_size / 1024).toFixed(1)} KB</div>
              </div>
              <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
                <div className="text-xs text-text-muted mb-1">Extracted Symbols</div>
                <div className="text-xl font-bold font-mono text-text-primary">{fileDetails.symbols_count}</div>
              </div>
              <div className="p-4 bg-bg-panel border border-border-subtle rounded-xl">
                <div className="text-xs text-text-muted mb-1">Dependencies</div>
                <div className="text-xl font-bold font-mono text-text-primary">{fileDetails.dependencies_count}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
            <FileCode className="w-12 h-12 text-border-subtle mb-3" />
            <p className="text-xs">Select a file from the explorer on the left to inspect its metadata</p>
          </div>
        )}
      </div>
    </div>
  );
};
