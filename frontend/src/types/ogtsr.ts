// OGTSR Core Types - Optical-Guided Thermal Super-Resolution

export type ResolutionUnit = 'm' | 'km';

export interface SpatialMetadata {
  opticalResolution: number; // 30m
  thermalNativeScale: number; // ~100m
  thermalProductGrid: number; // 30m
  targetOutputScale: number; // e.g. 10m or 30m refined
  crs: string; // e.g. "EPSG:32644"
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    minLat?: number;
    minLon?: number;
    maxLat?: number;
    maxLon?: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
}

export interface LandsatBand {
  id: string;
  name: string;
  commonName: string;
  wavelength: string; // e.g. "0.64 - 0.67 µm"
  resolution: number; // in meters
  type: 'optical' | 'thermal' | 'quality' | 'index';
  description: string;
  scaleFactor: number;
  addOffset: number;
  unit: string;
}

export interface LandsatScene {
  id: string;
  satellite: 'Landsat 8' | 'Landsat 9';
  sensor: 'OLI/TIRS';
  productLevel: 'Collection 2 Level-2';
  path: number;
  row: number;
  acquisitionDate: string;
  acquisitionTime: string;
  cloudCover: number; // percentage
  sunElevation: number; // degrees
  sunAzimuth: number; // degrees
  spatial: SpatialMetadata;
  thumbnailUrl?: string;
  sampleAois: AOI[];
  isDemo?: boolean;
}

export interface AOI {
  id: string;
  name: string;
  category: 'Urban / Impervious' | 'Agricultural / Soil' | 'Water / Coastal' | 'Forest / Mixed';
  description: string;
  bounds: {
    x: number; // pixel coordinate
    y: number;
    width: number;
    height: number;
    geoMinX?: number;
    geoMinY?: number;
    geoMaxX?: number;
    geoMaxY?: number;
  };
}

export type ThermalColormap = 
  | 'inferno' 
  | 'magma' 
  | 'viridis' 
  | 'plasma' 
  | 'turbo' 
  | 'grayscale';

export type ViewMode = 
  | 'side_by_side' 
  | 'split_swipe' 
  | 'opacity_blend' 
  | 'difference_map' 
  | 'single_layer';

export type LayerId = 
  | 'optical_rgb' 
  | 'optical_nir' 
  | 'optical_ndvi' 
  | 'thermal_coarse' 
  | 'reconstruction_estimated' 
  | 'reference_thermal' 
  | 'difference_residual';

export interface LayerConfig {
  id: LayerId;
  label: string;
  category: 'optical' | 'thermal' | 'model' | 'validation';
  visible: boolean;
  opacity: number; // 0 to 1
  colormap?: ThermalColormap;
  tempRange?: {
    minKelvin: number;
    maxKelvin: number;
    displayUnit: 'celsius' | 'kelvin';
  };
}

export interface PixelInspection {
  x: number;
  y: number;
  geoX: number;
  geoY: number;
  opticalRgb?: [number, number, number];
  opticalNir?: number;
  opticalNdvi?: number;
  thermalRawDn?: number;
  thermalCoarseKelvin?: number;
  thermalCoarseCelsius?: number;
  reconstructedKelvin?: number;
  reconstructedCelsius?: number;
  referenceKelvin?: number;
  referenceCelsius?: number;
  residualKelvin?: number;
}

export type ModelStageStatus = 'READY' | 'RUNNING' | 'NOT_AVAILABLE' | 'EXPERIMENTAL';

export interface ModelPipelineStage {
  id: string;
  name: string;
  description: string;
  status: ModelStageStatus;
  details?: string;
}

export interface ReconstructionConfig {
  modelName: string;
  modelVersion: string;
  guidanceBands: string[]; // e.g. ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5']
  opticalScale: number; // 30m
  thermalNativeScale: number; // 100m
  targetGrid: number; // 30m or 10m
  thermalConservationWeight: number; // lambda for flux preservation
  edgeGuidanceWeight: number;
  backendEndpoint?: string;
  useBackend: boolean;
}

export interface ReconstructionResult {
  id: string;
  sceneId: string;
  aoiId: string;
  timestamp: string;
  config: ReconstructionConfig;
  status: 'COMPLETED' | 'EXPERIMENTAL_SIMULATION' | 'FAILED';
  meanTempC: number;
  minTempC: number;
  maxTempC: number;
  stdTempC: number;
  executionTimeMs: number;
  isModelSimulated: boolean;
  scientificDisclaimer: string;
}

export interface ValidationMetrics {
  hasReferenceData: boolean;
  rmseKelvin?: number;
  maeKelvin?: number;
  psnrDb?: number;
  ssim?: number;
  pearsonR?: number;
  spatialEnergyConservationDeltaK?: number;
  sampleCount?: number;
  disclaimer: string;
}

export interface TransectPoint {
  distanceMeters: number;
  coarseThermalC: number;
  reconstructedC: number;
  referenceC?: number;
  opticalNdvi: number;
  landCoverClass: string;
}

export interface ExperimentRun {
  id: string;
  name: string;
  timestamp: string;
  modelVersion: string;
  datasetId: string;
  aoiName: string;
  architecture: string;
  guidanceFeatures: string;
  hyperparameters: Record<string, string | number>;
  metrics: ValidationMetrics;
  notes: string;
  tags: string[];
}

export type BandRole = 
  | 'RED' 
  | 'GREEN' 
  | 'BLUE' 
  | 'NIR' 
  | 'SWIR1' 
  | 'SWIR2' 
  | 'TIR1' 
  | 'TIR2' 
  | 'EMIS' 
  | 'QA' 
  | 'CUSTOM';

export interface ImportedBand {
  id: string;
  name: string;
  fileName: string;
  role: BandRole;
  resolution: number; // in meters (e.g. 10, 20, 30, 100)
  wavelength?: string;
  gain: number;
  offset: number;
  unit: string;
  data: Float32Array; // 256x256 normalized or calibrated values
  stats: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
}

export type BandCompositeMode = 
  | 'TRUE_COLOR_RGB' 
  | 'FALSE_COLOR_NIR' 
  | 'SWIR_URBAN' 
  | 'THERMAL_SINGLE' 
  | 'INDEX_NDVI' 
  | 'INDEX_NDBI' 
  | 'INDEX_MNDWI';

