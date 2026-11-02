import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { StatusBar } from './StatusBar';
import { OpenProjectModal } from '../common/OpenProjectModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { SourceViewer } from '../inspector/SourceViewer';
import { useProjectStore } from '../../stores/projectStore';
import { projectApi } from '../../services/projectApi';

export const AppLayout: React.FC = () => {
  const [isOpenProjectModalOpen, setIsOpenProjectModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const { currentProject, setProjectsList, setCurrentProject, setAnalysisProgress } = useProjectStore();

  // Load existing projects on startup
  useEffect(() => {
    projectApi
      .listProjects()
      .then((projects) => {
        setProjectsList(projects);
        if (projects.length > 0 && !currentProject) {
          setCurrentProject(projects[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Keyboard shortcut listener for Cmd/Ctrl+K or / to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // WebSocket connection for real-time progress and file changes
  useEffect(() => {
    if (!currentProject) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/api/v1/ws/projects/${currentProject.id}`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const evt = payload.event;
          const data = payload.data;

          if (evt.includes('progress') || evt.startsWith('analysis_')) {
            setAnalysisProgress({
              isAnalyzing: evt !== 'analysis_completed' && evt !== 'analysis_failed',
              phase: data?.phase || 'analyzing',
              current: data?.current || 0,
              total: data?.total || 0,
            });
          }
        } catch {
          // ignore malformed message
        }
      };
    } catch {
      // WS fallback gracefully to polling
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentProject, setAnalysisProgress]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-main text-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar
          onOpenNewProject={() => setIsOpenProjectModalOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
        />

        <main className="flex-1 overflow-hidden flex relative">
          <Outlet />
        </main>

        <StatusBar />
      </div>

      <OpenProjectModal
        isOpen={isOpenProjectModalOpen}
        onClose={() => setIsOpenProjectModalOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <SourceViewer />
    </div>
  );
};

