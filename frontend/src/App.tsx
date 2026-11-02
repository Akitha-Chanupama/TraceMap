import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { DependenciesPage } from './pages/DependenciesPage';
import { CircularDependenciesPage } from './pages/CircularDependenciesPage';
import { ImpactAnalysisPage } from './pages/ImpactAnalysisPage';
import { CodeQualityPage } from './pages/CodeQualityPage';
import { SettingsPage } from './pages/SettingsPage';
import { OpenProjectModal } from './components/common/OpenProjectModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage onOpenProject={() => setIsModalOpen(true)} />} />
            <Route path="architecture" element={<ArchitecturePage />} />
            <Route path="files" element={<FileExplorerPage />} />
            <Route path="dependencies" element={<DependenciesPage />} />
            <Route path="circular" element={<CircularDependenciesPage />} />
            <Route path="impact" element={<ImpactAnalysisPage />} />
            <Route path="quality" element={<CodeQualityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        <OpenProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
