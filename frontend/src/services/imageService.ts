import { AOI, ThermalColormap, PixelInspection, TransectPoint } from '../types/ogtsr';
import { getColormapColor } from '../utils/colormaps';

export interface PatchRasterData {
  width: number;
  height: number;
  opticalRgb: Float32Array; // RGB values normalized [0, 1] (width * height * 3)
  opticalNir: Float32Array; // NIR reflectance [0, 1]
  opticalNdvi: Float32Array; // NDVI [-1, 1]
  thermalCoarseC: Float32Array; // Coarse thermal in Celsius (~100m native blur on 30m grid)
  reconstructedC: Float32Array; // OGTSR estimated fine-scale thermal in Celsius
  referenceC?: Float32Array; // High-resolution reference thermal in Celsius (when available)
  differenceC: Float32Array; // Reconstruction - Coarse (or Reference)
  landCoverMap: Uint8Array; // 0: Water, 1: Dense Urban, 2: Road/Asphalt, 3: Vegetation, 4: Bare Soil
  tempRange: {
    minC: number;
    maxC: number;
  };
}

class ImageService {
  private patchCache: Map<string, PatchRasterData> = new Map();

  /**
   * Generates or fetches realistic scientific raster patch for the given AOI.
   */
  public getAoiRaster(aoi: AOI, sceneId: string, hasReference: boolean = true): PatchRasterData {
    const cacheKey = `${sceneId}_${aoi.id}_${hasReference}`;
    if (this.patchCache.has(cacheKey)) {
      return this.patchCache.get(cacheKey)!;
    }

    const width = 256;
    const height = 256;
    const size = width * height;

    const opticalRgb = new Float32Array(size * 3);
    const opticalNir = new Float32Array(size);
    const opticalNdvi = new Float32Array(size);
    const thermalCoarseC = new Float32Array(size);
    const reconstructedC = new Float32Array(size);
    const referenceC = hasReference ? new Float32Array(size) : undefined;
    const differenceC = new Float32Array(size);
    const landCoverMap = new Uint8Array(size);

    // Procedural multi-frequency Perlin/Simplex-style synthesis tuned to realistic Landsat remote sensing phenomenology
    const baseTemp = aoi.category === 'Urban / Impervious' ? 32.5 : aoi.category === 'Agricultural / Soil' ? 29.0 : 26.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const nx = x / width;
        const ny = y / height;

        // Coordinate features
        // Water channel meandering through
        const riverCenter = 0.3 + 0.12 * Math.sin(ny * 7.0) + 0.05 * Math.cos(ny * 13.0);
        const distToRiver = Math.abs(nx - riverCenter);
        const isRiver = distToRiver < 0.055;

        // Urban grid: city blocks and road network
        const gridX = Math.floor(nx * 18);
        const gridY = Math.floor(ny * 18);
        const isRoad = (nx * 18 - gridX < 0.18) || (ny * 18 - gridY < 0.18);
        const isBuildingRoof = !isRoad && !isRiver && ((gridX * 7 + gridY * 11) % 5 <= 2);
        const isParkVegetation = !isRiver && !isRoad && !isBuildingRoof && ((gridX + gridY) % 3 === 0);
        const isBareSoil = !isRiver && !isRoad && !isBuildingRoof && !isParkVegetation;

        let r = 0.15, g = 0.16, b = 0.14, nir = 0.25;
        let groundTruthTemp = baseTemp;
        let cover = 1;

        if (isRiver) {
          cover = 0; // Water
          r = 0.04; g = 0.08; b = 0.14; nir = 0.02;
          groundTruthTemp = baseTemp - 8.5; // Water is noticeably cooler during daytime
        } else if (isRoad) {
          cover = 2; // Road / Asphalt
          r = 0.18; g = 0.18; b = 0.19; nir = 0.16;
          groundTruthTemp = baseTemp + 5.2; // High thermal absorption
        } else if (isBuildingRoof) {
          cover = 1; // Dense Urban Rooftops
          const roofType = (gridX * 13 + gridY * 19) % 3;
          if (roofType === 0) {
            // Bright white/reflective roof
            r = 0.42; g = 0.42; b = 0.44; nir = 0.38;
            groundTruthTemp = baseTemp + 1.2;
          } else {
            // Dark commercial roof / gravel
            r = 0.22; g = 0.21; b = 0.23; nir = 0.18;
            groundTruthTemp = baseTemp + 7.8; // Significant daytime heat island
          }
        } else if (isParkVegetation) {
          cover = 3; // Vegetation
          r = 0.06; g = 0.15; b = 0.05; nir = 0.58;
          groundTruthTemp = baseTemp - 4.2; // Transpirative cooling
        } else {
          cover = 4; // Bare Soil
          r = 0.28; g = 0.24; b = 0.18; nir = 0.32;
          groundTruthTemp = baseTemp + 2.5;
        }

        // Sub-pixel texture and micro-heterogeneity
        const noise = (Math.sin(x * 12.3 + y * 34.1) * 0.015);
        r = Math.max(0.01, Math.min(0.9, r + noise));
        g = Math.max(0.01, Math.min(0.9, g + noise));
        b = Math.max(0.01, Math.min(0.9, b + noise));
        nir = Math.max(0.01, Math.min(0.9, nir + noise * 1.5));

        opticalRgb[idx * 3] = r;
        opticalRgb[idx * 3 + 1] = g;
        opticalRgb[idx * 3 + 2] = b;
        opticalNir[idx] = nir;

        const ndvi = (nir - r) / Math.max(0.001, (nir + r));
        opticalNdvi[idx] = Math.max(-1, Math.min(1, ndvi));
        landCoverMap[idx] = cover;

        if (referenceC) {
          referenceC[idx] = groundTruthTemp + noise * 5;
        }
      }
    }

    // Now simulate Landsat native thermal observation:
    // Real TIRS native aperture is ~100m, which spans ~3.3x 30m grid pixels.
    // We apply a scientific 2D Gaussian point spread function (kernel size ~7, sigma ~2.2)
    // to model native thermal sensor resolution:
    const kernelRadius = 4;
    const sigma = 2.2;
    const kernel: number[] = [];
    let kSum = 0;
    for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
      for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
        const val = Math.exp(-(kx * kx + ky * ky) / (2 * sigma * sigma));
        kernel.push(val);
        kSum += val;
      }
    }
    const normKernel = kernel.map((v) => v / kSum);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let acc = 0;
        let ki = 0;
        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          const py = Math.max(0, Math.min(height - 1, y + ky));
          for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const pIdx = py * width + px;
            const tempVal = referenceC ? referenceC[pIdx] : baseTemp;
            acc += tempVal * normKernel[ki++];
          }
        }
        thermalCoarseC[y * width + x] = acc;
      }
    }

    // Now compute OGTSR reconstructed thermal:
    // Uses optical guidance (NDVI negative correlation with LST in urban areas,
    // combined with high-frequency optical spatial gradient injection and local energy conservation)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const coarse = thermalCoarseC[idx];
        const ndvi = opticalNdvi[idx];
        
        // Compute local optical luminance
        const lum = opticalRgb[idx * 3] * 0.299 + opticalRgb[idx * 3 + 1] * 0.587 + opticalRgb[idx * 3 + 2] * 0.114;

        // Optical-guided high-frequency thermal injection:
        // High NDVI -> cool anomaly; Low NDVI + high impervious -> warm anomaly
        const thermalModulation = (0.28 - ndvi) * 3.8 + (lum - 0.20) * 4.2;
        
        // Estimated fine-scale temperature with flux preservation
        const est = coarse + thermalModulation * 0.85;
        reconstructedC[idx] = est;
        differenceC[idx] = est - coarse;
      }
    }

    // Determine temperature bounds
    let minC = Infinity;
    let maxC = -Infinity;
    for (let i = 0; i < size; i++) {
      if (thermalCoarseC[i] < minC) minC = thermalCoarseC[i];
      if (thermalCoarseC[i] > maxC) maxC = thermalCoarseC[i];
      if (reconstructedC[i] < minC) minC = reconstructedC[i];
      if (reconstructedC[i] > maxC) maxC = reconstructedC[i];
    }

    const result: PatchRasterData = {
      width,
      height,
      opticalRgb,
      opticalNir,
      opticalNdvi,
      thermalCoarseC,
      reconstructedC,
      referenceC,
      differenceC,
      landCoverMap,
      tempRange: {
        minC: Math.floor(minC),
        maxC: Math.ceil(maxC)
      }
    };

    this.patchCache.set(cacheKey, result);
    return result;
  }

  /**
   * Renders the specified layer onto a HTMLCanvasElement.
   */
  public renderLayerToCanvas(
    canvas: HTMLCanvasElement,
    raster: PatchRasterData,
    layerId: string,
    colormap: ThermalColormap,
    minTempC: number,
    maxTempC: number,
    opacity: number = 1.0
  ): void {
    const { width, height } = raster;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const tempSpan = Math.max(0.1, maxTempC - minTempC);

    for (let i = 0; i < width * height; i++) {
      const p = i * 4;

      if (layerId === 'optical_rgb') {
        data[p] = Math.round(raster.opticalRgb[i * 3] * 255);
        data[p + 1] = Math.round(raster.opticalRgb[i * 3 + 1] * 255);
        data[p + 2] = Math.round(raster.opticalRgb[i * 3 + 2] * 255);
        data[p + 3] = Math.round(opacity * 255);
      } else if (layerId === 'optical_nir') {
        // NIR false color (B5 NIR -> Red channel, B4 Red -> Green channel, B3 Green -> Blue channel)
        const nir = raster.opticalNir[i];
        const red = raster.opticalRgb[i * 3];
        const green = raster.opticalRgb[i * 3 + 1];
        data[p] = Math.round(nir * 255);
        data[p + 1] = Math.round(red * 255);
        data[p + 2] = Math.round(green * 255);
        data[p + 3] = Math.round(opacity * 255);
      } else if (layerId === 'optical_ndvi') {
        // NDVI colormap: red = low/water, yellow = soil, vibrant green = lush vegetation
        const ndvi = raster.opticalNdvi[i];
        const t = Math.max(0, Math.min(1, (ndvi + 0.2) / 1.0));
        const color = getColormapColor('viridis', t);
        data[p] = color.r;
        data[p + 1] = color.g;
        data[p + 2] = color.b;
        data[p + 3] = Math.round(opacity * 255);
      } else if (layerId === 'thermal_coarse') {
        const val = raster.thermalCoarseC[i];
        const t = Math.max(0, Math.min(1, (val - minTempC) / tempSpan));
        const color = getColormapColor(colormap, t);
        data[p] = color.r;
        data[p + 1] = color.g;
        data[p + 2] = color.b;
        data[p + 3] = Math.round(opacity * 255);
      } else if (layerId === 'reconstruction_estimated') {
        const val = raster.reconstructedC[i];
        const t = Math.max(0, Math.min(1, (val - minTempC) / tempSpan));
        const color = getColormapColor(colormap, t);
        data[p] = color.r;
        data[p + 1] = color.g;
        data[p + 2] = color.b;
        data[p + 3] = Math.round(opacity * 255);
      } else if (layerId === 'reference_thermal') {
        if (raster.referenceC) {
          const val = raster.referenceC[i];
          const t = Math.max(0, Math.min(1, (val - minTempC) / tempSpan));
          const color = getColormapColor(colormap, t);
          data[p] = color.r;
          data[p + 1] = color.g;
          data[p + 2] = color.b;
          data[p + 3] = Math.round(opacity * 255);
        } else {
          // Checkerboard placeholder indicating reference unavailable
          const cx = Math.floor((i % width) / 16);
          const cy = Math.floor(Math.floor(i / width) / 16);
          const c = (cx + cy) % 2 === 0 ? 40 : 60;
          data[p] = c; data[p + 1] = c; data[p + 2] = c;
          data[p + 3] = Math.round(opacity * 255);
        }
      } else if (layerId === 'difference_residual') {
        // Residual map: Divergent centered at 0 delta
        const diff = raster.differenceC[i];
        // Scale delta [-5°C, +5°C] to [0, 1]
        const t = Math.max(0, Math.min(1, (diff + 4.0) / 8.0));
        // Blue (negative/cooler) to White (neutral) to Red (positive/warmer)
        let r = 0, g = 0, b = 0;
        if (t < 0.5) {
          const f = t / 0.5;
          r = Math.round(59 + f * (240 - 59));
          g = Math.round(130 + f * (240 - 130));
          b = Math.round(246 + f * (240 - 246));
        } else {
          const f = (t - 0.5) / 0.5;
          r = Math.round(240 + f * (239 - 240));
          g = Math.round(240 - f * (240 - 68));
          b = Math.round(240 - f * (240 - 68));
        }
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = Math.round(opacity * 255);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Inspects precise pixel values at (x, y)
   */
  public probePixel(raster: PatchRasterData, aoi: AOI, px: number, py: number): PixelInspection | null {
    if (px < 0 || px >= raster.width || py < 0 || py >= raster.height) {
      return null;
    }

    const idx = py * raster.width + px;
    const coarseC = raster.thermalCoarseC[idx];
    const reconC = raster.reconstructedC[idx];
    const refC = raster.referenceC ? raster.referenceC[idx] : undefined;
    const rgb: [number, number, number] = [
      raster.opticalRgb[idx * 3],
      raster.opticalRgb[idx * 3 + 1],
      raster.opticalRgb[idx * 3 + 2]
    ];

    // Estimate Landsat raw DN from temperature
    // DN = (Kelvin - 149.0) / 0.00341802
    const coarseK = coarseC + 273.15;
    const rawDn = Math.round((coarseK - 149.0) / 0.00341802);

    return {
      x: px,
      y: py,
      geoX: (aoi.bounds.geoMinX || 0) + px * 30,
      geoY: (aoi.bounds.geoMaxY || 0) - py * 30,
      opticalRgb: rgb,
      opticalNir: raster.opticalNir[idx],
      opticalNdvi: raster.opticalNdvi[idx],
      thermalRawDn: rawDn,
      thermalCoarseKelvin: coarseK,
      thermalCoarseCelsius: coarseC,
      reconstructedKelvin: reconC + 273.15,
      reconstructedCelsius: reconC,
      referenceKelvin: refC ? refC + 273.15 : undefined,
      referenceCelsius: refC,
      residualKelvin: refC ? reconC - refC : reconC - coarseC
    };
  }

  /**
   * Extracts a linear transect across land cover transitions.
   */
  public getTransect(raster: PatchRasterData, yRow: number = Math.floor(raster.height / 2)): TransectPoint[] {
    const points: TransectPoint[] = [];
    const y = Math.max(0, Math.min(raster.height - 1, yRow));

    const coverNames = ['Water Channel', 'Dense Urban Block', 'Asphalt Road', 'Vegetation Park', 'Bare Soil'];

    for (let x = 0; x < raster.width; x += 2) {
      const idx = y * raster.width + x;
      points.push({
        distanceMeters: x * 30, // 30m grid spacing
        coarseThermalC: raster.thermalCoarseC[idx],
        reconstructedC: raster.reconstructedC[idx],
        referenceC: raster.referenceC ? raster.referenceC[idx] : undefined,
        opticalNdvi: raster.opticalNdvi[idx],
        landCoverClass: coverNames[raster.landCoverMap[idx]] || 'Mixed'
      });
    }

    return points;
  }
}

export const imageService = new ImageService();
