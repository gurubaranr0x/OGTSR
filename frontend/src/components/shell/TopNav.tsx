import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Moon,
  Info,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  X
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    isDark,
    toggleTheme,
    scenes,
    activeScene,
    selectScene,
    activeAoi,
    selectAoi,
    hasReferenceData,
    setHasReferenceData,
    setActiveTab
  } = useApp();

  const [showScientificModal, setShowScientificModal] = useState<boolean>(false);

  return (
    <>
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 flex items-center justify-between z-30 select-none">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold tracking-wider text-[var(--text-primary)]">
              OGTSR
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold">
              Research Core
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-secondary)] font-normal">
              Optical-Guided Thermal Super-Resolution
            </span>
          </div>
        </div>

        {/* Center: Context pills (Active Scene, AOI, Band Studio shortcut, Reference Status) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Scene selector */}
          <div className="flex items-center gap-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-3 py-1">
            <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Scene:</span>
            <select
              aria-label="Select Landsat scene"
              className="bg-transparent text-[var(--text-primary)] font-mono text-xs focus:outline-none cursor-pointer"
              value={activeScene.id}
              onChange={(e) => selectScene(e.target.value)}
            >
              {scenes.map((s) => (
                <option key={s.id} value={s.id} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  {s.satellite} ({s.path}/{s.row}) · {s.acquisitionDate}
                </option>
              ))}
            </select>
          </div>

          {/* AOI selector */}
          <div className="flex items-center gap-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-3 py-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">AOI:</span>
            <select
              aria-label="Select Area of Interest"
              className="bg-transparent text-[var(--text-primary)] font-mono text-xs focus:outline-none cursor-pointer"
              value={activeAoi.id}
              onChange={(e) => selectAoi(e.target.value)}
            >
              {activeScene.sampleAois.map((aoi) => (
                <option key={aoi.id} value={aoi.id} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  {aoi.name}
                </option>
              ))}
            </select>
          </div>

          {/* Band Studio Quick Link Button */}
          <button
            onClick={() => setActiveTab('bands')}
            className="flex items-center gap-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all interactive-hover"
            title="Import custom multi-spectral bands & visualize composites"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Multi-Band Studio</span>
          </button>

          {/* Reference Data toggle button */}
          <button
            onClick={() => setHasReferenceData(!hasReferenceData)}
            title="Toggle whether high-resolution thermal reference is available for quantitative validation"
            className={`flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 transition-all interactive-hover ${
              hasReferenceData
                ? 'border-emerald-600/40 text-emerald-400 bg-emerald-950/20'
                : 'border-amber-600/40 text-amber-400 bg-amber-950/20'
            }`}
          >
            {hasReferenceData ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Reference: Available</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Reference: Pending</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Actions, Scientific Principles info, Theme */}
        <div className="flex items-center gap-2">
          {/* Scientific Principle Badge Button */}
          <button
            onClick={() => setShowScientificModal(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-full px-3 py-1 transition-all bg-[var(--bg-secondary)] interactive-hover"
            title="View physical sensor scales and scientific disambiguation notice"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Scientific Notes</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all bg-[var(--bg-secondary)] interactive-hover"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Scientific Principle Modal */}
      {showScientificModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-[var(--text-primary)] space-y-4">
            <button
              onClick={() => setShowScientificModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Info className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold tracking-wide">
                OGTSR Scientific Principles & Sensor Disambiguation
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-[var(--text-secondary)] leading-relaxed">
              <p>
                OGTSR investigates whether high-spatial-resolution optical satellite information (30 m)
                can help reconstruct finer spatial thermal patterns from coarser thermal observations.
              </p>

              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Optical Resolution (OLI B2-B7):</span>
                  <span className="text-emerald-400 font-medium">30 m grid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Thermal Native Sensor Aperture (TIRS):</span>
                  <span className="text-amber-400 font-medium">~100 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Thermal Product Distribution Grid:</span>
                  <span className="text-neutral-300 font-medium">30 m (resampled)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">OGTSR Target Output:</span>
                  <span className="text-white font-semibold">Estimated sub-100 m thermal structure</span>
                </div>
              </div>

              <div className="border-l-2 border-amber-500 pl-3 py-1 text-amber-300/90 text-xs">
                <strong>Important:</strong> The 30 m USGS Landsat Level-2 Surface Temperature grid does NOT
                represent independent 30 m physical thermal measurements. OGTSR provides an experimental
                research reconstruction under local energy conservation, not an infallible temperature measurement.
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Preferred terminology: <em>"Optical-guided thermal spatial reconstruction"</em>, <em>"Estimated thermal structure"</em>, <em>"Research reconstruction"</em>.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowScientificModal(false)}
                className="px-5 py-2 text-xs bg-[var(--text-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] rounded-full font-semibold transition-all interactive-hover"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
