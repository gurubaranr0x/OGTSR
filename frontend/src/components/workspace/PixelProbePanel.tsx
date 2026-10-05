import React from 'react';
import { useApp } from '../../context/AppContext';
import { Crosshair, Eye, Info } from 'lucide-react';
import { formatTemp } from '../../utils/colormaps';

export const PixelProbePanel: React.FC = () => {
  const { hoveredPixel, selectedPixel, tempUnit, hasReferenceData } = useApp();
  const pixel = selectedPixel || hoveredPixel;

  if (!pixel) {
    return (
      <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-muted)] flex items-center gap-2 select-none">
        <Crosshair className="w-4 h-4 text-[var(--text-muted)]" />
        <span>Hover or click on the image to inspect pixel values and physical temperatures</span>
      </div>
    );
  }

  const coarseC = pixel.thermalCoarseCelsius ?? 0;
  const reconC = pixel.reconstructedCelsius ?? 0;
  const refC = pixel.referenceCelsius;
  const residual = refC !== undefined ? reconC - refC : reconC - coarseC;

  return (
    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-sm text-xs space-y-2.5 select-none">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-[var(--text-primary)]">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pixel Probe</span>
          {selectedPixel && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold">
              Pinned
            </span>
          )}
        </div>
        <div className="font-mono text-[10px] text-[var(--text-muted)]">
          Grid: ({pixel.x}, {pixel.y})
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
        {/* Optical Info */}
        <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[9px] text-[var(--text-muted)] uppercase">Optical RGB</div>
          <div className="text-[var(--text-primary)] font-semibold">
            {pixel.opticalRgb
              ? `${(pixel.opticalRgb[0] * 100).toFixed(0)}%, ${(pixel.opticalRgb[1] * 100).toFixed(0)}%, ${(pixel.opticalRgb[2] * 100).toFixed(0)}%`
              : 'N/A'}
          </div>
          <div className="text-[9px] text-emerald-400 mt-0.5">
            NDVI: {pixel.opticalNdvi ? pixel.opticalNdvi.toFixed(2) : '0.00'}
          </div>
        </div>

        {/* Coarse Thermal */}
        <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/20">
          <div className="text-[9px] text-amber-400 uppercase">Thermal (~100m)</div>
          <div className="text-amber-300 font-bold">
            {formatTemp(coarseC, tempUnit)}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
            Raw DN: {pixel.thermalRawDn || 'N/A'}
          </div>
        </div>

        {/* Reconstructed Thermal */}
        <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-neutral-700">
          <div className="text-[9px] text-neutral-300 uppercase">OGTSR Recon</div>
          <div className="text-white font-bold">
            {formatTemp(reconC, tempUnit)}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
            Δ Coarse: {(reconC - coarseC > 0 ? '+' : '') + (reconC - coarseC).toFixed(2)} °C
          </div>
        </div>

        {/* Reference / Residual */}
        <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="text-[9px] text-[var(--text-muted)] uppercase">
            {hasReferenceData && refC !== undefined ? 'Reference (Truth)' : 'Residual Mode'}
          </div>
          <div className="font-semibold text-[var(--text-primary)]">
            {hasReferenceData && refC !== undefined
              ? formatTemp(refC, tempUnit)
              : 'Ref. Pending'}
          </div>
          <div
            className={`text-[9px] mt-0.5 font-medium ${
              Math.abs(residual) < 0.8
                ? 'text-emerald-400'
                : Math.abs(residual) < 2.0
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {hasReferenceData && refC !== undefined
              ? `Residual: ${(residual > 0 ? '+' : '') + residual.toFixed(2)} K`
              : 'Coarse flux only'}
          </div>
        </div>
      </div>
    </div>
  );
};
