import React, { useState } from 'react';
import { X, Folder, FolderSearch, Loader2, AlertCircle } from 'lucide-react';
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
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentProject, projectsList, setProjectsList } = useProjectStore();

  if (!isOpen) return null;

  const handleBrowseNative = async () => {
    setIsBrowsing(true);
    setError(null);
    try {
      const res = await projectApi.selectFolder();
      if (res.selected_path) {
        setPathInput(res.selected_path);
        if (!nameInput) {
          const parts = res.selected_path.replace(/\\/g, '/').split('/');
          setNameInput(parts[parts.length - 1] || 'My Project');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not launch native folder picker');
    } finally {
      setIsBrowsing(false);
    }
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
      <div className="bg-bg-panel border border-border-subtle rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Project Directory Path
            </label>
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
                disabled={isBrowsing}
                className="px-3 py-2 bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isBrowsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderSearch className="w-3.5 h-3.5" />}
                <span>Browse</span>
              </button>
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              Source files are read-only and analyzed on your local machine. Files are never modified or uploaded.
            </p>
          </div>

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

