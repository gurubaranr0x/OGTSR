import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportService } from '../../services/exportService';
import { imageService } from '../../services/imageService';
import {
  Download,
  FileText,
  FileCode,
  Image,
  Table,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin
} from 'lucide-react';

export const ExportPanel: React.FC = () => {
  const {
    activeScene,
    activeAoi,
    activeRaster,
    reconstructionResult,
    validationAnalysis,
    transectY
  } = useApp();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadReport = () => {
    const md = exportService.generateScientificAuditReport(
      activeScene,
      activeAoi,
      reconstructionResult || undefined,
      validationAnalysis.globalMetrics
    );
    exportService.downloadFile(
      `OGTSR_AuditReport_${activeScene.id}_${activeAoi.id}.md`,
      md,
      'text/markdown'
    );
    triggerSuccess('Scientific Audit Report (Markdown)');
  };

  const handleDownloadGeoJson = () => {
    const geo = exportService.generateAoiGeoJson(activeScene, activeAoi);
    exportService.downloadFile(
      `OGTSR_AOI_${activeScene.id}_${activeAoi.id}.geojson`,
      geo,
      'application/geo+json'
    );
    triggerSuccess('AOI Geometry (GeoJSON)');
  };

  const handleDownloadTransectCsv = () => {
    const points = imageService.getTransect(activeRaster, transectY);
    const csv = exportService.generateTransectCsv(points);
    exportService.downloadFile(
      `OGTSR_Transect_Y${transectY}_${activeAoi.id}.csv`,
      csv,
      'text/csv'
    );
    triggerSuccess('Spatial Transect (CSV)');
  };

  const handleDownloadRasterMetadataJson = () => {
    const bundle = {
      project: 'OGTSR (Optical-Guided Thermal Super-Resolution)',
      sceneId: activeScene.id,
      aoiId: activeAoi.id,
      crs: activeScene.spatial.crs,
      opticalResolution: '30m',
      thermalNativeScale: '~100m',
      thermalProductGrid: '30m',
      dimensions: { width: activeRaster.width, height: activeRaster.height },
      tempRange: activeRaster.tempRange,
      radiometricCoefficients: {
        thermalMult: 0.00341802,
        thermalAdd: 149.0,
        opticalMult: 0.0000275,
        opticalAdd: -0.2
      },
      exportTimestamp: new Date().toISOString()
    };
    exportService.downloadFile(
      `OGTSR_Raster_Metadata_${activeAoi.id}.json`,
      JSON.stringify(bundle, null, 2),
      'application/json'
    );
    triggerSuccess('Raster Bundle Metadata (JSON)');
  };

  const triggerSuccess = (item: string) => {
    setDownloadSuccess(item);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
          <Download className="w-4 h-4" />
          <span>Scientific Data & Audit Export</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Export Reconstruction Products & Reports
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Export reproducible research artifacts, spatial GeoJSON boundaries, transect curves, and formal audit reports.
        </p>
      </div>

      {/* Success Banner */}
      {downloadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Successfully downloaded: {downloadSuccess}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scientific Audit Report (Markdown) */}
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 font-semibold">
              <FileText className="w-4 h-4" />
              <span>Full Scientific Audit Report</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Comprehensive Research Run Document
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Complete Markdown document compiling sensor parameters (Landsat 8/9 C2 L2), calibration factors,
              spatial scale disambiguation, model hyperparameters, flux conservation lambda, and quantitative validation metrics.
            </p>
          </div>

          <button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--text-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-primary)] text-xs font-semibold transition-all interactive-hover shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Audit Report (.md)</span>
          </button>
        </div>

        {/* AOI GeoJSON */}
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-purple-400 font-semibold">
              <MapPin className="w-4 h-4" />
              <span>Spatial AOI Boundary</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              GIS Vector Boundary (GeoJSON)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Exports the active bounding box extent in native CRS coordinates ({activeScene.spatial.crs})
              compatible with QGIS, ArcGIS, GDAL, and Google Earth Engine.
            </p>
          </div>

          <button
            onClick={handleDownloadGeoJson}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium transition-all interactive-hover"
          >
            <Download className="w-4 h-4" />
            <span>Download AOI (.geojson)</span>
          </button>
        </div>

        {/* Spatial Transect CSV */}
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-semibold">
              <Table className="w-4 h-4" />
              <span>Spatial Profile Transect</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Cross-Section Data Table (CSV)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Exports physical distance, coarse observation temperature, OGTSR reconstructed temperature,
              reference temperature (when available), and NDVI along transect row Y = {transectY}.
            </p>
          </div>

          <button
            onClick={handleDownloadTransectCsv}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium transition-all interactive-hover"
          >
            <Download className="w-4 h-4" />
            <span>Download Transect Data (.csv)</span>
          </button>
        </div>

        {/* Raster Bundle Metadata */}
        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-semibold">
              <FileCode className="w-4 h-4" />
              <span>Raster Calibration Package</span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Metadata & Scaling Coefficients (JSON)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Machine-readable metadata containing exact USGS DN scale factors, add offsets, bounding boxes,
              dimensions, and spatial resolution metadata for programmatic ingestion.
            </p>
          </div>

          <button
            onClick={handleDownloadRasterMetadataJson}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium transition-all interactive-hover"
          >
            <Download className="w-4 h-4" />
            <span>Download Metadata (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
