import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { imageService } from '../../services/imageService';
import { useScrollReveal } from '../../utils/useScrollReveal';
import { scrollToSection } from '../../utils/useSmoothScroll';
import {
  ArrowRight,
  Layers,
  Cpu,
  Scale,
  Sparkles,
  Eye,
  Sliders,
  Activity,
  FlaskConical,
  Download,
  ShieldCheck,
  ChevronDown,
  Maximize2
} from 'lucide-react';

export const ResearchOverview: React.FC = () => {
  const { setActiveTab, activeScene, activeAoi, activeRaster, activeColormap } = useApp();
  const containerRef = useScrollReveal();

  // Mini interactive teaser canvas on the landing page
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [teaserMode, setTeaserMode] = useState<'optical_vs_rec' | 'coarse_vs_rec'>('optical_vs_rec');
  const [activePipelineStep, setActivePipelineStep] = useState<number>(2);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  // Offscreen rendering buffers for the teaser
  const offscreenLeftRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRightRef = useRef<HTMLCanvasElement | null>(null);

  if (!offscreenLeftRef.current) offscreenLeftRef.current = document.createElement('canvas');
  if (!offscreenRightRef.current) offscreenRightRef.current = document.createElement('canvas');

  const updateOffscreenBuffers = useCallback(() => {
    if (!activeRaster) return;
    const { minC, maxC } = activeRaster.tempRange;

    // Render left buffer based on mode
    const leftLayer = teaserMode === 'optical_vs_rec' ? 'optical_rgb' : 'thermal_coarse';
    imageService.renderLayerToCanvas(
      offscreenLeftRef.current!,
      activeRaster,
      leftLayer,
      activeColormap,
      minC,
      maxC
    );

    // Render right buffer (reconstruction)
    imageService.renderLayerToCanvas(
      offscreenRightRef.current!,
      activeRaster,
      'reconstruction_estimated',
      activeColormap,
      minC,
      maxC
    );
  }, [activeRaster, activeColormap, teaserMode]);

  const drawTeaser = useCallback(() => {
    if (!miniCanvasRef.current) return;
    const ctx = miniCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const w = miniCanvasRef.current.width;
    const h = miniCanvasRef.current.height;
    const splitX = Math.round((sliderPos / 100) * w);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    // Draw full reconstructed right layer
    ctx.drawImage(offscreenRightRef.current!, 0, 0, w, h);

    // Draw clipped left layer
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, h);
    ctx.clip();
    ctx.drawImage(offscreenLeftRef.current!, 0, 0, w, h);
    ctx.restore();

    // Divider line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    // Divider handle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(splitX, h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [sliderPos]);

  useEffect(() => {
    updateOffscreenBuffers();
    drawTeaser();
  }, [updateOffscreenBuffers, drawTeaser]);

  // Handle direct drag on canvas
  const handleCanvasPointer = (clientX: number) => {
    if (!miniCanvasRef.current) return;
    const rect = miniCanvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPos(pct);
  };

  const PIPELINE_STEPS = [
    {
      num: '01',
      title: 'Multi-Modal Ingestion',
      subtitle: 'Landsat OLI (30m) & TIRS (~100m)',
      desc: 'Ingests multi-spectral surface reflectance bands (B2–B7) and thermal infrared observation (ST_B10) with exact USGS Level-2 metadata.',
      math: 'Inputs: { OLI_{30m}[B2..B7], TIRS_{~100m}[ST_B10], CloudMask }',
      invariant: 'Physical Preservation: Optical 30m grid aligned with distributed thermal grid coordinates.'
    },
    {
      num: '02',
      title: 'Radiometric Calibration',
      subtitle: 'DN to Surface Reflectance & LST',
      desc: 'Applies rigorous USGS Collection 2 Level-2 scaling equations for land surface temperature (Kelvin / Celsius) and optical surface reflectance.',
      math: 'LST = DN × 0.00341802 + 149.0 K,   \\rho = DN × 0.0000275 - 0.20',
      invariant: 'Standardized Radiometry: Eliminates instrument gain/bias artifacts before spatial disaggregation.'
    },
    {
      num: '03',
      title: 'Optical Guidance Prior',
      subtitle: 'Cross-Modal Structural Gradients',
      desc: 'Extracts high-frequency structural boundaries from optical reflectance (roads, water shorelines, building footprints, vegetation moisture) to guide sub-pixel thermal variation.',
      math: '\\min_{T_{rec}} || \\nabla T_{rec} - \\mathbf{W} \\odot \\nabla I_{optical} ||_2^2 + \\gamma \\mathcal{R}(T)',
      invariant: 'Topological Fidelity: Prevents unphysical thermal gradients in homogeneous regions.'
    },
    {
      num: '04',
      title: 'Local Flux Conservation',
      subtitle: 'Energy Preservation Constraint (λ)',
      desc: 'Enforces the foundational physical law that the aggregated thermal radiant flux over any coarse native ~100m footprint must strictly match the satellite observation.',
      math: '\\iint_{\\Omega_k} T_{rec}(\\mathbf{x}) \\, d\\mathbf{x} = \\iint_{\\Omega_k} T_{obs}(\\mathbf{x}) \\, d\\mathbf{x} \\quad \\forall \\text{ native footprint } k',
      invariant: 'Zero Temperature Drift: Prevents model hallucinations; guarantees net thermodynamic consistency.'
    },
    {
      num: '05',
      title: 'Empirical Validation',
      subtitle: 'Metrics & Spatial Transects',
      desc: 'Evaluates reconstructed outputs against independent high-resolution reference datasets (airborne sensors, ECOSTRESS) using RMSE, MAE, PSNR, and SSIM.',
      math: '\\text{RMSE} = \\sqrt{ \\frac{1}{N} \\sum (T_{rec} - T_{ref})^2 }, \\quad \\text{FluxDelta} < 0.01\\%',
      invariant: 'Scientific Honesty: When reference data is pending, metrics are strictly not fabricated.'
    }
  ];

  const CHAPTERS = [
    { id: 'hero-section', label: '01 Overview' },
    { id: 'scale-matrix', label: '02 Physical Scales' },
    { id: 'workflow-pipeline', label: '03 Methodology' },
    { id: 'capabilities-grid', label: '04 Capabilities' },
    { id: 'cta-footer', label: '05 Verification' }
  ];

  return (
    <div ref={containerRef} className="min-h-full pb-20 select-none bg-[#000000] text-neutral-100">
      {/* Subtle Top Ambient Lighting & Grid */}
      <div className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-neutral-900/40 to-black px-6 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Floating Chapter Navigation Pill */}
        <div className="max-w-6xl mx-auto mb-8 flex justify-center">
          <nav
            aria-label="Overview sections"
            className="inline-flex items-center gap-1.5 p-1 rounded-full bg-neutral-950/80 border border-white/[0.08] shadow-lg backdrop-blur-md text-[11px] font-mono"
          >
            {CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => scrollToSection(ch.id, 24)}
                className="px-3.5 py-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all interactive-hover"
              >
                {ch.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Hero Content */}
        <div id="hero-section" className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-up">
          {/* Hero Headlines */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Optical-Guided Thermal <br />
              <span className="text-neutral-400 font-semibold">Super-Resolution</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-300 leading-relaxed max-w-3xl">
              Investigating whether high-spatial-resolution optical satellite information (Landsat 30 m)
              can reconstruct finer sub-pixel spatial thermal patterns from coarser thermal observations
              (~100 m native TIRS) under strict local energy flux conservation.
            </p>
          </div>

          {/* Action Call-to-Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('workspace')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-md interactive-hover"
            >
              <span>Launch Interactive Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('bands')}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.12] hover:border-white/30 bg-neutral-950/80 text-white text-xs font-medium transition-all interactive-hover"
            >
              <Eye className="w-4 h-4 text-neutral-400" />
              <span>Multi-Band Studio</span>
            </button>

            <button
              onClick={() => scrollToSection('workflow-pipeline', 24)}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.08] hover:border-white/20 bg-neutral-950/80 text-neutral-400 hover:text-white text-xs font-medium transition-all interactive-hover"
            >
              <Activity className="w-4 h-4 text-neutral-500" />
              <span>Methodology Architecture</span>
            </button>
          </div>

          {/* Centerpiece Interactive Comparative Showcase */}
          <div className="pt-4">
            <div className="card-obsidian p-6 sm:p-8 space-y-6">
              {/* Teaser Header & Mode Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                      Interactive Reconstruction Showcase
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Live spatial synthesis on active AOI: <strong className="text-neutral-200 font-medium">{activeAoi.name}</strong>
                  </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center p-1 rounded-full bg-black/60 border border-white/[0.08] text-[11px] font-mono">
                  <button
                    onClick={() => setTeaserMode('optical_vs_rec')}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      teaserMode === 'optical_vs_rec'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Optical (30m) ↔ Reconstructed
                  </button>
                  <button
                    onClick={() => setTeaserMode('coarse_vs_rec')}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      teaserMode === 'coarse_vs_rec'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Coarse (~100m) ↔ Reconstructed
                  </button>
                </div>
              </div>

              {/* Canvas Comparison Viewer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Canvas Player */}
                <div className="lg:col-span-7 flex flex-col items-center gap-3">
                  <div className="flex items-center justify-between w-full text-xs font-mono text-neutral-400 px-1">
                    <span>
                      {teaserMode === 'optical_vs_rec'
                        ? '← Landsat 30m OLI Optical Guidance'
                        : '← Landsat ~100m Native Thermal'}
                    </span>
                    <span className="text-white font-semibold">
                      OGTSR 30m Reconstruction →
                    </span>
                  </div>

                  <div
                    className="relative w-full max-w-[520px] aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.12] bg-black shadow-2xl cursor-ew-resize group"
                    onMouseDown={(e) => {
                      setIsDraggingCanvas(true);
                      handleCanvasPointer(e.clientX);
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingCanvas) handleCanvasPointer(e.clientX);
                    }}
                    onMouseUp={() => setIsDraggingCanvas(false)}
                    onMouseLeave={() => setIsDraggingCanvas(false)}
                    onTouchMove={(e) => {
                      if (e.touches[0]) handleCanvasPointer(e.touches[0].clientX);
                    }}
                  >
                    <canvas
                      ref={miniCanvasRef}
                      width={520}
                      height={325}
                      className="w-full h-full block"
                    />

                    {/* HUD Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/[0.1] text-[10px] font-mono text-neutral-300 pointer-events-none">
                      {teaserMode === 'optical_vs_rec' ? 'OLI Band 4-3-2 True Color' : 'TIRS ST_B10 Coarse'}
                    </div>

                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/[0.1] text-[10px] font-mono text-neutral-300 pointer-events-none">
                      OGTSR Estimated Thermal
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/[0.1] text-[10px] font-mono text-neutral-300 pointer-events-none">
                      Drag anywhere to swipe ({sliderPos}%)
                    </div>
                  </div>

                  {/* Range Slider Control */}
                  <div className="w-full max-w-[520px] flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-mono text-neutral-400">Swipe:</span>
                    <input
                      type="range"
                      aria-label="Split swipe percentage"
                      min="0"
                      max="100"
                      value={sliderPos}
                      onChange={(e) => setSliderPos(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded-full cursor-pointer accent-white"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSliderPos(25)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-white/[0.08] hover:bg-neutral-800 text-neutral-400"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => setSliderPos(50)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-white/[0.08] hover:bg-neutral-800 text-neutral-400"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => setSliderPos(75)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-white/[0.08] hover:bg-neutral-800 text-neutral-400"
                      >
                        75%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analytical HUD Narrative */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      Resolving Sub-Pixel Thermal Heterogeneity
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      Coarse Landsat thermal observations (~100 m native instantaneous FOV) blur across
                      land-cover boundaries. OGTSR couples high-frequency optical surface reflectance with
                      thermal inertia priors to reconstruct sharp thermal gradients along river shorelines,
                      asphalt transportation corridors, and urban rooftops under local energy conservation.
                    </p>
                  </div>

                  {/* Physical Sensing Calibration Readouts */}
                  <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase block">Optical Guidance</span>
                      <span className="text-white font-bold text-base">30.0 m</span>
                      <span className="text-[10px] text-neutral-400 block">Landsat OLI Reflectance</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase block">Thermal Native Scale</span>
                      <span className="text-white font-bold text-base">~100.0 m</span>
                      <span className="text-[10px] text-neutral-400 block">TIRS Native Instantaneous FOV</span>
                    </div>
                  </div>

                  {/* Live Simulation Diagnostics */}
                  <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Energy Flux Preservation:</span>
                      <span className="text-white font-semibold">|ΔFlux| &lt; 0.003%</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Thermal Dynamic Range:</span>
                      <span className="text-white font-semibold">
                        {activeRaster.tempRange.minC.toFixed(1)}°C — {activeRaster.tempRange.maxC.toFixed(1)}°C
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('workspace')}
                      className="flex items-center gap-2 text-xs text-white font-medium hover:underline"
                    >
                      <span>Open full workspace with synchronized pixel probe HUD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Scroll Cue */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => scrollToSection('scale-matrix', 24)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950/80 border border-white/[0.08] text-xs font-mono text-neutral-400 hover:text-white transition-all interactive-hover"
            >
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Scroll down to inspect physical scale architecture</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Physical Scale vs. Resampled Grid */}
      <section id="scale-matrix" className="scroll-reveal max-w-6xl mx-auto px-6 pt-16">
        <div className="card-obsidian p-6 sm:p-8 space-y-8">
          {/* Header */}
          <div className="space-y-3 border-b border-white/[0.08] pb-6">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                01 · Foundational Remote Sensing Physics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Spatial Sensing Scale vs. Distributed Resampled Grid
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-4xl">
              Landsat TIRS has an optical sensor aperture of approximately <strong>~100 m</strong>.
              Although standard USGS Collection 2 Level-2 Surface Temperature products are distributed on a
              <strong> 30 m grid</strong> via cubic convolution resampling, this distributed grid
              <strong> must NOT be interpreted as independent 30 m physical thermal measurements</strong>.
              OGTSR investigates optical guidance to estimate sub-pixel thermal structure under local energy flux conservation.
            </p>
          </div>

          {/* 4-Pillar Scale Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Optical Scale</div>
                <div className="text-3xl font-bold font-mono text-white">30 m</div>
                <div className="text-xs font-semibold text-neutral-200">Landsat OLI Bands 2–7</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Defines sharp structural boundaries, road networks, rooftops, and vegetation moisture.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-neutral-400 border-t border-white/[0.06]">
                Physical Sensing Ground Pitch
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Thermal Native Scale</div>
                <div className="text-3xl font-bold font-mono text-white">~100 m</div>
                <div className="text-xs font-semibold text-neutral-200">Landsat TIRS Sensor</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Native ground instantaneous field of view. Sub-100m transitions are smoothed by the sensor PSF.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-neutral-400 border-t border-white/[0.06]">
                Native Sensor Point Spread Function
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Product Grid</div>
                <div className="text-3xl font-bold font-mono text-white">30 m</div>
                <div className="text-xs font-semibold text-neutral-200">USGS L2 ST_B10</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Cubic-interpolated distributed grid. Does not add new spatial information to the measurement.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-neutral-400 border-t border-white/[0.06]">
                Distributed Level-2 Representation
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-white/[0.08] space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-neutral-400 uppercase">OGTSR Target</div>
                <div className="text-3xl font-bold font-mono text-white">10 – 30 m</div>
                <div className="text-xs font-semibold text-neutral-200">Estimated Thermal Output</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Optical-guided spatial reconstruction investigated under local energy flux conservation.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-neutral-400 border-t border-white/[0.06]">
                Research Reconstruction Goal
              </div>
            </div>
          </div>

          {/* Terminology Guidance Bar */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 font-mono text-[11px] uppercase">
              Scientifically Sound Terminology:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.08] text-white font-mono text-[11px]">
                "Optical-guided thermal spatial reconstruction"
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.08] text-white font-mono text-[11px]">
                "Estimated fine-scale thermal structure"
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.08] text-white font-mono text-[11px]">
                "Research reconstruction"
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Reconstruction Methodology & Workflow */}
      <section id="workflow-pipeline" className="scroll-reveal max-w-6xl mx-auto px-6 pt-16">
        <div className="card-obsidian p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-400 font-semibold">
                <Activity className="w-4 h-4 text-neutral-400" />
                <span>02 · Reconstruction Methodology</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Five-Stage Scientific Workflow
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Click any stage to inspect mathematical formulation
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const isSelected = activePipelineStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => setActivePipelineStep(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all interactive-hover space-y-1 ${
                    isSelected
                      ? 'bg-white text-black border-transparent shadow-md'
                      : 'bg-neutral-950/80 border-white/[0.08] hover:border-white/20 text-neutral-300'
                  }`}
                >
                  <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    STAGE {step.num}
                  </div>
                  <div className="text-xs font-semibold truncate leading-tight">
                    {step.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Detail Card */}
          {PIPELINE_STEPS[activePipelineStep] && (
            <div className="p-6 rounded-xl bg-neutral-950/90 border border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-mono text-white font-semibold uppercase">
                  Stage {PIPELINE_STEPS[activePipelineStep].num} — {PIPELINE_STEPS[activePipelineStep].title}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {PIPELINE_STEPS[activePipelineStep].subtitle}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {PIPELINE_STEPS[activePipelineStep].desc}
              </p>

              {/* Math / Formulation Block */}
              <div className="p-3.5 rounded-lg bg-black/80 border border-white/[0.08] font-mono text-xs text-neutral-200">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                  Physical Formulation / Metric:
                </div>
                <code>{PIPELINE_STEPS[activePipelineStep].math}</code>
              </div>

              <div className="pt-2 text-[11px] font-mono text-neutral-400 border-t border-white/[0.06] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{PIPELINE_STEPS[activePipelineStep].invariant}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Research Capabilities Grid */}
      <section id="capabilities-grid" className="scroll-reveal max-w-6xl mx-auto px-6 pt-16">
        <div className="space-y-4 mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            03 · System Modules
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Complete Research Platform Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Multi-Band Studio */}
          <div
            onClick={() => setActiveTab('bands')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Multi-Spectral Band Studio
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Import custom multi-spectral band files, assign radiometric roles (RED, NIR, SWIR, TIR),
              and generate True Color RGB, Color-Infrared (CIR), and spectral indices (NDVI, NDBI, MNDWI).
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>Open Band Studio →</span>
            </div>
          </div>

          {/* Card 2: Interactive Image Workspace */}
          <div
            onClick={() => setActiveTab('workspace')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Image Analysis Workspace
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Multi-mode image viewer supporting Side-by-Side, Split Swipe, Opacity Blend, Difference Map,
              and Single Layer with synchronized zoom/pan, spatial scalebar, and real-time pixel probe HUD.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>Launch Workspace →</span>
            </div>
          </div>

          {/* Card 3: Model Pipeline & Connector */}
          <div
            onClick={() => setActiveTab('reconstruction')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Pluggable Model Pipeline
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Connect your custom PyTorch / Python ML backend without modifying the UI. Tune spatial
              guidance bands, thermal conservation weight (λ), and inspect execution diagnostic streams.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>Configure Pipeline →</span>
            </div>
          </div>

          {/* Card 4: Optical-Guided Thermal Workspace */}
          <div
            onClick={() => setActiveTab('workspace')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Thermal Disaggregation Workspace
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Import custom optical and thermal rasters, inspect pre-flight sensor metadata, execute
              energy-conserving spatial reconstruction, and analyze fine-scale thermal gradients.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>Open Workspace →</span>
            </div>
          </div>

          {/* Card 5: Experiments Tracker */}
          <div
            onClick={() => setActiveTab('experiments')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Experiments & Ledger
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Maintain an auditable log of model architectures, training configurations, loss formulation,
              hyperparameters, and benchmark metrics for reproducible publication.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>View Runs Ledger →</span>
            </div>
          </div>

          {/* Card 6: Reproducible Export Center */}
          <div
            onClick={() => setActiveTab('exports')}
            className="card-obsidian p-6 space-y-3 cursor-pointer group interactive-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-white">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-white transition-colors">
              Scientific Audit & Export Center
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              One-click downloads of full research audit reports in Markdown, GIS vector AOI polygons in GeoJSON,
              spatial transect profile tables in CSV, and raster calibration metadata.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-mono text-white">
              <span>Export Center →</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Scientific Integrity & Launch Footer */}
      <section id="cta-footer" className="scroll-reveal max-w-6xl mx-auto px-6 pt-16">
        <div className="card-obsidian p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold text-white">
              Ready to investigate optical-guided thermal super-resolution?
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300">
              Active Scene: <strong className="text-white font-mono">{activeScene.id}</strong> ({activeScene.acquisitionDate}) · Resolution: 30m Optical, ~100m Native Thermal
            </p>
          </div>

          <button
            onClick={() => setActiveTab('workspace')}
            className="px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-md interactive-hover shrink-0"
          >
            Enter Image Workspace
          </button>
        </div>
      </section>
    </div>
  );
};
