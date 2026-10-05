import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Upload,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Info,
  X,
  Scale,
  Eye,
  Check,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose }) => {
  const { scenes, activeScene, selectScene, activeAoi, selectAoi } = useApp();

  const [activeSourceType, setActiveSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(activeScene.id);
  const [selectedAoiId, setSelectedAoiId] = useState<string>(activeAoi.id);

  // Custom upload simulation state
  const [opticalFileName, setOpticalFileName] = useState<string>('LC09_L2SP_012042_SR_STACK.tif');
  const [thermalFileName, setThermalFileName] = useState<string>('LC09_L2SP_012042_ST_B10.tif');
  const [customLoaded, setCustomLoaded] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentScene = scenes.find((s) => s.id === selectedSceneId) || activeScene;

  const handleApply = () => {
    selectScene(selectedSceneId);
    selectAoi(selectedAoiId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="card-obsidian w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/[0.14] shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Import Optical & Thermal Imagery
              </h2>
              <p className="text-xs text-neutral-400">
                Configure data inputs & inspect pre-flight scientific telemetry for thermal super-resolution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Source Selection Toggle */}
          <div className="flex items-center p-1 rounded-full bg-neutral-900 border border-white/[0.08] max-w-md">
            <button
              onClick={() => setActiveSourceType('preset')}
              className={`flex-1 py-1.5 px-4 rounded-full text-xs font-medium transition-all ${
                activeSourceType === 'preset'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Benchmark Calibrated Scenes
            </button>
            <button
              onClick={() => setActiveSourceType('custom')}
              className={`flex-1 py-1.5 px-4 rounded-full text-xs font-medium transition-all ${
                activeSourceType === 'custom'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Import Custom GeoTIFF / Data
            </button>
          </div>

          {activeSourceType === 'preset' ? (
            /* Preset Benchmark Selector */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenes.map((sc) => {
                  const isSelected = sc.id === selectedSceneId;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setSelectedSceneId(sc.id);
                        if (sc.sampleAois[0]) setSelectedAoiId(sc.sampleAois[0].id);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-900/90 border-white text-white shadow-md'
                          : 'bg-neutral-950/60 border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                        <span className="font-semibold text-white">{sc.sensor}</span>
                        <span>{sc.acquisitionDate}</span>
                      </div>
                      <div className="font-medium text-xs text-white truncate mb-1">
                        {sc.id}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {sc.productLevel} · Path {sc.path} / Row {sc.row}
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400">
                        <span>CRS: {sc.spatial.crs}</span>
                        <span>Cloud: {sc.cloudCover}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AOI selection inside the chosen scene */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold block">
                  Select Area of Interest (AOI):
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentScene.sampleAois.map((aoi) => {
                    const isSelected = aoi.id === selectedAoiId;
                    return (
                      <button
                        key={aoi.id}
                        onClick={() => setSelectedAoiId(aoi.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-white text-black font-semibold shadow-sm'
                            : 'bg-neutral-900 border border-white/[0.08] text-neutral-300 hover:text-white'
                        }`}
                      >
                        {aoi.name} ({aoi.category})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Custom Raster Upload Dropzones */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Optical Upload Box */}
                <div className="p-5 rounded-xl bg-neutral-950/80 border border-dashed border-white/20 hover:border-white/40 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white font-semibold flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-neutral-400" />
                      <span>Optical Raster (Guidance)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                      30 m Target
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Upload multi-spectral surface reflectance (GeoTIFF containing Red, Green, Blue, NIR, SWIR bands).
                  </p>
                  <div className="p-3 rounded-lg bg-neutral-900/80 border border-white/[0.08] flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white truncate">{opticalFileName}</span>
                    <span className="text-emerald-400 shrink-0 ml-2">✓ Ready</span>
                  </div>
                </div>

                {/* Thermal Upload Box */}
                <div className="p-5 rounded-xl bg-neutral-950/80 border border-dashed border-white/20 hover:border-white/40 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white font-semibold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-neutral-400" />
                      <span>Thermal Raster (Observation)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                      ~100 m Native
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Upload coarse thermal infrared observation (Landsat TIRS ST_B10 or calibrated land surface temperature).
                  </p>
                  <div className="p-3 rounded-lg bg-neutral-900/80 border border-white/[0.08] flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white truncate">{thermalFileName}</span>
                    <span className="text-emerald-400 shrink-0 ml-2">✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scientific Pre-Flight Information Panel */}
          <div className="p-5 rounded-xl bg-neutral-950/90 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-neutral-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
                  Pre-Flight Scientific Telemetry & Compatibility
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-medium">
                ✓ Spatial Grid Co-Registered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Optical Image Telemetry */}
              <div className="p-3.5 rounded-lg bg-black/60 border border-white/[0.06] space-y-2">
                <div className="text-[11px] font-semibold text-white uppercase border-b border-white/[0.06] pb-1">
                  Optical Guidance Image (OLI)
                </div>
                <div className="space-y-1 text-neutral-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ground Sampling Pitch:</span>
                    <span className="text-white font-semibold">30.0 m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Spectral Coverage:</span>
                    <span>0.43 – 2.30 µm (B2–B7)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Reflectance Dynamic Range:</span>
                    <span>0.012 – 0.684 (Clean)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">NDVI Vegetation Gradient:</span>
                    <span>-0.18 (Water) to +0.76 (Canopy)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Cloud Contamination:</span>
                    <span className="text-emerald-400">0.0% (Clear Sky)</span>
                  </div>
                </div>
              </div>

              {/* Thermal Image Telemetry */}
              <div className="p-3.5 rounded-lg bg-black/60 border border-white/[0.06] space-y-2">
                <div className="text-[11px] font-semibold text-white uppercase border-b border-white/[0.06] pb-1">
                  Thermal Observation Image (TIRS)
                </div>
                <div className="space-y-1 text-neutral-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Native Optical Aperture:</span>
                    <span className="text-white font-semibold">~100.0 m (PSF Blur)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Distributed Resampled Grid:</span>
                    <span>30.0 m (USGS C2 L2)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Brightness Temp Range:</span>
                    <span>18.4°C – 39.2°C (291.5K – 312.3K)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Planck Calibration:</span>
                    <span>K1=774.88, K2=1321.08</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Sensor Thermal NETD:</span>
                    <span>~0.4 K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Principle Reminder */}
            <div className="p-3 rounded-lg bg-neutral-900/60 border border-white/[0.06] flex items-start gap-2.5 text-[11px] text-neutral-300">
              <Scale className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Local Flux Conservation Guarantee:</strong> When the model runs, it will constrain the
                aggregated thermal radiance across every ~100m native footprint to match the satellite observation,
                preventing artificial temperature hallucination.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-neutral-950/80">
          <div className="text-[11px] font-mono text-neutral-400">
            Selected: <strong className="text-white">{currentScene.sensor}</strong> ({selectedAoiId})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold shadow-md interactive-hover flex items-center gap-1.5"
            >
              <span>Load into Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
