import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LeftRail } from './components/shell/LeftRail';
import { ResearchOverview } from './components/overview/ResearchOverview';
import { BandStudio } from './components/bands/BandStudio';
import { ImageWorkspace } from './components/workspace/ImageWorkspace';
import { ReconstructionPipeline } from './components/reconstruction/ReconstructionPipeline';
import { ExperimentsView } from './components/experiments/ExperimentsView';
import { ExportPanel } from './components/export/ExportPanel';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 overflow-y-auto scroll-smooth bg-[var(--bg-primary)]">
      {activeTab === 'overview' && <ResearchOverview />}
      {activeTab === 'workspace' && <ImageWorkspace />}
      {activeTab === 'bands' && <BandStudio />}
      {activeTab === 'reconstruction' && <ReconstructionPipeline />}
      {activeTab === 'experiments' && <ExperimentsView />}
      {activeTab === 'exports' && <ExportPanel />}
    </main>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <LeftRail />
        <MainContent />
      </div>
    </AppProvider>
  );
}

export default App;
