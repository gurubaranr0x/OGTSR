import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { datasetService } from '../../services/datasetService';
import {
  Database,
  Layers,
  MapPin,
  Calendar,
  Sun,
  Cloud,
  Compass,
  FileCode,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const DatasetInspector: React.FC = () => {
  const { scenes, activeScene, selectScene, activeAoi, selectAoi, setActiveTab } = useApp();
  const bands = datasetService.getBands();
  const [showFullMetadata, setShowFullMetadata] = useState<boolean>(false);
  const [selectedBandId, setSelectedBandId] = useState<string>('ST_B10');

  const selectedBand = bands.find((b) => b.id === selectedBandId) || bands[0];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Remote Sensing Ingestion & Metadata</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Landsat Collection 2 Level-2 Surface Observation
          </h1>
        </div>

        {/* Scene Switcher Dropdown & Band Studio Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('bands')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-all interactive-hover"
            title="Import custom multi-spectral bands & view composites"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Import Bands Studio</span>
          </button>

          <span className="text-xs text-[var(--text-muted)] font-mono pl-1">Scene:</span>
          <select
            aria-label="Select active Landsat scene"
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none"
            value={activeScene.id}
            onChange={(e) => selectScene(e.target.value)}
          >
            {scenes.map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--bg-elevated)]">
                {s.satellite} ({s.path}/{s.row}) · {s.acquisitionDate}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Metadata Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Satellite & Sensor</span>
          </div>
          <div className="text-sm font-semibold font-mono text-[var(--text-primary)]">
            {activeScene.satellite} {activeScene.sensor}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">{activeScene.productLevel}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Acquisition Date</span>
          </div>
          <div className="text-sm font-semibold font-mono text-[var(--text-primary)]">
            {activeScene.acquisitionDate}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">{activeScene.acquisitionTime}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud & Shadow</span>
          </div>
          <div className="text-sm font-semibold font-mono text-emerald-400">
            {activeScene.cloudCover.toFixed(2)}%
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Clear sky condition</div>
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>Solar Elevation</span>
          </div>
          <div className="text-sm font-semibold font-mono text-[var(--text-primary)]">
            {activeScene.sunElevation.toFixed(1)}°
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Azimuth: {activeScene.sunAzimuth.toFixed(1)}°</div>
        </div>
      </div>

      {/* Spatial Scale Specification (Scientific Disambiguation) */}
      <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Spatial Resolution & Coordinate Reference System
          </span>
          <span className="text-xs font-mono text-[var(--accent)] font-medium">
            {activeScene.spatial.crs}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Optical Grid</div>
            <div className="text-base font-semibold font-mono text-emerald-400">30 m</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">
              OLI sensor bands (B1–B7) directly measured at 30 m physical pixel pitch.
            </div>
          </div>

          <div className="p-3 rounded bg-[var(--bg-elevated)] border border-amber-500/30">
            <div className="text-[10px] text-amber-400 uppercase">Thermal Native Scale</div>
            <div className="text-base font-semibold font-mono text-amber-400">~100 m</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">
              TIRS physical sensor instantaneous field of view. Sub-100m features are blurred by the point spread function.
            </div>
          </div>

          <div className="p-3 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Distributed Product Grid</div>
            <div className="text-base font-semibold font-mono text-slate-300">30 m (resampled)</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">
              Resampled cubic grid from native ~100 m. Does NOT represent true independent 30 m thermal observations.
            </div>
          </div>
        </div>
      </div>

      {/* Bands Explorer & Radiometric Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Band List */}
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Bands in Scene ({bands.length})
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {bands.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBandId(b.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded text-left text-xs transition-colors ${
                  selectedBandId === b.id
                    ? 'bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)]'
                    : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                <div>
                  <div className="font-mono font-medium">{b.id}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{b.commonName}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      b.type === 'thermal'
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30'
                        : b.type === 'optical'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {b.type.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{b.resolution}m</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Band Details & Calibration Formulas */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-[var(--text-muted)]">{selectedBand.id}</span>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {selectedBand.commonName} ({selectedBand.name})
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">{selectedBand.wavelength}</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {selectedBand.description}
          </p>

          {/* Radiometric Calibration Spec */}
          <div className="p-3.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="text-xs font-mono uppercase text-[var(--accent)] font-medium">
              USGS Collection 2 Level-2 Calibration Formula
            </div>

            {selectedBand.type === 'thermal' ? (
              <div className="space-y-1.5 font-mono text-xs text-[var(--text-primary)]">
                <div className="p-2 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)]">
                  <code>Temperature (Kelvin) = DN × 0.00341802 + 149.0</code>
                </div>
                <div className="p-2 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)]">
                  <code>Temperature (Celsius) = Temperature (Kelvin) - 273.15</code>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] pt-1">
                  Scale Factor: <span className="text-amber-400">0.00341802</span> | Add Offset: <span className="text-amber-400">149.0</span>
                </div>
              </div>
            ) : selectedBand.type === 'optical' ? (
              <div className="space-y-1.5 font-mono text-xs text-[var(--text-primary)]">
                <div className="p-2 rounded bg-[var(--code-bg)] border border-[var(--border-subtle)]">
                  <code>Surface Reflectance = DN × 0.0000275 - 0.20</code>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] pt-1">
                  Scale Factor: <span className="text-emerald-400">0.0000275</span> | Add Offset: <span className="text-emerald-400">-0.2</span>
                </div>
              </div>
            ) : (
              <div className="font-mono text-xs text-[var(--text-secondary)]">
                Bit-packed quality mask. Standard USGS pixel quality bits.
              </div>
            )}
          </div>

          {/* AOIs available in this scene */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Research AOIs in this Scene
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeScene.sampleAois.map((aoi) => {
                const isSelected = aoi.id === activeAoi.id;
                return (
                  <button
                    key={aoi.id}
                    onClick={() => {
                      selectAoi(aoi.id);
                      setActiveTab('workspace');
                    }}
                    className={`p-2.5 rounded border text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span>{aoi.name}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[var(--bg-secondary)]">
                        {aoi.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1">
                      {aoi.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Raw MTL Metadata Viewer */}
      <div className="border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
        <button
          onClick={() => setShowFullMetadata(!showFullMetadata)}
          className="w-full flex items-center justify-between p-3.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-2 font-mono">
            <FileCode className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Landsat MTL Metadata Header ({activeScene.id}_MTL.txt)</span>
          </div>
          {showFullMetadata ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showFullMetadata && (
          <div className="p-4 bg-[var(--code-bg)] border-t border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] space-y-1 overflow-x-auto max-h-72">
            <div>GROUP = LEVEL2_PROCESSING_RECORD</div>
            <div>&nbsp;&nbsp;ORIGIN = "Image Processing Operations, USGS Earth Resources Observation and Science (EROS) Center"</div>
            <div>&nbsp;&nbsp;SPACECRAFT_ID = "{activeScene.satellite.toUpperCase()}"</div>
            <div>&nbsp;&nbsp;SENSOR_ID = "{activeScene.sensor}"</div>
            <div>&nbsp;&nbsp;LANDSAT_SCENE_ID = "{activeScene.id}"</div>
            <div>&nbsp;&nbsp;DATE_ACQUIRED = {activeScene.acquisitionDate}</div>
            <div>&nbsp;&nbsp;SCENE_CENTER_TIME = "{activeScene.acquisitionTime}"</div>
            <div>&nbsp;&nbsp;SUN_ELEVATION = {activeScene.sunElevation}</div>
            <div>&nbsp;&nbsp;SUN_AZIMUTH = {activeScene.sunAzimuth}</div>
            <div>&nbsp;&nbsp;CLOUD_COVER = {activeScene.cloudCover}</div>
            <div>&nbsp;&nbsp;REFLECTANCE_MULT_BAND_2 = 2.75e-05</div>
            <div>&nbsp;&nbsp;REFLECTANCE_ADD_BAND_2 = -0.2</div>
            <div>&nbsp;&nbsp;TEMPERATURE_MULT_BAND_ST_B10 = 0.00341802</div>
            <div>&nbsp;&nbsp;TEMPERATURE_ADD_BAND_ST_B10 = 149.0</div>
            <div>&nbsp;&nbsp;GRID_CELL_SIZE_REFLECTANCE = 30.00</div>
            <div>&nbsp;&nbsp;GRID_CELL_SIZE_THERMAL = 30.00 (Native sensor aperture: ~100m)</div>
            <div>END_GROUP = LEVEL2_PROCESSING_RECORD</div>
          </div>
        )}
      </div>
    </div>
  );
};
