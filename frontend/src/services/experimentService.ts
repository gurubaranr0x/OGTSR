import { ExperimentRun } from '../types/ogtsr';

export const INITIAL_EXPERIMENTS: ExperimentRun[] = [
  {
    id: 'EXP-2026-003',
    name: 'Residual Cross-Attention with Flux Constraint (Run 3)',
    timestamp: '2026-09-28 14:15 UTC',
    modelVersion: 'v0.2.0-research',
    datasetId: 'LC09_L2SP_012042_20260919_02_T1',
    aoiName: 'Metropolitan Core & River Waterfront',
    architecture: 'ResGuided-UNet + Spatial Cross-Attention',
    guidanceFeatures: 'SR_B2, SR_B3, SR_B4, SR_B5, NDVI',
    hyperparameters: {
      lr: '0.0001',
      batchSize: 16,
      epochs: 80,
      lambdaFlux: 0.95,
      edgeLossWeight: 0.25,
      optimizer: 'AdamW (decay 1e-4)'
    },
    metrics: {
      hasReferenceData: true,
      rmseKelvin: 1.42,
      maeKelvin: 1.08,
      psnrDb: 32.14,
      ssim: 0.892,
      pearsonR: 0.941,
      spatialEnergyConservationDeltaK: 0.04,
      sampleCount: 65536,
      disclaimer: 'Validation evaluated against simulated airborne reference under strict energy conservation.'
    },
    notes: 'Incorporating high-frequency NDVI residual reduces edge blurring along riverfront boundary. Local flux conservation prevents artificial warming of vegetation.',
    tags: ['Cross-Attention', 'Flux-Preserving', 'Urban Heat Island']
  },
  {
    id: 'EXP-2026-002',
    name: 'Bicubic + Guided Bilateral Filter Baseline (Run 2)',
    timestamp: '2026-09-22 11:30 UTC',
    modelVersion: 'v0.1.2-baseline',
    datasetId: 'LC09_L2SP_143052_20260301_02_T1',
    aoiName: 'Irrigated Cropland & Dry Fallow Fields',
    architecture: 'Classical Guided Filter (He et al. modified)',
    guidanceFeatures: 'SR_B4 (Red), SR_B5 (NIR)',
    hyperparameters: {
      radius: 4,
      eps: 0.04,
      lambdaFlux: 0.85
    },
    metrics: {
      hasReferenceData: true,
      rmseKelvin: 2.18,
      maeKelvin: 1.67,
      psnrDb: 28.45,
      ssim: 0.812,
      pearsonR: 0.887,
      spatialEnergyConservationDeltaK: 0.12,
      sampleCount: 65536,
      disclaimer: 'Classical guided filtering baseline evaluated against reference.'
    },
    notes: 'Susceptible to halo artifacts around sharp agricultural parcel boundaries where optical gradient is misaligned with thermal inertia.',
    tags: ['Classical Baseline', 'Bilateral Filter', 'Agriculture']
  },
  {
    id: 'EXP-2026-001',
    name: 'Standard Bicubic Resampling (Zero-Guidance Control)',
    timestamp: '2026-09-20 09:00 UTC',
    modelVersion: 'v0.0.1-null',
    datasetId: 'LC09_L2SP_012042_20260919_02_T1',
    aoiName: 'Metropolitan Core & River Waterfront',
    architecture: 'Standard Interpolation (Null Model)',
    guidanceFeatures: 'None (Coarse thermal only)',
    hyperparameters: {
      interpolation: 'Bicubic Spline'
    },
    metrics: {
      hasReferenceData: true,
      rmseKelvin: 3.45,
      maeKelvin: 2.68,
      psnrDb: 24.12,
      ssim: 0.704,
      pearsonR: 0.781,
      spatialEnergyConservationDeltaK: 0.01,
      sampleCount: 65536,
      disclaimer: 'Null baseline with no optical guidance.'
    },
    notes: 'Smooth blurred boundaries. Fails to resolve any sub-100m street canyons or rooftop thermal heterogeneity.',
    tags: ['Null Baseline', 'Bicubic', 'Control']
  }
];

class ExperimentService {
  private experiments: ExperimentRun[] = [...INITIAL_EXPERIMENTS];

  public getExperiments(): ExperimentRun[] {
    return this.experiments;
  }

  public addExperiment(exp: ExperimentRun): void {
    this.experiments.unshift(exp);
  }

  public exportExperimentsJson(): string {
    return JSON.stringify(this.experiments, null, 2);
  }
}

export const experimentService = new ExperimentService();
