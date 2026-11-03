import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  FolderSearch,
  Loader2,
  AlertCircle,
  HardDrive,
  CornerLeftUp,
  FolderGit2,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { projectApi } from '../../services/projectApi';
import { useProjectStore } from '../../stores/projectStore';

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenProjectModal: React.FC<OpenProjectModalProps> = ({ isOpen, onClose }) => {
  const [pathInput, setPathInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowsingNative, setIsBrowsingNative] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-app filesystem browser state
  const [showInAppBrowser, setShowInAppBrowser] = useState(false);
  const [isLoadingDir, setIsLoadingDir] = useState(false);
  const [currentBrowserPath, setCurrentBrowserPath] = useState('');
  const [parentBrowserPath, setParentBrowserPath] = useState<string | null>(null);
  const [subDirectories, setSubDirectories] = useState<Array<{ name: string; path: string }>>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [quickLocations, setQuickLocations] = useState<Array<{ name: string; path: string }>>([]);

  const { setCurrentProject, projectsList, setProjectsList } = useProjectStore();

  useEffect(() => {
    if (isOpen) {
      // Load initial quick locations and drive data
      fetchDirectory();
    } else {
      setShowInAppBrowser(false);
      setError(null);
    }
  }, [isOpen]);

  const fetchDirectory = async (targetPath?: string) => {
    setIsLoadingDir(true);
    try {
      const res = await projectApi.browseFilesystem(targetPath);
      setCurrentBrowserPath(res.current_path);
      setParentBrowserPath(res.parent_path);
      setSubDirectories(res.directories || []);
      setDrives(res.drives || []);
      setQuickLocations(res.quick_locations || []);
    } catch (err: any) {
      // Non-fatal, user can still enter path manually or use native picker
    } finally {
      setIsLoadingDir(false);
    }
  };

  if (!isOpen) return null;

  const handleBrowseNative = async () => {
    // Immediately open the interactive in-app folder navigator for instant visual feedback
    setShowInAppBrowser(true);
    if (!currentBrowserPath) {
      fetchDirectory(pathInput || undefined);
    }

    setIsBrowsingNative(true);
    setError(null);
    try {
      const res = await projectApi.selectFolder();
      if (res.selected_path) {
        setPathInput(res.selected_path);
        if (!nameInput) {
          const parts = res.selected_path.replace(/\\/g, '/').split('/');
          setNameInput(parts[parts.length - 1] || 'My Project');
        }
        setShowInAppBrowser(false);
      } else if (res.error) {
        setError(`Native dialog: ${res.error}. You can browse folders directly below or type the path.`);
      }
    } catch (err: any) {
      console.warn('Native folder dialog notice:', err);
    } finally {
      setIsBrowsingNative(false);
    }
  };

  const handleSelectPath = (selectedPath: string) => {
    setPathInput(selectedPath);
    if (!nameInput) {
      const parts = selectedPath.replace(/\\/g, '/').split('/');
      setNameInput(parts[parts.length - 1] || 'My Project');
    }
    setShowInAppBrowser(false);
  };

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathInput.trim()) {
      setError('Please provide a valid directory path.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const project = await projectApi.openProject(pathInput.trim(), nameInput.trim() || undefined);
      setCurrentProject(project);

      // Add to projects list if not present
      if (!projectsList.some((p) => p.id === project.id)) {
        setProjectsList([project, ...projectsList]);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to open project directory.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-subtle rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-accent-blue" />
            <h2 className="text-sm font-semibold text-text-primary">Open Local Repository</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleOpen} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg flex items-start gap-2.5 text-xs text-accent-red">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">
                Project Directory Path
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowInAppBrowser(!showInAppBrowser);
                  if (!showInAppBrowser && !currentBrowserPath) {
                    fetchDirectory(pathInput || undefined);
                  }
                }}
                className="text-[11px] text-accent-blue hover:underline flex items-center gap-1 font-medium"
              >
                <FolderOpen className="w-3 h-3" />
                {showInAppBrowser ? 'Hide Folder Browser' : 'Browse Folders in App'}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. D:\projects\my-react-app or /home/user/repo"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                className="flex-1 bg-bg-main border border-border-subtle focus:border-accent-blue rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBrowseNative}
                disabled={isBrowsingNative}
                title="Browse folders or launch Windows folder picker"
                className="px-3 py-2 bg-accent-blue/15 hover:bg-accent-blue/25 border border-accent-blue/40 text-accent-blue rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isBrowsingNative ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderSearch className="w-3.5 h-3.5" />
                )}
                <span>Browse</span>
              </button>
            </div>

            {/* Quick Drives Bar right below path input */}
            {drives.length > 0 && !showInAppBrowser && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-text-muted">Quick Drives:</span>
                {drives.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setShowInAppBrowser(true);
                      fetchDirectory(d);
                    }}
                    className="px-2 py-0.5 rounded bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-accent-blue text-[11px] flex items-center gap-1 transition-colors font-mono"
                  >
                    <HardDrive className="w-3 h-3 text-accent-blue" />
                    <span>{d}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowInAppBrowser(true);
                    if (!currentBrowserPath) fetchDirectory();
                  }}
                  className="text-accent-blue hover:underline ml-1 font-medium"
                >
                  Explore folders &rarr;
                </button>
              </div>
            )}
            <p className="text-[11px] text-text-muted mt-1.5">
              Source files are read-only and analyzed on your local machine. Files are never modified or uploaded.
            </p>
          </div>

          {/* Quick Shortcuts */}
          {quickLocations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-text-muted">Quick Shortcuts:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickLocations.map((loc) => (
                  <button
                    key={loc.path}
                    type="button"
                    onClick={() => handleSelectPath(loc.path)}
                    className="px-2 py-1 bg-bg-main hover:bg-bg-elevated border border-border-subtle rounded text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
                  >
                    <FolderGit2 className="w-3 h-3 text-accent-cyan" />
                    <span>{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-App Directory Navigator Drawer */}
          {showInAppBrowser && (
            <div className="border border-border-subtle rounded-lg bg-bg-main p-3 space-y-2.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5 text-accent-blue" />
                  Local Folder Navigator
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectPath(currentBrowserPath)}
                  className="px-2 py-1 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded text-[11px] font-medium transition-colors"
                >
                  Select This Folder
                </button>
              </div>

              {/* Drives selector */}
              {drives.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-text-muted">Drives:</span>
                  {drives.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => fetchDirectory(d)}
                      className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                        currentBrowserPath.toUpperCase().startsWith(d.toUpperCase())
                          ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue'
                          : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <HardDrive className="w-3 h-3" />
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Current path breadcrumb */}
              <div className="px-2 py-1 bg-bg-panel rounded border border-border-subtle text-[11px] text-text-muted font-mono truncate flex items-center justify-between">
                <span className="truncate">{currentBrowserPath}</span>
                {parentBrowserPath && (
                  <button
                    type="button"
                    onClick={() => fetchDirectory(parentBrowserPath)}
                    className="p-1 hover:text-text-primary transition-colors ml-2"
                    title="Up one directory level"
                  >
                    <CornerLeftUp className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Subdirectories list */}
              <div className="max-h-40 overflow-y-auto divide-y divide-border-subtle/50 border border-border-subtle rounded bg-bg-panel text-xs">
                {isLoadingDir ? (
                  <div className="py-6 flex items-center justify-center text-text-muted text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading folders...</span>
                  </div>
                ) : subDirectories.length === 0 ? (
                  <div className="py-4 text-center text-text-muted text-[11px]">
                    No visible subfolders
                  </div>
                ) : (
                  subDirectories.map((dir) => (
                    <div
                      key={dir.path}
                      className="px-2.5 py-1.5 hover:bg-bg-elevated flex items-center justify-between group transition-colors cursor-pointer"
                      onClick={() => fetchDirectory(dir.path)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 text-accent-blue/70 group-hover:text-accent-blue flex-shrink-0" />
                        <span className="truncate text-text-primary text-[11px]">{dir.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPath(dir.path);
                          }}
                          className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-accent-blue/10 hover:bg-accent-blue/30 text-accent-blue rounded text-[10px] font-medium transition-all"
                        >
                          Pick
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Project Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend Web App"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-bg-main border border-border-subtle focus:border-accent-blue rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-bg-elevated text-text-secondary rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !pathInput.trim()}
              className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Open & Analyze</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
