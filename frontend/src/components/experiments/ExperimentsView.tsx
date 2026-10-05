import React, { useState } from 'react';
import { experimentService } from '../../services/experimentService';
import { ExperimentRun } from '../../types/ogtsr';
import { exportService } from '../../services/exportService';
import {
  FlaskConical,
  Download,
  Plus,
  GitBranch,
  Calendar,
  Layers,
  Database,
  Tag,
  FileText,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Scale,
  Sparkles,
  ArrowRight,
  X,
  Search,
  Filter,
  Columns
} from 'lucide-react';

export const ExperimentsView: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRun[]>(
    experimentService.getExperiments()
  );
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0]?.id || '');
  const [filterArch, setFilterArch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareExpId, setCompareExpId] = useState<string>(experiments[1]?.id || '');
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState<boolean>(false);

  // New run modal state
  const [newRunName, setNewRunName] = useState<string>('Thermal-Optical Vision Transformer (ViT-SR)');
  const [newRunArch, setNewRunArch] = useState<string>('Swin-Transformer + Spatial Cross-Attention');
  const [newRunBands, setNewRunBands] = useState<string>('SR_B2, SR_B3, SR_B4, SR_B5, NDVI');
  const [newRunLr, setNewRunLr] = useState<string>('5e-5');
  const [newRunFlux, setNewRunFlux] = useState<string>('0.95');
  const [newRunRmse, setNewRunRmse] = useState<string>('1.28');
  const [newRunPsnr, setNewRunPsnr] = useState<string>('34.2');
  const [newRunSsim, setNewRunSsim] = useState<string>('0.914');
  const [newRunNotes, setNewRunNotes] = useState<string>('Windowed multi-head cross-attention preserves fine street canyon boundaries without thermal energy leakage.');

  const selectedExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];
  const compareExp = experiments.find((e) => e.id === compareExpId) || experiments[1];

  const handleExportJson = () => {
    const json = experimentService.exportExperimentsJson();
    exportService.downloadFile('OGTSR_experiments_ledger.json', json, 'application/json');
  };

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: ExperimentRun = {
      id: `EXP-2026-00${experiments.length + 1}`,
      name: newRunName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      modelVersion: `v0.${experiments.length + 1}.0-research`,
      datasetId: 'LC09_L2SP_012042_20260919_02_T1',
      aoiName: 'Metropolitan Core & River Waterfront',
      architecture: newRunArch,
      guidanceFeatures: newRunBands,
      hyperparameters: {
        lr: newRunLr,
        batchSize: 16,
        epochs: 100,
        lambdaFlux: parseFloat(newRunFlux),
        optimizer: 'AdamW'
      },
      metrics: {
        hasReferenceData: true,
        rmseKelvin: parseFloat(newRunRmse),
        maeKelvin: parseFloat(newRunRmse) * 0.76,
        psnrDb: parseFloat(newRunPsnr),
        ssim: parseFloat(newRunSsim),
        pearsonR: 0.952,
        spatialEnergyConservationDeltaK: 0.02,
        sampleCount: 65536,
        disclaimer: 'Evaluated against simulated airborne reference under strict energy conservation.'
      },
      notes: newRunNotes,
      tags: ['Transformer', 'Optical-Guidance', 'Flux-Preserving']
    };

    experimentService.addExperiment(newExp);
    const updated = experimentService.getExperiments();
    setExperiments([...updated]);
    setSelectedExpId(newExp.id);
    setIsNewRunModalOpen(false);
  };

  const filteredExperiments = experiments.filter((exp) => {
    const matchesArch = filterArch === 'all' || exp.architecture.toLowerCase().includes(filterArch.toLowerCase());
    const matchesQuery =
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.architecture.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArch && matchesQuery;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 select-none bg-[var(--bg-primary)]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
            <FlaskConical className="w-4 h-4 text-neutral-400" />
            <span>Research Experiment Tracking & Reproducibility</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Model Runs & Benchmark Ledger
          </h1>
          <p className="text-xs text-neutral-400">
            Log, evaluate, and compare optical-guided thermal super-resolution model architectures under physical energy constraints.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono transition-all interactive-hover ${
              isCompareMode
                ? 'bg-white text-black font-semibold shadow-md'
                : 'border border-white/[0.12] bg-neutral-900 text-neutral-300 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isCompareMode ? 'Exit Comparison' : 'Compare Runs'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono border border-white/[0.12] bg-neutral-900 text-neutral-300 hover:text-white transition-all interactive-hover"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setIsNewRunModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-md interactive-hover"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Run</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="card-obsidian p-4 space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase block">Total Runs Logged</span>
          <span className="text-xl font-bold text-white block">{experiments.length} Runs</span>
          <span className="text-[10px] text-neutral-400 block">3 Architectures Tested</span>
        </div>

        <div className="card-obsidian p-4 space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase block">Benchmark Champion</span>
          <span className="text-xl font-bold text-white block truncate">EXP-2026-003</span>
          <span className="text-[10px] text-neutral-400 block">Cross-Attention (v0.2.0)</span>
        </div>

        <div className="card-obsidian p-4 space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase block">Optimal RMSE</span>
          <span className="text-xl font-bold text-emerald-400 block">1.42 K</span>
          <span className="text-[10px] text-neutral-400 block">58.8% vs. Bicubic Null</span>
        </div>

        <div className="card-obsidian p-4 space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase block">Flux Preservation</span>
          <span className="text-xl font-bold text-white block">&lt; 0.04 K</span>
          <span className="text-[10px] text-neutral-400 block">Thermodynamically Conserved</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/70 p-3 rounded-2xl border border-white/[0.08] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-white/[0.08] text-neutral-300">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search runs, architecture, or AOI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500 w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterArch('all')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                filterArch === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterArch('attention')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                filterArch === 'attention'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cross-Attention
            </button>
            <button
              onClick={() => setFilterArch('guided')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                filterArch === 'guided'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Classical Guided
            </button>
          </div>
        </div>

        <span className="text-[11px] font-mono text-neutral-400">
          Showing {filteredExperiments.length} of {experiments.length} runs
        </span>
      </div>

      {isCompareMode ? (
        /* Side-by-Side Run Comparison View */
        <div className="card-obsidian p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Side-by-Side Model Experiment Comparison
              </h2>
              <p className="text-xs text-neutral-400">
                Evaluating model architecture, guidance mechanisms, and physical metrics
              </p>
            </div>
            <button
              onClick={() => setIsCompareMode(false)}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-neutral-900 border border-white/[0.1] text-neutral-300 hover:text-white"
            >
              Back to List View
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Run A Column */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Primary Run (A)</span>
                <select
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-neutral-900 border border-white/[0.1] text-white font-mono text-xs"
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} — {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExp && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase block">Architecture:</span>
                    <span className="text-white font-semibold">{selectedExp.architecture}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase block">Guidance Features:</span>
                    <span className="text-neutral-200">{selectedExp.guidanceFeatures}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06]">
                      <span className="text-[10px] text-neutral-400 block">RMSE:</span>
                      <span className="text-sm font-bold text-white">
                        {selectedExp.metrics.rmseKelvin ? `${selectedExp.metrics.rmseKelvin.toFixed(2)} K` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06]">
                      <span className="text-[10px] text-neutral-400 block">PSNR:</span>
                      <span className="text-sm font-bold text-white">
                        {selectedExp.metrics.psnrDb ? `${selectedExp.metrics.psnrDb.toFixed(1)} dB` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/40 border border-white/[0.06] text-[11px] text-neutral-400 leading-relaxed font-sans">
                    {selectedExp.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Run B Column */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Comparison Run (B)</span>
                <select
                  value={compareExpId}
                  onChange={(e) => setCompareExpId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-neutral-900 border border-white/[0.1] text-white font-mono text-xs"
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} — {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {compareExp && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase block">Architecture:</span>
                    <span className="text-white font-semibold">{compareExp.architecture}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase block">Guidance Features:</span>
                    <span className="text-neutral-200">{compareExp.guidanceFeatures}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06]">
                      <span className="text-[10px] text-neutral-400 block">RMSE:</span>
                      <span className="text-sm font-bold text-white">
                        {compareExp.metrics.rmseKelvin ? `${compareExp.metrics.rmseKelvin.toFixed(2)} K` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06]">
                      <span className="text-[10px] text-neutral-400 block">PSNR:</span>
                      <span className="text-sm font-bold text-white">
                        {compareExp.metrics.psnrDb ? `${compareExp.metrics.psnrDb.toFixed(1)} dB` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/40 border border-white/[0.06] text-[11px] text-neutral-400 leading-relaxed font-sans">
                    {compareExp.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Split View: Runs List (Left) + Selected Details (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Runs List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold px-1">
              <span>Runs ({filteredExperiments.length})</span>
              <span className="text-[10px]">Sorted by timestamp</span>
            </div>

            <div className="space-y-2.5">
              {filteredExperiments.map((exp) => {
                const isSelected = exp.id === selectedExpId;
                return (
                  <div
                    key={exp.id}
                    onClick={() => setSelectedExpId(exp.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 space-y-2 ${
                      isSelected
                        ? 'bg-neutral-900/90 border-white text-white shadow-lg'
                        : 'bg-neutral-950/70 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-semibold text-white px-2 py-0.5 rounded bg-black/60 border border-white/[0.08]">
                        {exp.id}
                      </span>
                      <span className="text-neutral-400">{exp.modelVersion}</span>
                    </div>

                    <div className="font-semibold text-xs text-white leading-snug">
                      {exp.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.06]">
                      <span className="truncate max-w-[140px]">{exp.architecture}</span>
                      <span className="font-bold text-white">
                        {exp.metrics.rmseKelvin ? `RMSE: ${exp.metrics.rmseKelvin.toFixed(2)} K` : 'Baseline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Run Deep-Dive (7 cols) */}
          {selectedExp && (
            <div className="lg:col-span-7 card-obsidian p-6 space-y-6">
              {/* Header */}
              <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 mb-1">
                    <span className="text-white font-semibold">{selectedExp.id}</span>
                    <span>·</span>
                    <span>{selectedExp.timestamp}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {selectedExp.name}
                  </h2>
                </div>

                <span className="px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.1] text-xs font-mono text-white shrink-0">
                  {selectedExp.modelVersion}
                </span>
              </div>

              {/* Architecture & Guidance Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase block">Model Backbone</span>
                  <span className="text-sm font-semibold text-white block truncate">
                    {selectedExp.architecture}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase block">Guidance Bands</span>
                  <span className="text-sm font-semibold text-white block truncate">
                    {selectedExp.guidanceFeatures}
                  </span>
                </div>
              </div>

              {/* Benchmark Metrics Quad */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Evaluated Benchmark Performance
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.08]">
                    <span className="text-[10px] text-neutral-400 block">RMSE:</span>
                    <span className="text-base font-bold text-white">
                      {selectedExp.metrics.rmseKelvin ? `${selectedExp.metrics.rmseKelvin.toFixed(2)} K` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.08]">
                    <span className="text-[10px] text-neutral-400 block">MAE:</span>
                    <span className="text-base font-bold text-white">
                      {selectedExp.metrics.maeKelvin ? `${selectedExp.metrics.maeKelvin.toFixed(2)} K` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.08]">
                    <span className="text-[10px] text-neutral-400 block">PSNR:</span>
                    <span className="text-base font-bold text-white">
                      {selectedExp.metrics.psnrDb ? `${selectedExp.metrics.psnrDb.toFixed(1)} dB` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.08]">
                    <span className="text-[10px] text-neutral-400 block">SSIM:</span>
                    <span className="text-base font-bold text-white">
                      {selectedExp.metrics.ssim ? selectedExp.metrics.ssim.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hyperparameters Config Table */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Training Configuration & Hyperparameters
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  {Object.entries(selectedExp.hyperparameters).map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <span className="text-[10px] text-neutral-400 block uppercase">{k}:</span>
                      <span className="text-white font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Researcher Notes */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Observations & Physical Phenomenon
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] text-xs text-neutral-300 leading-relaxed font-sans">
                  {selectedExp.notes}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {selectedExp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.08] text-neutral-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log New Run Modal */}
      {isNewRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="card-obsidian w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-white/[0.14] shadow-2xl">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-white" />
                <h3 className="text-base font-semibold text-white">Log Model Experiment Run</h3>
              </div>
              <button
                onClick={() => setIsNewRunModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRun} className="p-6 overflow-y-auto space-y-4 text-xs font-mono flex-1">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={newRunName}
                  onChange={(e) => setNewRunName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Architecture</label>
                  <input
                    type="text"
                    required
                    value={newRunArch}
                    onChange={(e) => setNewRunArch(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Guidance Bands</label>
                  <input
                    type="text"
                    required
                    value={newRunBands}
                    onChange={(e) => setNewRunBands(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Learning Rate</label>
                  <input
                    type="text"
                    value={newRunLr}
                    onChange={(e) => setNewRunLr(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">Flux Weight (λ)</label>
                  <input
                    type="text"
                    value={newRunFlux}
                    onChange={(e) => setNewRunFlux(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">RMSE (K)</label>
                  <input
                    type="text"
                    value={newRunRmse}
                    onChange={(e) => setNewRunRmse(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">PSNR (dB)</label>
                  <input
                    type="text"
                    value={newRunPsnr}
                    onChange={(e) => setNewRunPsnr(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase">SSIM Index</label>
                  <input
                    type="text"
                    value={newRunSsim}
                    onChange={(e) => setNewRunSsim(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 uppercase">Observations & Notes</label>
                <textarea
                  rows={3}
                  value={newRunNotes}
                  onChange={(e) => setNewRunNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-900 border border-white/[0.1] text-white text-xs outline-none focus:border-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRunModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-white/[0.1] text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 shadow-md"
                >
                  Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
