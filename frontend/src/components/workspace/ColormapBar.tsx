import React from 'react';
import { useApp } from '../../context/AppContext';
import { ThermalColormap } from '../../types/ogtsr';
import { RefreshCw } from 'lucide-react';

const COLORMAPS: { id: ThermalColormap; label: string; gradient: string }[] = [
  {
    id: 'inferno',
    label: 'Inferno',
    gradient: 'linear-gradient(to right, #000004, #440a4d, #932667, #dd513a, #fca50a, #fcffa4)'
  },
  {
    id: 'magma',
    label: 'Magma',
    gradient: 'linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)'
  },
  {
    id: 'viridis',
    label: 'Viridis',
    gradient: 'linear-gradient(to right, #440154, #3b528b, #21908d, #5dc963, #fde725)'
  },
  {
    id: 'plasma',
    label: 'Plasma',
    gradient: 'linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)'
  },
  {
    id: 'turbo',
    label: 'Turbo',
    gradient: 'linear-gradient(to right, #30123b, #4662d8, #28bbec, #35f5a8, #a2fc3c, #f8ca30, #e9460a, #7a0403)'
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    gradient: 'linear-gradient(to right, #000000, #ffffff)'
  }
];

export const ColormapBar: React.FC = () => {
  const {
    activeColormap,
    setActiveColormap,
    tempUnit,
    setTempUnit,
    tempRange,
    setTempRange,
    activeRaster
  } = useApp();

  const activeCmapObj = COLORMAPS.find((c) => c.id === activeColormap) || COLORMAPS[0];

  const resetRange = () => {
    setTempRange({
      minC: activeRaster.tempRange.minC,
      maxC: activeRaster.tempRange.maxC
    });
  };

  return (
    <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl text-xs space-y-2.5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Colormap Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">Palette:</span>
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-0.5 rounded-full border border-[var(--border-subtle)]">
            {COLORMAPS.map((cmap) => (
              <button
                key={cmap.id}
                onClick={() => setActiveColormap(cmap.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-all interactive-hover ${
                  activeColormap === cmap.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={`Use ${cmap.label} colormap`}
              >
                {cmap.label}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature Unit Toggle & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetRange}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] interactive-hover"
            title="Auto-stretch temperature scale to AOI min/max"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center bg-[var(--bg-elevated)] p-0.5 rounded-full border border-[var(--border-subtle)] font-mono text-[10px]">
            <button
              onClick={() => setTempUnit('celsius')}
              className={`px-2.5 py-0.5 rounded-full transition-all interactive-hover ${
                tempUnit === 'celsius'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit('kelvin')}
              className={`px-2.5 py-0.5 rounded-full transition-all interactive-hover ${
                tempUnit === 'kelvin'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              K
            </button>
          </div>
        </div>
      </div>

      {/* Visual Color Ramp & Temperature bounds */}
      <div className="space-y-1.5">
        <div
          className="h-3 w-full rounded-full border border-[var(--border-subtle)] shadow-inner"
          style={{ background: activeCmapObj.gradient }}
        />
        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <span>Min:</span>
            <input
              type="number"
              aria-label="Minimum temperature"
              value={tempRange.minC}
              onChange={(e) =>
                setTempRange({ ...tempRange, minC: parseFloat(e.target.value) || 0 })
              }
              className="w-12 px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full text-center text-[10px] text-[var(--text-primary)] focus:outline-none"
            />
            <span>{tempUnit === 'celsius' ? '°C' : 'K'}</span>
          </div>

          <span className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider">
            {activeCmapObj.label} Ramp
          </span>

          <div className="flex items-center gap-1">
            <span>Max:</span>
            <input
              type="number"
              aria-label="Maximum temperature"
              value={tempRange.maxC}
              onChange={(e) =>
                setTempRange({ ...tempRange, maxC: parseFloat(e.target.value) || 50 })
              }
              className="w-12 px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full text-center text-[10px] text-[var(--text-primary)] focus:outline-none"
            />
            <span>{tempUnit === 'celsius' ? '°C' : 'K'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
