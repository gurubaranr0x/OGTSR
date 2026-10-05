import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { bandService } from '../../services/bandService';
import { ImportedBand, BandRole, BandCompositeMode, ThermalColormap } from '../../types/ogtsr';
import {
  Layers,
  Upload,
  Sparkles,
  Sliders,
  Crosshair,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  RefreshCw,
  FileText,
  RotateCcw,
  ArrowRight,
  Info
} from 'lucide-react';

const COMPOSITE_MODES: { id: BandCompositeMode; label: string; desc: string }[] = [
  { id: 'TRUE_COLOR_RGB', label: 'True Color (RGB)', desc: 'Natural color composite using Red (B4), Green (B3), Blue (B2)' },
  { id: 'FALSE_COLOR_NIR', label: 'False Color (NIR)', desc: 'Color-Infrared using NIR (B5), Red (B4), Green (B3) for vegetation vigor' },
  { id: 'SWIR_URBAN', label: 'SWIR Urban & Soil', desc: 'Shortwave Infrared (B7, B6, B4) highlighting impervious urban surfaces' },
  { id: 'THERMAL_SINGLE', label: 'Thermal Observation', desc: 'Single-band thermal sensor calibration using scientific colormaps' },
  { id: 'INDEX_NDVI', label: 'NDVI (Vegetation)', desc: 'Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)' },
  { id: 'INDEX_NDBI', label: 'NDBI (Built-up)', desc: 'Normalized Difference Built-up Index: (SWIR - NIR) / (SWIR + NIR)' },
  { id: 'INDEX_MNDWI', label: 'MNDWI (Water)', desc: 'Modified Normalized Difference Water Index: (Green - SWIR) / (Green + SWIR)' }
];

const PRESETS = [
  { id: 'landsat9', label: 'Landsat 8/9 OLI/TIRS (30m / ~100m)' },
  { id: 'sentinel2', label: 'Sentinel-2 MSI (10m / 20m)' },
  { id: 'airborne', label: 'Airborne MASTER/TIMS (3m / 5m)' }
];

const BAND_ROLES: { id: BandRole; label: string }[] = [
  { id: 'RED', label: 'Optical Red' },
  { id: 'GREEN', label: 'Optical Green' },
  { id: 'BLUE', label: 'Optical Blue' },
  { id: 'NIR', label: 'Near-Infrared (NIR)' },
  { id: 'SWIR1', label: 'Shortwave Infrared 1' },
  { id: 'SWIR2', label: 'Shortwave Infrared 2' },
  { id: 'TIR1', label: 'Thermal Infrared 1 (ST_B10)' },
  { id: 'TIR2', label: 'Thermal Infrared 2' },
  { id: 'EMIS', label: 'Surface Emissivity' },
  { id: 'QA', label: 'Quality Assessment Mask' },
  { id: 'CUSTOM', label: 'Custom Auxiliary' }
];

export const BandStudio: React.FC = () => {
  const { setActiveTab } = useApp();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [bands, setBands] = useState<ImportedBand[]>(bandService.getBands());
  const [compositeMode, setCompositeMode] = useState<BandCompositeMode>(bandService.getCompositeMode());
  const [thermalColormap, setThermalColormap] = useState<ThermalColormap>('inferno');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
  const [probedValues, setProbedValues] = useState<Record<string, number> | null>(null);

  // New band import modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [newBandName, setNewBandName] = useState<string>('Custom Airborne Band');
  const [newBandRole, setNewBandRole] = useState<BandRole>('NIR');
  const [newBandRes, setNewBandRes] = useState<number>(10);
  const [newBandWave, setNewBandWave] = useState<string>('0.85 µm');

  // Render composite to canvas
  useEffect(() => {
    if (canvasRef.current) {
      bandService.renderCompositeToCanvas(canvasRef.current, compositeMode, undefined, thermalColormap);
    }
  }, [bands, compositeMode, thermalColormap]);

  const handlePresetSelect = (presetKey: 'landsat9' | 'sentinel2' | 'airborne') => {
    bandService.loadPreset(presetKey);
    setBands([...bandService.getBands()]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 256);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 256);

    setHoveredPoint({ x, y });
    const probed = bandService.probeBands(x, y);
    setProbedValues(probed);
  };

  const handleAddCustomBand = () => {
    const rawData = bandService.generateBandData(newBandRole);
    const stats = bandService.computeStats(rawData);

    const newBand: ImportedBand = {
      id: `custom_${Date.now()}`,
      name: newBandName,
      fileName: `${newBandName.replace(/\s+/g, '_')}.tif`,
      role: newBandRole,
      resolution: newBandRes,
      wavelength: newBandWave,
      gain: newBandRole === 'TIR1' ? 0.00341802 : 0.0000275,
      offset: newBandRole === 'TIR1' ? 149.0 : -0.2,
      unit: newBandRole === 'TIR1' ? 'Celsius (°C)' : 'Reflectance',
      data: rawData,
      stats
    };

    bandService.addBand(newBand);
    setBands([...bandService.getBands()]);
    setShowImportModal(false);
  };

  const handleDeleteBand = (id: string) => {
    bandService.removeBand(id);
    setBands([...bandService.getBands()]);
  };

  const activeModeObj = COMPOSITE_MODES.find((m) => m.id === compositeMode) || COMPOSITE_MODES[0];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
            <Layers className="w-4 h-4" />
            <span>Multi-Spectral Ingestion & Studio</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Multi-Band Visualizer & Composite Engine
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Import, calibrate, and synthesize multi-spectral and thermal bands from any satellite or airborne sensor.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] text-xs font-medium transition-all shadow-sm interactive-hover"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Band File</span>
          </button>
        </div>
      </div>

      {/* Sensor Preset Selector Pills */}
      <div className="flex items-center gap-2 text-xs bg-[var(--bg-secondary)] p-2 rounded-2xl border border-[var(--border-subtle)]">
        <span className="font-mono text-[11px] text-[var(--text-muted)] pl-2">Preset Sensor:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id as any)}
              className="px-3 py-1 rounded-full text-xs font-mono border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-primary)] transition-all interactive-hover"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer Area: Canvas (Left) + Controls & Probing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Composite Canvas Viewport */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{activeModeObj.label}</span>
              <span className="text-[11px] text-[var(--text-muted)] block">{activeModeObj.desc}</span>
            </div>
            {compositeMode === 'THERMAL_SINGLE' && (
              <select
                aria-label="Select thermal palette"
                value={thermalColormap}
                onChange={(e) => setThermalColormap(e.target.value as any)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full px-3 py-1 font-mono text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="inferno">Inferno</option>
                <option value="magma">Magma</option>
                <option value="viridis">Viridis</option>
                <option value="plasma">Plasma</option>
                <option value="turbo">Turbo</option>
                <option value="grayscale">Grayscale</option>
              </select>
            )}
          </div>

          {/* Canvas */}
          <div className="relative p-2 rounded-xl bg-black border border-[var(--border-strong)] shadow-lg cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              className="rounded-lg w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => {
                setHoveredPoint(null);
                setProbedValues(null);
              }}
            />

            {hoveredPoint && (
              <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-sm border border-neutral-700 rounded-lg px-2.5 py-1 text-[10px] font-mono text-white pointer-events-none">
                Grid ({hoveredPoint.x}, {hoveredPoint.y})
              </div>
            )}
          </div>

          {/* Composite Mode Selector Pills */}
          <div className="w-full pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-1.5 justify-center">
            {COMPOSITE_MODES.map((m) => {
              const isSelected = compositeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setCompositeMode(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all interactive-hover ${
                    isSelected
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold shadow-sm'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Multi-Band Pixel Probe Readout & Workspace Hand-off */}
        <div className="flex flex-col gap-4">
          {/* Pixel Probe Card */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Multi-Band Pixel Probe</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {hoveredPoint ? `(${hoveredPoint.x}, ${hoveredPoint.y})` : 'Hover Canvas'}
              </span>
            </div>

            {probedValues ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Red Band</span>
                    <span className="text-red-400 font-semibold">
                      {probedValues['RED'] ? (probedValues['RED'] * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Green Band</span>
                    <span className="text-emerald-400 font-semibold">
                      {probedValues['GREEN'] ? (probedValues['GREEN'] * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Blue Band</span>
                    <span className="text-blue-400 font-semibold">
                      {probedValues['BLUE'] ? (probedValues['BLUE'] * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">NIR Band</span>
                    <span className="text-purple-400 font-semibold">
                      {probedValues['NIR'] ? (probedValues['NIR'] * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30">
                  <span className="text-[9px] text-amber-400 block uppercase">Thermal TIR1 (LST)</span>
                  <span className="text-amber-300 font-bold text-sm">
                    {probedValues['TIR1'] ? `${probedValues['TIR1'].toFixed(2)} °C` : 'N/A'}
                  </span>
                </div>

                {/* Spectral Indices */}
                <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">NDVI (Vegetation):</span>
                    <span className="text-emerald-400 font-bold">{probedValues['NDVI']?.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">NDBI (Built-up):</span>
                    <span className="text-rose-400 font-bold">{probedValues['NDBI']?.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">MNDWI (Water):</span>
                    <span className="text-cyan-400 font-bold">{probedValues['MNDWI']?.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Move cursor over the composite canvas to probe all spectral bands in real-time.
              </div>
            )}
          </div>

          {/* Quick Hand-Off Button into OGTSR Workspace */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Send to OGTSR Super-Resolution
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Use these imported multi-spectral guidance bands and thermal observations as the input pair
              for the OGTSR reconstruction workspace.
            </p>
            <button
              onClick={() => setActiveTab('workspace')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--text-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] text-xs font-medium transition-all shadow-sm interactive-hover"
            >
              <span>Load in Image Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Imported Bands Ledger Grid */}
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Loaded Multi-Spectral Bands ({bands.length})
            </span>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-primary)] interactive-hover"
          >
            <Plus className="w-3 h-3" />
            <span>Add Band</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {bands.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    b.role === 'TIR1' || b.role === 'TIR2'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30'
                      : b.role === 'NIR'
                      ? 'bg-purple-950/40 text-purple-400 border border-purple-600/30'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {b.role}
                </span>

                <button
                  onClick={() => handleDeleteBand(b.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 transition-opacity"
                  title="Remove band"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {b.name}
                </div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                  {b.fileName}
                </div>
              </div>

              <div className="pt-1.5 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-1 text-[10px] font-mono text-[var(--text-secondary)]">
                <div>Scale: {b.resolution} m</div>
                <div>Wave: {b.wavelength || 'N/A'}</div>
                <div>Min: {b.stats.min.toFixed(2)}</div>
                <div>Max: {b.stats.max.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Custom Band Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Import Custom Band Layer
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--text-muted)] font-mono">Band Identifier / Name</label>
                <input
                  type="text"
                  value={newBandName}
                  onChange={(e) => setNewBandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--text-muted)] font-mono">Multi-Spectral Role</label>
                  <select
                    value={newBandRole}
                    onChange={(e) => setNewBandRole(e.target.value as BandRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
                  >
                    {BAND_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--text-muted)] font-mono">Spatial Resolution (m)</label>
                  <input
                    type="number"
                    value={newBandRes}
                    onChange={(e) => setNewBandRes(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--text-muted)] font-mono">Central Wavelength</label>
                <input
                  type="text"
                  value={newBandWave}
                  onChange={(e) => setNewBandWave(e.target.value)}
                  placeholder="e.g. 0.865 µm or 10.8 µm"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Drag and Drop Box Simulation */}
              <div className="p-6 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] text-center space-y-1.5 cursor-pointer">
                <Upload className="w-5 h-5 mx-auto text-[var(--text-muted)]" />
                <div className="font-medium text-[var(--text-primary)]">
                  Drag & Drop GeoTIFF / Raster (.TIF, .PNG, .JP2)
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Simulated multi-spectral array synthesis applied on import
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomBand}
                className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-medium hover:bg-[var(--accent-hover)] transition-all"
              >
                Import Band
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
