import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { modelService } from '../../services/modelService';
import {
  Cpu,
  Layers,
  Settings,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Server,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export const ReconstructionPipeline: React.FC = () => {
  const {
    activeScene,
    activeAoi,
    runReconstruction,
    isReconstructing,
    reconstructionProgress,
    reconstructionResult,
    setActiveTab
  } = useApp();

  const stages = modelService.getStages();
  const [config, setConfig] = useState(modelService.getConfig());
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    'System ready. Multi-spectral optical and thermal observation layers initialized.',
    'Model backend status: Standalone Frontend Heuristic active. External ML integration ready.'
  ]);

  const handleRun = async () => {
    const newLogs = [
      `[${new Date().toLocaleTimeString()}] Initializing reconstruction run for AOI: ${activeAoi.name}...`
    ];
    setExecutionLogs(newLogs);

    await runReconstruction();

    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Optical features extracted: ${config.guidanceBands.join(', ')}`,
      `[${new Date().toLocaleTimeString()}] Local thermal energy conservation applied (lambda = ${config.thermalConservationWeight})`,
      `[${new Date().toLocaleTimeString()}] Reconstruction generation completed. Result ready for spatial inspection.`
    ]);
  };

  const toggleGuidanceBand = (bandId: string) => {
    const exists = config.guidanceBands.includes(bandId);
    const updated = exists
      ? config.guidanceBands.filter((b) => b !== bandId)
      : [...config.guidanceBands, bandId];
    const newConf = { ...config, guidanceBands: updated };
    setConfig(newConf);
    modelService.updateConfig(newConf);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Research Model & Reconstruction Architecture</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            OGTSR Pipeline Orchestration
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[var(--text-secondary)]">
            Status: <span className="text-amber-400 font-semibold">EXPERIMENTAL / IN DEV</span>
          </div>

          <button
            onClick={handleRun}
            disabled={isReconstructing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm interactive-hover ${
              isReconstructing
                ? 'bg-neutral-800 text-white cursor-wait'
                : 'bg-[var(--text-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)]'
            }`}
          >
            {isReconstructing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Experimental Reconstruction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Development Honesty Banner */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-start gap-3.5">
        <Info className="w-5 h-5 text-neutral-300 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[var(--text-secondary)]">
          <div className="font-semibold text-[var(--text-primary)]">
            Research Model Integration Notice
          </div>
          <p className="leading-relaxed">
            The machine learning model weights are currently under active research. The frontend provides
            a full scientific execution harness using an optical-guided spatial gradient heuristic and
            local energy conservation. You can plug your custom PyTorch backend into this interface via
            the backend endpoint toggle below without altering the UI.
          </p>
        </div>
      </div>

      {/* Pipeline Stage Architecture Graph */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
          Pipeline Processing Stages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage, idx) => {
            const isRunningThis = isReconstructing && reconstructionProgress.stage === idx;
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-lg border flex flex-col justify-between space-y-3 transition-colors ${
                  isRunningThis
                    ? 'bg-blue-950/20 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className="text-[var(--text-muted)]">STAGE {idx + 1}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        stage.status === 'READY'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/30'
                          : stage.status === 'EXPERIMENTAL'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isRunningThis ? 'RUNNING' : stage.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                    {stage.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono">
                  {stage.details}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Configuration & Backend Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Hyperparameters & Guidance features */}
        <div className="p-5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            <Settings className="w-4 h-4" />
            <span>Reconstruction Parameters</span>
          </div>

          {/* Guidance Bands Selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-primary)] font-medium">
              Optical Guidance Bands (30 m)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'].map((b) => {
                const isSelected = config.guidanceBands.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleGuidanceBand(b)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent)] text-white font-medium'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {b} {b === 'SR_B5' ? '(NIR)' : b === 'SR_B4' ? '(Red)' : ''}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Optical guidance features drive the high-frequency spatial refinement.
            </div>
          </div>

          {/* Local Thermal Energy Conservation Weight */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-primary)] font-medium">
                Thermal Conservation Weight (λ):
              </span>
              <span className="font-mono text-[var(--accent)]">
                {config.thermalConservationWeight}
              </span>
            </div>
            <input
              type="range"
              aria-label="Thermal conservation weight lambda"
              min="0.5"
              max="1.0"
              step="0.05"
              value={config.thermalConservationWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const updated = { ...config, thermalConservationWeight: val };
                setConfig(updated);
                modelService.updateConfig(updated);
              }}
              className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="text-[10px] text-[var(--text-muted)]">
              Ensures the aggregated fine-scale temperature within native ~100 m footprints equals coarse observation.
            </div>
          </div>

          {/* Spatial Target Grid */}
          <div className="space-y-1.5 pt-2">
            <div className="text-xs text-[var(--text-primary)] font-medium">Target Output Grid</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const u = { ...config, targetGrid: 30 };
                  setConfig(u);
                  modelService.updateConfig(u);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono ${
                  config.targetGrid === 30
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                30 m Grid (Landsat OLI Aligned)
              </button>
              <button
                onClick={() => {
                  const u = { ...config, targetGrid: 10 };
                  setConfig(u);
                  modelService.updateConfig(u);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono ${
                  config.targetGrid === 10
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                10 m Grid (Experimental Sentinel-2 Target)
              </button>
            </div>
          </div>
        </div>

        {/* Right: External PyTorch / FastAPI Backend Connector */}
        <div className="p-5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              <Server className="w-4 h-4" />
              <span>External Backend Connector</span>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                config.useBackend
                  ? 'bg-blue-950/40 text-blue-400 border border-blue-600/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.useBackend ? 'REMOTE BACKEND' : 'STANDALONE RESEARCH MODE'}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            When you build your PyTorch / Python model, start your server (e.g., FastAPI on port 8000)
            and enable this connector. The frontend will automatically forward the multi-spectral tiles
            and render your live tensor outputs.
          </p>

          <div className="p-3.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                Connect External ML Server
              </span>
              <input
                type="checkbox"
                aria-label="Connect external machine learning server"
                checked={config.useBackend}
                onChange={(e) => {
                  const u = { ...config, useBackend: e.target.checked };
                  setConfig(u);
                  modelService.updateConfig(u);
                }}
                className="w-4 h-4 text-[var(--accent)] rounded cursor-pointer"
              />
            </div>

            {config.useBackend && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-mono text-[var(--text-muted)]">API Endpoint URL</label>
                <input
                  type="text"
                  aria-label="API Endpoint URL"
                  value={config.backendEndpoint}
                  onChange={(e) => {
                    const u = { ...config, backendEndpoint: e.target.value };
                    setConfig(u);
                    modelService.updateConfig(u);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-strong)] font-mono text-xs text-[var(--text-primary)] focus:outline-none"
                  placeholder="http://localhost:8000/api/reconstruct"
                />
              </div>
            )}
          </div>

          {/* Live Execution Logs */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Execution Stream</span>
            </div>
            <div className="p-3 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)] space-y-1 max-h-36 overflow-y-auto">
              {executionLogs.map((log, i) => (
                <div key={i} className="leading-tight">
                  {log}
                </div>
              ))}
              {isReconstructing && (
                <div className="text-blue-400 animate-pulse">
                  &gt; {reconstructionProgress.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reconstruction Result Summary Card */}
      {reconstructionResult && (
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Experimental Reconstruction Completed ({reconstructionResult.id})</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {reconstructionResult.scientificDisclaimer}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="font-mono text-xs text-right">
              <div className="text-[var(--text-primary)] font-semibold">
                Mean: {reconstructionResult.meanTempC.toFixed(1)} °C
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Span: {reconstructionResult.minTempC.toFixed(1)} – {reconstructionResult.maxTempC.toFixed(1)} °C
              </div>
            </div>

            <button
              onClick={() => setActiveTab('workspace')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
            >
              <span>View in Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
