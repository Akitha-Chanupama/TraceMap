import React from 'react';
import { ArchitectureGraph } from '../components/graph/ArchitectureGraph';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden relative">
      <ArchitectureGraph />
    </div>
  );
};
