import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { imageService } from '../../services/imageService';
import { formatTemp } from '../../utils/colormaps';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  BarChart3,
  TrendingUp,
  Info,
  HelpCircle
} from 'lucide-react';

export const ValidationView: React.FC = () => {
  const {
    activeRaster,
    activeAoi,
    validationAnalysis,
    hasReferenceData,
    setHasReferenceData,
    tempUnit,
    transectY,
    setTransectY,
    setActiveTab
  } = useApp();

  const { globalMetrics, classStats, histogramDiff } = validationAnalysis;

  // Extract spatial transect profile data along line transectY
  const transectPoints = imageService.getTransect(activeRaster, transectY);

  // SVG dimensions for transect graph
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const graphW = svgWidth - padding.left - padding.right;
  const graphH = svgHeight - padding.top - padding.bottom;

  // Compute temp min/max for the transect
  let tMin = Infinity, tMax = -Infinity;
  transectPoints.forEach((p) => {
    if (p.coarseThermalC < tMin) tMin = p.coarseThermalC;
    if (p.coarseThermalC > tMax) tMax = p.coarseThermalC;
    if (p.reconstructedC < tMin) tMin = p.reconstructedC;
    if (p.reconstructedC > tMax) tMax = p.reconstructedC;
    if (p.referenceC !== undefined) {
      if (p.referenceC < tMin) tMin = p.referenceC;
      if (p.referenceC > tMax) tMax = p.referenceC;
    }
  });
  tMin = Math.floor(tMin - 1.5);
  tMax = Math.ceil(tMax + 1.5);
  const tSpan = Math.max(1, tMax - tMin);

  // Generate SVG path strings for transect curves
  const makePath = (valExtractor: (p: typeof transectPoints[0]) => number | undefined) => {
    let d = '';
    transectPoints.forEach((p, i) => {
      const v = valExtractor(p);
      if (v === undefined) return;
      const x = padding.left + (i / (transectPoints.length - 1)) * graphW;
      const y = padding.top + (1 - (v - tMin) / tSpan) * graphH;
      if (i === 0) d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return d;
  };

  const coarsePath = makePath((p) => p.coarseThermalC);
  const reconPath = makePath((p) => p.reconstructedC);
  const refPath = hasReferenceData ? makePath((p) => p.referenceC) : '';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
            <Scale className="w-4 h-4" />
            <span>Empirical & Quantitative Validation</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Thermal Reconstruction Accuracy Assessment
          </h1>
        </div>

        {/* Reference Data Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Reference Dataset:</span>
          <button
            onClick={() => setHasReferenceData(!hasReferenceData)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-medium border transition-all interactive-hover ${
              hasReferenceData
                ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-400'
                : 'bg-amber-950/30 border-amber-600/40 text-amber-400'
            }`}
          >
            {hasReferenceData ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulated Ground Truth (Active)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>No Reference (Coarse Consistency Only)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Missing Reference Data Honest Warning Banner */}
      {!hasReferenceData && (
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-amber-500/40 flex items-start gap-3.5 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-amber-300">
              Reference Data Required for Quantitative Validation
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Without independent high-resolution thermal reference measurements (e.g. airborne MASTER/TIMS
              or simultaneous ECOSTRESS overpasses), true ground-truth error metrics (RMSE, MAE, PSNR, SSIM)
              cannot be computed. The system displays only spatial flux conservation and cross-section profiles.
            </p>
          </div>
        </div>
      )}

      {/* Quantitative Metric Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        {/* RMSE */}
        <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">RMSE (Kelvin)</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {hasReferenceData && globalMetrics.rmseKelvin !== undefined
              ? `${globalMetrics.rmseKelvin.toFixed(2)} K`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Root Mean Square Error</div>
        </div>

        {/* MAE */}
        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">MAE (Kelvin)</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {hasReferenceData && globalMetrics.maeKelvin !== undefined
              ? `${globalMetrics.maeKelvin.toFixed(2)} K`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Mean Absolute Error</div>
        </div>

        {/* PSNR */}
        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">PSNR (dB)</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {hasReferenceData && globalMetrics.psnrDb !== undefined
              ? `${globalMetrics.psnrDb.toFixed(1)} dB`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Peak Signal-to-Noise</div>
        </div>

        {/* SSIM */}
        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">SSIM (0 - 1)</div>
          <div className="text-2xl font-bold text-blue-400">
            {hasReferenceData && globalMetrics.ssim !== undefined
              ? globalMetrics.ssim.toFixed(3)
              : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Structural Similarity</div>
        </div>

        {/* Flux Delta */}
        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-emerald-500/30 space-y-1">
          <div className="text-[10px] text-emerald-400 uppercase">Flux Conservation Δ</div>
          <div className="text-2xl font-bold text-emerald-400">
            {globalMetrics.spatialEnergyConservationDeltaK !== undefined
              ? `${globalMetrics.spatialEnergyConservationDeltaK.toFixed(3)} K`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">Local Energy Residual</div>
        </div>
      </div>

      {/* Spatial Cross-Section Transect Graph */}
      <div className="p-5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Spatial Cross-Section Transect (Row Y = {transectY})</span>
            </span>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Inspect thermal gradients across physical distance (30 m pixel increments).
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span className="text-amber-400 text-[11px]">Coarse Observation (~100m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" />
              <span className="text-blue-400 text-[11px]">OGTSR Reconstructed</span>
            </div>
            {hasReferenceData && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                <span className="text-emerald-400 text-[11px]">Reference Ground Truth</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Transect Plot */}
        <div className="w-full overflow-x-auto bg-[var(--bg-elevated)] p-3 rounded border border-[var(--border-subtle)]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const y = padding.top + (1 - frac) * graphH;
              const val = tMin + frac * tSpan;
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + graphW}
                    y2={y}
                    stroke="var(--border-subtle)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="font-mono text-[9px] fill-[var(--text-muted)]"
                  >
                    {val.toFixed(0)}°C
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines (distance) */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const x = padding.left + frac * graphW;
              const dist = (frac * (transectPoints.length * 30)) / 1000;
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphH}
                    stroke="var(--border-subtle)"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={x}
                    y={padding.top + graphH + 16}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-[var(--text-muted)]"
                  >
                    {dist.toFixed(1)} km
                  </text>
                </g>
              );
            })}

            {/* Coarse thermal path */}
            <path
              d={coarsePath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* OGTSR reconstructed path */}
            <path
              d={reconPath}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.0"
              strokeLinecap="round"
            />

            {/* Reference ground truth path */}
            {hasReferenceData && refPath && (
              <path
                d={refPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>Physical Span: ~7.68 km along row Y = {transectY}</span>
          <div className="flex items-center gap-2">
            <span>Change Row:</span>
            <input
              type="range"
              aria-label="Transect row"
              min="0"
              max="255"
              value={transectY}
              onChange={(e) => setTransectY(parseInt(e.target.value, 10))}
              className="w-24 h-1.5 bg-[var(--bg-secondary)] rounded cursor-pointer accent-[var(--accent)]"
            />
          </div>
        </div>
      </div>

      {/* Region-Level & Land Cover Error Breakdown */}
      {hasReferenceData && classStats.length > 0 && (
        <div className="p-5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Region & Land-Cover Breakdown (Error vs. Reference)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="py-2">Land Cover Class</th>
                  <th className="py-2 text-right">Pixel Count</th>
                  <th className="py-2 text-right">Mean Bias (K)</th>
                  <th className="py-2 text-right">RMSE (K)</th>
                  <th className="py-2 text-right">MAE (K)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {classStats.map((stat) => (
                  <tr key={stat.className} className="hover:bg-[var(--bg-tertiary)]">
                    <td className="py-2 font-medium text-[var(--text-primary)]">
                      {stat.className}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {stat.count.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 text-right ${
                        Math.abs(stat.meanDiffC) < 0.2 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {(stat.meanDiffC > 0 ? '+' : '') + stat.meanDiffC.toFixed(2)} K
                    </td>
                    <td className="py-2 text-right text-[var(--text-primary)] font-semibold">
                      {stat.rmseC.toFixed(2)} K
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {stat.maeC.toFixed(2)} K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
