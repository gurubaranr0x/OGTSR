import { PatchRasterData } from './imageService';
import { ValidationMetrics } from '../types/ogtsr';

export interface ClassValidationStat {
  className: string;
  count: number;
  meanDiffC: number;
  rmseC: number;
  maeC: number;
}

export interface RegionValidationAnalysis {
  globalMetrics: ValidationMetrics;
  classStats: ClassValidationStat[];
  histogramDiff: {
    bins: number[]; // center differences e.g. -4 to +4
    counts: number[];
  };
}

class ValidationService {
  /**
   * Computes rigorous scientific validation metrics between reconstructed output and reference.
   * If reference data is not present, returns a strictly honest disclaimer state.
   */
  public analyzeReconstruction(
    raster: PatchRasterData,
    hasReference: boolean
  ): RegionValidationAnalysis {
    if (!hasReference || !raster.referenceC) {
      // Calculate coarse consistency (energy conservation) only, NOT true ground truth validation!
      let sumCoarseDiff = 0;
      let sumCoarseDiffSq = 0;
      const totalPixels = raster.width * raster.height;

      for (let i = 0; i < totalPixels; i++) {
        const d = raster.reconstructedC[i] - raster.thermalCoarseC[i];
        sumCoarseDiff += d;
        sumCoarseDiffSq += d * d;
      }

      const meanFluxDelta = sumCoarseDiff / totalPixels;

      return {
        globalMetrics: {
          hasReferenceData: false,
          spatialEnergyConservationDeltaK: Math.abs(meanFluxDelta),
          sampleCount: totalPixels,
          disclaimer:
            'Reference thermal data required for quantitative ground-truth validation (RMSE, MAE, PSNR, SSIM). Coarse spatial flux conservation is displayed.'
        },
        classStats: [],
        histogramDiff: {
          bins: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
          counts: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      };
    }

    // Reference data is available: compute actual physical metrics
    const totalPixels = raster.width * raster.height;
    let sumDiff = 0;
    let sumDiffSq = 0;
    let sumAbsDiff = 0;
    let minRef = Infinity, maxRef = -Infinity;
    let sumRef = 0, sumEst = 0;

    const classNames = ['Water Channel', 'Dense Urban', 'Road Network', 'Vegetation Park', 'Bare Soil'];
    const classDiffs: number[][] = [[], [], [], [], []];

    // Compute error bins: -4°C to +4°C in 0.5°C steps
    const binCount = 17;
    const binMin = -4.0;
    const binStep = 0.5;
    const binCenters: number[] = [];
    const binCounts: number[] = new Array(binCount).fill(0);
    for (let b = 0; b < binCount; b++) {
      binCenters.push(binMin + b * binStep);
    }

    for (let i = 0; i < totalPixels; i++) {
      const ref = raster.referenceC[i];
      const est = raster.reconstructedC[i];
      const diff = est - ref;

      sumDiff += diff;
      sumDiffSq += diff * diff;
      sumAbsDiff += Math.abs(diff);

      sumRef += ref;
      sumEst += est;
      if (ref < minRef) minRef = ref;
      if (ref > maxRef) maxRef = ref;

      const cIdx = raster.landCoverMap[i];
      if (cIdx >= 0 && cIdx < 5) {
        classDiffs[cIdx].push(diff);
      }

      // Binning
      const bIdx = Math.round((diff - binMin) / binStep);
      if (bIdx >= 0 && bIdx < binCount) {
        binCounts[bIdx]++;
      }
    }

    const meanDiff = sumDiff / totalPixels;
    const mse = sumDiffSq / totalPixels;
    const rmse = Math.sqrt(mse);
    const mae = sumAbsDiff / totalPixels;

    // PSNR calculation based on dynamic range of temperature
    const dynamicRange = Math.max(10, maxRef - minRef);
    const psnr = 20 * Math.log10(dynamicRange / Math.max(0.0001, rmse));

    // SSIM approximation
    const meanRef = sumRef / totalPixels;
    const meanEst = sumEst / totalPixels;
    let varRef = 0, varEst = 0, covar = 0;
    for (let i = 0; i < totalPixels; i++) {
      const dRef = raster.referenceC[i] - meanRef;
      const dEst = raster.reconstructedC[i] - meanEst;
      varRef += dRef * dRef;
      varEst += dEst * dEst;
      covar += dRef * dEst;
    }
    varRef /= totalPixels;
    varEst /= totalPixels;
    covar /= totalPixels;

    const c1 = 0.01 * 0.01 * dynamicRange * dynamicRange;
    const c2 = 0.03 * 0.03 * dynamicRange * dynamicRange;
    const ssim = ((2 * meanRef * meanEst + c1) * (2 * covar + c2)) /
      ((meanRef * meanRef + meanEst * meanEst + c1) * (varRef + varEst + c2));

    // Pearson r correlation
    const denom = Math.sqrt(varRef * varEst);
    const pearsonR = denom > 0 ? covar / denom : 0;

    // Per-class breakdown
    const classStats: ClassValidationStat[] = classNames.map((name, idx) => {
      const arr = classDiffs[idx];
      const count = arr.length;
      if (count === 0) {
        return { className: name, count: 0, meanDiffC: 0, rmseC: 0, maeC: 0 };
      }
      let cSum = 0, cSq = 0, cAbs = 0;
      for (let j = 0; j < count; j++) {
        cSum += arr[j];
        cSq += arr[j] * arr[j];
        cAbs += Math.abs(arr[j]);
      }
      return {
        className: name,
        count,
        meanDiffC: cSum / count,
        rmseC: Math.sqrt(cSq / count),
        maeC: cAbs / count
      };
    });

    return {
      globalMetrics: {
        hasReferenceData: true,
        rmseKelvin: rmse,
        maeKelvin: mae,
        psnrDb: psnr,
        ssim: Math.max(0, Math.min(1, ssim)),
        pearsonR: Math.max(-1, Math.min(1, pearsonR)),
        spatialEnergyConservationDeltaK: Math.abs(meanDiff),
        sampleCount: totalPixels,
        disclaimer:
          'Validation evaluated against high-resolution reference dataset. Results reflect spatial reconstruction fidelity under local flux conservation.'
      },
      classStats,
      histogramDiff: {
        bins: binCenters,
        counts: binCounts
      }
    };
  }
}

export const validationService = new ValidationService();
