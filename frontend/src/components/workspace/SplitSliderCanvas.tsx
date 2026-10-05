import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { imageService } from '../../services/imageService';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sliders,
  Move,
  Layers,
  Activity
} from 'lucide-react';

export const SplitSliderCanvas: React.FC = () => {
  const {
    activeRaster,
    activeAoi,
    viewMode,
    activeColormap,
    tempRange,
    splitPosition,
    setSplitPosition,
    blendOpacity,
    setBlendOpacity,
    zoom,
    setZoom,
    pan,
    setPan,
    resetView,
    setHoveredPixel,
    selectedPixel,
    setSelectedPixel,
    transectY,
    setTransectY,
    hasReferenceData
  } = useApp();

  // Primary canvases
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hidden offscreen rendering canvases
  const offscreenOpticalRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenThermalRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenReconRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRefRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenDiffRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [singleLayerChoice, setSingleLayerChoice] = useState<string>('reconstruction_estimated');
  const [leftLayerChoice, setLeftLayerChoice] = useState<string>('thermal_coarse');
  const [rightLayerChoice, setRightLayerChoice] = useState<string>('reconstruction_estimated');

  // Ensure offscreen canvases exist
  if (!offscreenOpticalRef.current) offscreenOpticalRef.current = document.createElement('canvas');
  if (!offscreenThermalRef.current) offscreenThermalRef.current = document.createElement('canvas');
  if (!offscreenReconRef.current) offscreenReconRef.current = document.createElement('canvas');
  if (!offscreenRefRef.current) offscreenRefRef.current = document.createElement('canvas');
  if (!offscreenDiffRef.current) offscreenDiffRef.current = document.createElement('canvas');

  // Render raster data to offscreen buffers when raster or colormap/tempRange changes
  useEffect(() => {
    if (!activeRaster) return;
    const { minC, maxC } = tempRange;

    imageService.renderLayerToCanvas(
      offscreenOpticalRef.current!,
      activeRaster,
      'optical_rgb',
      activeColormap,
      minC,
      maxC
    );

    imageService.renderLayerToCanvas(
      offscreenThermalRef.current!,
      activeRaster,
      'thermal_coarse',
      activeColormap,
      minC,
      maxC
    );

    imageService.renderLayerToCanvas(
      offscreenReconRef.current!,
      activeRaster,
      'reconstruction_estimated',
      activeColormap,
      minC,
      maxC
    );

    imageService.renderLayerToCanvas(
      offscreenRefRef.current!,
      activeRaster,
      'reference_thermal',
      activeColormap,
      minC,
      maxC
    );

    imageService.renderLayerToCanvas(
      offscreenDiffRef.current!,
      activeRaster,
      'difference_residual',
      activeColormap,
      minC,
      maxC
    );

    drawComposite();
  }, [activeRaster, activeColormap, tempRange, viewMode, splitPosition, blendOpacity, singleLayerChoice, leftLayerChoice, rightLayerChoice, transectY]);

  const getSourceCanvas = (layerId: string): HTMLCanvasElement => {
    switch (layerId) {
      case 'optical_rgb':
        return offscreenOpticalRef.current!;
      case 'thermal_coarse':
        return offscreenThermalRef.current!;
      case 'reconstruction_estimated':
        return offscreenReconRef.current!;
      case 'reference_thermal':
        return offscreenRefRef.current!;
      case 'difference_residual':
        return offscreenDiffRef.current!;
      default:
        return offscreenReconRef.current!;
    }
  };

  // Main composite draw loop
  const drawComposite = useCallback(() => {
    if (viewMode === 'side_by_side') {
      // Draw left canvas
      if (leftCanvasRef.current) {
        const ctx = leftCanvasRef.current.getContext('2d');
        const src = getSourceCanvas(leftLayerChoice);
        if (ctx && src) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, leftCanvasRef.current.width, leftCanvasRef.current.height);
          ctx.drawImage(src, 0, 0, leftCanvasRef.current.width, leftCanvasRef.current.height);
          drawTransectLine(ctx, leftCanvasRef.current.width, leftCanvasRef.current.height);
        }
      }
      // Draw right canvas
      if (rightCanvasRef.current) {
        const ctx = rightCanvasRef.current.getContext('2d');
        const src = getSourceCanvas(rightLayerChoice);
        if (ctx && src) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, rightCanvasRef.current.width, rightCanvasRef.current.height);
          ctx.drawImage(src, 0, 0, rightCanvasRef.current.width, rightCanvasRef.current.height);
          drawTransectLine(ctx, rightCanvasRef.current.width, rightCanvasRef.current.height);
        }
      }
      return;
    }

    // Unified canvas (split_swipe, opacity_blend, difference_map, single_layer)
    if (!mainCanvasRef.current) return;
    const ctx = mainCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const w = mainCanvasRef.current.width;
    const h = mainCanvasRef.current.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    if (viewMode === 'split_swipe') {
      const splitX = Math.round((splitPosition / 100) * w);
      const leftSrc = getSourceCanvas(leftLayerChoice);
      const rightSrc = getSourceCanvas(rightLayerChoice);

      // Draw right layer full
      ctx.drawImage(rightSrc, 0, 0, w, h);

      // Draw left layer clipped
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      ctx.drawImage(leftSrc, 0, 0, w, h);
      ctx.restore();

      // Draw split divider line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // Split handle circle
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(splitX, h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (viewMode === 'opacity_blend') {
      const baseSrc = getSourceCanvas(leftLayerChoice);
      const topSrc = getSourceCanvas(rightLayerChoice);

      ctx.globalAlpha = 1.0;
      ctx.drawImage(baseSrc, 0, 0, w, h);
      ctx.globalAlpha = blendOpacity;
      ctx.drawImage(topSrc, 0, 0, w, h);
      ctx.globalAlpha = 1.0;
    } else if (viewMode === 'difference_map') {
      const diffSrc = offscreenDiffRef.current!;
      ctx.drawImage(diffSrc, 0, 0, w, h);
    } else if (viewMode === 'single_layer') {
      const src = getSourceCanvas(singleLayerChoice);
      ctx.drawImage(src, 0, 0, w, h);
    }

    // Draw active transect guide line across canvas
    drawTransectLine(ctx, w, h);
  }, [
    viewMode,
    splitPosition,
    blendOpacity,
    singleLayerChoice,
    leftLayerChoice,
    rightLayerChoice,
    transectY
  ]);

  const drawTransectLine = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const py = Math.round((transectY / 256) * h);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Pixel Probe Hover / Click Handlers
  const handleCanvasMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.floor((clientX / rect.width) * 256);
    const py = Math.floor((clientY / rect.height) * 256);

    const probed = imageService.probePixel(activeRaster, activeAoi, px, py);
    setHoveredPixel(probed);
  };

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const px = Math.floor((clientX / rect.width) * 256);
    const py = Math.floor((clientY / rect.height) * 256);

    const probed = imageService.probePixel(activeRaster, activeAoi, px, py);
    setSelectedPixel(probed);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(Math.max(0.6, Math.min(6.0, zoom + delta)));
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.altKey || e.metaKey || e.shiftKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden select-none">
      {/* Top Workspace Toolbar */}
      <div className="h-11 px-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between gap-3 text-xs">
        {/* Layer / Mode Selectors */}
        <div className="flex items-center gap-2">
          {viewMode === 'side_by_side' && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-[var(--text-muted)]">Left:</span>
              <select
                aria-label="Select left comparison layer"
                value={leftLayerChoice}
                onChange={(e) => setLeftLayerChoice(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1 text-[var(--text-primary)] focus:outline-none"
              >
                <option value="thermal_coarse">Coarse Thermal (~100m)</option>
                <option value="optical_rgb">Optical RGB (30m)</option>
                <option value="reconstruction_estimated">OGTSR Reconstruction</option>
                <option value="reference_thermal">Reference Ground Truth</option>
              </select>

              <span className="text-[var(--text-muted)] pl-2">Right:</span>
              <select
                aria-label="Select right comparison layer"
                value={rightLayerChoice}
                onChange={(e) => setRightLayerChoice(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1 text-[var(--text-primary)] focus:outline-none"
              >
                <option value="reconstruction_estimated">OGTSR Reconstruction</option>
                <option value="reference_thermal">Reference Ground Truth</option>
                <option value="thermal_coarse">Coarse Thermal (~100m)</option>
                <option value="optical_rgb">Optical RGB (30m)</option>
              </select>
            </div>
          )}

          {viewMode === 'split_swipe' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Swipe:</span>
              <span className="text-[11px] font-mono text-amber-400">Coarse (~100m)</span>
              <input
                type="range"
                aria-label="Split swipe position"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <span className="text-[11px] font-mono text-blue-400">OGTSR (Fine)</span>
            </div>
          )}

          {viewMode === 'opacity_blend' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Blend Opacity:</span>
              <input
                type="range"
                aria-label="Blend opacity"
                min="0"
                max="1"
                step="0.05"
                value={blendOpacity}
                onChange={(e) => setBlendOpacity(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <span className="text-[10px] font-mono text-[var(--text-primary)]">
                {Math.round(blendOpacity * 100)}%
              </span>
            </div>
          )}

          {viewMode === 'single_layer' && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-[var(--text-muted)]">Layer:</span>
              <select
                aria-label="Select single layer to display"
                value={singleLayerChoice}
                onChange={(e) => setSingleLayerChoice(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1 text-[var(--text-primary)] focus:outline-none"
              >
                <option value="reconstruction_estimated">OGTSR Reconstruction (Estimated)</option>
                <option value="thermal_coarse">Landsat TIRS Coarse ST_B10 (~100m)</option>
                <option value="optical_rgb">Landsat OLI True-Color RGB (30m)</option>
                <option value="reference_thermal">High-Resolution Reference (Truth)</option>
                <option value="difference_residual">Spatial Residual Anomaly (Diff)</option>
              </select>
            </div>
          )}
        </div>

        {/* Viewport Nav Controls (Zoom, Pan, Fit, Transect Line) */}
        <div className="flex items-center gap-2">
          {/* Transect Row Slider */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] pr-2 border-r border-[var(--border-subtle)]">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Transect Y: {transectY}</span>
            <input
              type="range"
              aria-label="Transect Y row coordinate"
              min="0"
              max="255"
              value={transectY}
              onChange={(e) => setTransectY(parseInt(e.target.value, 10))}
              className="w-16 h-1 bg-[var(--bg-secondary)] rounded-full cursor-pointer accent-amber-500"
            />
          </div>

          <button
            onClick={() => setZoom(Math.max(0.6, zoom - 0.25))}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all interactive-hover"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-[var(--text-secondary)] min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(6.0, zoom + 0.25))}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all interactive-hover"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all interactive-hover"
            title="Reset zoom & pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-[var(--bg-secondary)] cursor-crosshair"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="transition-transform duration-75 flex items-center justify-center gap-4"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {viewMode === 'side_by_side' ? (
            <div className="flex items-center gap-4">
              {/* Left Viewport */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                  {leftLayerChoice === 'thermal_coarse'
                    ? 'Landsat TIRS Observation (~100m native)'
                    : leftLayerChoice === 'optical_rgb'
                    ? 'Landsat OLI Optical Guidance (30m)'
                    : leftLayerChoice}
                </div>
                <canvas
                  ref={leftCanvasRef}
                  width={256}
                  height={256}
                  className="rounded border border-[var(--border-strong)] shadow-md bg-black"
                  onMouseMove={(e) => handleCanvasMouseMove(e, leftCanvasRef.current!)}
                  onClick={(e) => handleCanvasClick(e, leftCanvasRef.current!)}
                />
              </div>

              {/* Right Viewport */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="text-[10px] font-mono text-[var(--accent)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-subtle)] font-medium">
                  {rightLayerChoice === 'reconstruction_estimated'
                    ? 'OGTSR Reconstruction (Estimated)'
                    : rightLayerChoice === 'reference_thermal'
                    ? 'Reference Ground Truth (When Available)'
                    : rightLayerChoice}
                </div>
                <canvas
                  ref={rightCanvasRef}
                  width={256}
                  height={256}
                  className="rounded border border-[var(--border-strong)] shadow-md bg-black"
                  onMouseMove={(e) => handleCanvasMouseMove(e, rightCanvasRef.current!)}
                  onClick={(e) => handleCanvasClick(e, rightCanvasRef.current!)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2.5 py-0.5 rounded border border-[var(--border-subtle)]">
                {viewMode === 'split_swipe' && 'Split Comparison (Left: Coarse ~100m | Right: OGTSR Fine)'}
                {viewMode === 'opacity_blend' && 'Cross-Fade Blend Overlay'}
                {viewMode === 'difference_map' && 'Thermal Residual Map (Reconstruction - Coarse)'}
                {viewMode === 'single_layer' && `Single Layer: ${singleLayerChoice}`}
              </div>
              <canvas
                ref={mainCanvasRef}
                width={256}
                height={256}
                className="rounded border border-[var(--border-strong)] shadow-lg bg-black"
                onMouseMove={(e) => handleCanvasMouseMove(e, mainCanvasRef.current!)}
                onClick={(e) => handleCanvasClick(e, mainCanvasRef.current!)}
              />
            </div>
          )}
        </div>

        {/* Scientific Scale Bar & Spatial Stamp */}
        <div className="absolute bottom-3 left-3 bg-[var(--bg-elevated)]/90 backdrop-blur-sm border border-[var(--border-subtle)] rounded p-2 text-[10px] font-mono text-[var(--text-secondary)] space-y-1 select-none pointer-events-none">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <span>Scale: 30 m grid pitch</span>
            <span className="text-[var(--text-muted)]">|</span>
            <span>AOI: ~7.68 km²</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-[var(--text-primary)] relative">
              <div className="absolute -top-1 left-0 w-0.5 h-3 bg-[var(--text-primary)]" />
              <div className="absolute -top-1 right-0 w-0.5 h-3 bg-[var(--text-primary)]" />
            </div>
            <span>500 m</span>
          </div>
        </div>

        {/* Pan navigation tip */}
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)]/80 px-2 py-1 rounded border border-[var(--border-subtle)] pointer-events-none">
          Shift / Alt + Drag to Pan · Scroll to Zoom
        </div>
      </div>
    </div>
  );
};
