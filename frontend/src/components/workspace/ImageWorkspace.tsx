import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types/ogtsr';
import { SplitSliderCanvas } from './SplitSliderCanvas';
import { PixelProbePanel } from './PixelProbePanel';
import { ColormapBar } from './ColormapBar';
import { DataImportModal } from './DataImportModal';
import { ReconstructionOutputDetails } from './ReconstructionOutputDetails';
import {
  Columns,
  SplitSquareVertical,
  Sliders,
  Layers,
  Activity,
  Play,
  MapPin,
  Sparkles,
  Scale,
  Eye,
  Upload,
  Info,
  ChevronDown
} from 'lucide-react';

const VIEW_MODES: { id: ViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'side_by_side', label: 'Side-by-Side', icon: Columns },
  { id: 'split_swipe', label: 'Split Swipe', icon: SplitSquareVertical },
  { id: 'opacity_blend', label: 'Opacity Blend', icon: Sliders },
  { id: 'difference_map', label: 'Difference Map', icon: Activity },
  { id: 'single_layer', label: 'Single Layer', icon: Layers }
];

export const ImageWorkspace: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    activeScene,
    activeAoi,
    selectAoi,
    runReconstruction,
    isReconstructing,
    setActiveTab,
    tempUnit,
    setTempUnit
  } = useApp();

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'output' | 'probe' | 'colormap' | 'aoi'>('output');

  return (
    <div className="flex flex-col h-full p-4 gap-3 bg-[var(--bg-primary)] overflow-hidden select-none">
      {/* Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950/70 p-2.5 rounded-2xl border border-white/[0.08] backdrop-blur-md shrink-0">
        {/* Left: View Mode Pills */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/[0.08]">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all interactive-hover ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Data Import & AOI Quick Selector */}
        <div className="flex items-center gap-2">
          {/* Quick Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.12] hover:border-white/30 bg-neutral-900 text-white text-xs font-mono transition-all interactive-hover"
            title="Import custom optical and thermal rasters"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span>Import Data</span>
          </button>

          {/* AOI Selector Pills */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/[0.06] text-xs">
            <span className="text-[10px] font-mono text-neutral-400 px-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-500" />
              <span>AOI:</span>
            </span>
            {activeScene.sampleAois.map((aoi) => {
              const isSelected = aoi.id === activeAoi.id;
              return (
                <button
                  key={aoi.id}
                  onClick={() => selectAoi(aoi.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all whitespace-nowrap interactive-hover ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {aoi.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Temp Unit & Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Temperature Units Toggle */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-full border border-white/[0.08] text-[11px] font-mono">
            <button
              onClick={() => setTempUnit('celsius')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                tempUnit === 'celsius'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit('kelvin')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                tempUnit === 'kelvin'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              K
            </button>
          </div>

          {/* Run Reconstruction Primary Action */}
          <button
            onClick={runReconstruction}
            disabled={isReconstructing}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-md interactive-hover ${
              isReconstructing
                ? 'bg-neutral-800 text-neutral-400 cursor-wait'
                : 'bg-white text-black hover:bg-neutral-200 font-semibold'
            }`}
          >
            {isReconstructing ? (
              <>
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Reconstructing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Reconstruction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Canvas Centerpiece + Right Inspector Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Dominant Canvas Viewport */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <SplitSliderCanvas />
        </div>

        {/* Right Analysis & Details Inspector Sidebar */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Inspector Segmented Tabs */}
          <div className="flex items-center p-1 rounded-full bg-neutral-950/80 border border-white/[0.08] text-[11px] font-mono shrink-0">
            <button
              onClick={() => setActiveInspectorTab('output')}
              className={`flex-1 py-1.5 px-2 rounded-full transition-all text-center ${
                activeInspectorTab === 'output'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Output Details
            </button>
            <button
              onClick={() => setActiveInspectorTab('probe')}
              className={`flex-1 py-1.5 px-2 rounded-full transition-all text-center ${
                activeInspectorTab === 'probe'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pixel Probe
            </button>
            <button
              onClick={() => setActiveInspectorTab('colormap')}
              className={`flex-1 py-1.5 px-2 rounded-full transition-all text-center ${
                activeInspectorTab === 'colormap'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Colormap
            </button>
            <button
              onClick={() => setActiveInspectorTab('aoi')}
              className={`flex-1 py-1.5 px-2 rounded-full transition-all text-center ${
                activeInspectorTab === 'aoi'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              AOI Specs
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeInspectorTab === 'output' && (
            <ReconstructionOutputDetails />
          )}

          {activeInspectorTab === 'probe' && (
            <PixelProbePanel />
          )}

          {activeInspectorTab === 'colormap' && (
            <ColormapBar />
          )}

          {activeInspectorTab === 'aoi' && (
            <div className="card-obsidian p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="font-mono text-[11px] text-neutral-400 uppercase">
                  Area of Interest Extent
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                  {activeAoi.category}
                </span>
              </div>
              <div className="font-semibold text-white">{activeAoi.name}</div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {activeAoi.description}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 border-t border-white/[0.06]">
                <div>Matrix: 256 × 256 px</div>
                <div>Ground Span: 7.68 × 7.68 km</div>
                <div>Optical Grid: 30.0 m</div>
                <div>Thermal Scale: ~100.0 m</div>
              </div>
            </div>
          )}

          {/* Persistent Scientific Principle Box */}
          <div className="card-obsidian p-4 space-y-2 text-[11px] text-neutral-300">
            <div className="flex items-center gap-1.5 font-medium text-white">
              <Scale className="w-3.5 h-3.5 text-neutral-400" />
              <span>Physical Scale Disambiguation</span>
            </div>
            <p className="leading-relaxed text-[10px] text-neutral-400">
              Thermal observations represent Landsat TIRS native ~100m spatial scale on a resampled 30m grid.
              The reconstruction is an optical-guided spatial estimation under local energy flux conservation.
            </p>
          </div>
        </div>
      </div>

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
