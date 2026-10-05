import { ImportedBand, BandRole, BandCompositeMode, ThermalColormap } from '../types/ogtsr';
import { getColormapColor } from '../utils/colormaps';

class BandService {
  private importedBands: ImportedBand[] = [];
  private activeCompositeMode: BandCompositeMode = 'TRUE_COLOR_RGB';

  constructor() {
    this.loadPreset('landsat9');
  }

  public getBands(): ImportedBand[] {
    return this.importedBands;
  }

  public getBandById(id: string): ImportedBand | undefined {
    return this.importedBands.find((b) => b.id === id);
  }

  public getBandByRole(role: BandRole): ImportedBand | undefined {
    return this.importedBands.find((b) => b.role === role);
  }

  public getCompositeMode(): BandCompositeMode {
    return this.activeCompositeMode;
  }

  public setCompositeMode(mode: BandCompositeMode): void {
    this.activeCompositeMode = mode;
  }

  public addBand(band: ImportedBand): void {
    // Remove if same id or role conflict
    this.importedBands = this.importedBands.filter((b) => b.id !== band.id);
    this.importedBands.push(band);
  }

  public removeBand(id: string): void {
    this.importedBands = this.importedBands.filter((b) => b.id !== id);
  }

  public updateBand(id: string, partial: Partial<ImportedBand>): void {
    const idx = this.importedBands.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.importedBands[idx] = { ...this.importedBands[idx], ...partial };
    }
  }

  /**
   * Generates procedural realistic test raster data for a specific band role
   */
  public generateBandData(role: BandRole, width: number = 256, height: number = 256): Float32Array {
    const size = width * height;
    const data = new Float32Array(size);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const nx = x / width;
        const ny = y / height;

        // River channel
        const riverCenter = 0.3 + 0.12 * Math.sin(ny * 7.0) + 0.05 * Math.cos(ny * 13.0);
        const isRiver = Math.abs(nx - riverCenter) < 0.055;

        // Urban grid
        const gridX = Math.floor(nx * 18);
        const gridY = Math.floor(ny * 18);
        const isRoad = (nx * 18 - gridX < 0.18) || (ny * 18 - gridY < 0.18);
        const isBuildingRoof = !isRoad && !isRiver && ((gridX * 7 + gridY * 11) % 5 <= 2);
        const isPark = !isRiver && !isRoad && !isBuildingRoof && ((gridX + gridY) % 3 === 0);

        let val = 0.15;
        switch (role) {
          case 'BLUE':
            val = isRiver ? 0.22 : isRoad ? 0.15 : isBuildingRoof ? 0.28 : isPark ? 0.05 : 0.14;
            break;
          case 'GREEN':
            val = isRiver ? 0.18 : isRoad ? 0.16 : isBuildingRoof ? 0.26 : isPark ? 0.18 : 0.16;
            break;
          case 'RED':
            val = isRiver ? 0.08 : isRoad ? 0.19 : isBuildingRoof ? 0.32 : isPark ? 0.06 : 0.22;
            break;
          case 'NIR':
            // High reflectance for vegetation, very low for water
            val = isRiver ? 0.02 : isRoad ? 0.17 : isBuildingRoof ? 0.25 : isPark ? 0.65 : 0.28;
            break;
          case 'SWIR1':
            // High for dry urban and soil, low for water and lush green
            val = isRiver ? 0.01 : isRoad ? 0.28 : isBuildingRoof ? 0.42 : isPark ? 0.12 : 0.35;
            break;
          case 'SWIR2':
            val = isRiver ? 0.005 : isRoad ? 0.24 : isBuildingRoof ? 0.38 : isPark ? 0.08 : 0.30;
            break;
          case 'TIR1':
            // Thermal ~100m native blur: water cool (~20°C), asphalt/roofs warm (~38°C), vegetation moderate (~24°C)
            val = isRiver ? 20.5 : isRoad ? 36.8 : isBuildingRoof ? 38.5 : isPark ? 24.2 : 31.0;
            break;
          case 'TIR2':
            val = isRiver ? 20.2 : isRoad ? 36.2 : isBuildingRoof ? 37.9 : isPark ? 23.9 : 30.6;
            break;
          case 'EMIS':
            val = isRiver ? 0.985 : isRoad ? 0.945 : isBuildingRoof ? 0.915 : isPark ? 0.975 : 0.950;
            break;
          case 'QA':
            val = 0; // Clear sky
            break;
          default:
            val = 0.2;
            break;
        }

        // Add subtle subpixel micro-noise
        const noise = (Math.sin(x * 17.1 + y * 29.3) * 0.012);
        data[idx] = Math.max(0, val + noise);
      }
    }

    return data;
  }

  public computeStats(data: Float32Array): { min: number; max: number; mean: number; std: number } {
    let min = Infinity, max = -Infinity, sum = 0;
    const len = data.length;
    for (let i = 0; i < len; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
    const mean = sum / len;
    let varSum = 0;
    for (let i = 0; i < len; i++) {
      const d = data[i] - mean;
      varSum += d * d;
    }
    const std = Math.sqrt(varSum / len);
    return { min, max, mean, std };
  }

  /**
   * Loads preset satellite sensor band suites
   */
  public loadPreset(presetKey: 'landsat9' | 'sentinel2' | 'airborne'): void {
    const bands: ImportedBand[] = [];

    if (presetKey === 'landsat9') {
      const defs: { id: string; name: string; role: BandRole; res: number; wave: string; unit: string }[] = [
        { id: 'b2_blue', name: 'Band 2 (Blue)', role: 'BLUE', res: 30, wave: '0.452 - 0.512 µm', unit: 'Reflectance' },
        { id: 'b3_green', name: 'Band 3 (Green)', role: 'GREEN', res: 30, wave: '0.533 - 0.590 µm', unit: 'Reflectance' },
        { id: 'b4_red', name: 'Band 4 (Red)', role: 'RED', res: 30, wave: '0.636 - 0.673 µm', unit: 'Reflectance' },
        { id: 'b5_nir', name: 'Band 5 (NIR)', role: 'NIR', res: 30, wave: '0.851 - 0.879 µm', unit: 'Reflectance' },
        { id: 'b6_swir1', name: 'Band 6 (SWIR 1)', role: 'SWIR1', res: 30, wave: '1.566 - 1.651 µm', unit: 'Reflectance' },
        { id: 'b7_swir2', name: 'Band 7 (SWIR 2)', role: 'SWIR2', res: 30, wave: '2.107 - 2.294 µm', unit: 'Reflectance' },
        { id: 'b10_tirs', name: 'Band 10 (TIRS LST)', role: 'TIR1', res: 100, wave: '10.60 - 11.19 µm', unit: 'Celsius (°C)' },
        { id: 'b11_emis', name: 'Surface Emissivity', role: 'EMIS', res: 30, wave: 'Broadband', unit: 'Unitless (0-1)' }
      ];

      for (const d of defs) {
        const raw = this.generateBandData(d.role);
        bands.push({
          id: d.id,
          name: d.name,
          fileName: `LC09_L2SP_012042_${d.id.toUpperCase()}.TIF`,
          role: d.role,
          resolution: d.res,
          wavelength: d.wave,
          gain: d.role === 'TIR1' ? 0.00341802 : 0.0000275,
          offset: d.role === 'TIR1' ? 149.0 : -0.2,
          unit: d.unit,
          data: raw,
          stats: this.computeStats(raw)
        });
      }
    } else if (presetKey === 'sentinel2') {
      const defs: { id: string; name: string; role: BandRole; res: number; wave: string; unit: string }[] = [
        { id: 's2_b02', name: 'B02 (Blue 10m)', role: 'BLUE', res: 10, wave: '490 nm', unit: 'Reflectance' },
        { id: 's2_b03', name: 'B03 (Green 10m)', role: 'GREEN', res: 10, wave: '560 nm', unit: 'Reflectance' },
        { id: 's2_b04', name: 'B04 (Red 10m)', role: 'RED', res: 10, wave: '665 nm', unit: 'Reflectance' },
        { id: 's2_b08', name: 'B08 (NIR Broad 10m)', role: 'NIR', res: 10, wave: '842 nm', unit: 'Reflectance' },
        { id: 's2_b11', name: 'B11 (SWIR 20m)', role: 'SWIR1', res: 20, wave: '1610 nm', unit: 'Reflectance' },
        { id: 's2_b12', name: 'B12 (SWIR-2 20m)', role: 'SWIR2', res: 20, wave: '2190 nm', unit: 'Reflectance' },
        { id: 's2_tir_paired', name: 'Paired Landsat/ECOSTRESS Thermal', role: 'TIR1', res: 70, wave: '10.5 µm', unit: 'Celsius (°C)' }
      ];

      for (const d of defs) {
        const raw = this.generateBandData(d.role);
        bands.push({
          id: d.id,
          name: d.name,
          fileName: `S2A_MSIL2A_${d.id.toUpperCase()}.jp2`,
          role: d.role,
          resolution: d.res,
          wavelength: d.wave,
          gain: 0.0001,
          offset: 0.0,
          unit: d.unit,
          data: raw,
          stats: this.computeStats(raw)
        });
      }
    } else if (presetKey === 'airborne') {
      const defs: { id: string; name: string; role: BandRole; res: number; wave: string; unit: string }[] = [
        { id: 'air_blue', name: 'Airborne VIS Blue (3m)', role: 'BLUE', res: 3, wave: '475 nm', unit: 'Reflectance' },
        { id: 'air_green', name: 'Airborne VIS Green (3m)', role: 'GREEN', res: 3, wave: '550 nm', unit: 'Reflectance' },
        { id: 'air_red', name: 'Airborne VIS Red (3m)', role: 'RED', res: 3, wave: '660 nm', unit: 'Reflectance' },
        { id: 'air_nir', name: 'Airborne VNIR (3m)', role: 'NIR', res: 3, wave: '850 nm', unit: 'Reflectance' },
        { id: 'air_thermal', name: 'MASTER/TIMS Airborne Thermal (5m)', role: 'TIR1', res: 5, wave: '10.8 µm', unit: 'Celsius (°C)' }
      ];

      for (const d of defs) {
        const raw = this.generateBandData(d.role);
        bands.push({
          id: d.id,
          name: d.name,
          fileName: `MASTER_FLIGHT_${d.id.toUpperCase()}.tif`,
          role: d.role,
          resolution: d.res,
          wavelength: d.wave,
          gain: 1.0,
          offset: 0.0,
          unit: d.unit,
          data: raw,
          stats: this.computeStats(raw)
        });
      }
    }

    this.importedBands = bands;
  }

  /**
   * Renders the specified composite or single band to a canvas
   */
  public renderCompositeToCanvas(
    canvas: HTMLCanvasElement,
    mode: BandCompositeMode,
    selectedSingleBandId?: string,
    colormap: ThermalColormap = 'inferno'
  ): void {
    const width = 256;
    const height = 256;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const pixels = imgData.data;
    const size = width * height;

    const bRed = this.getBandByRole('RED')?.data;
    const bGreen = this.getBandByRole('GREEN')?.data;
    const bBlue = this.getBandByRole('BLUE')?.data;
    const bNir = this.getBandByRole('NIR')?.data;
    const bSwir1 = this.getBandByRole('SWIR1')?.data;
    const bSwir2 = this.getBandByRole('SWIR2')?.data;
    const bTir = this.getBandByRole('TIR1')?.data;

    if (mode === 'TRUE_COLOR_RGB') {
      const r = bRed || this.generateBandData('RED');
      const g = bGreen || this.generateBandData('GREEN');
      const b = bBlue || this.generateBandData('BLUE');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        // Stretch [0.02, 0.45] to [0, 255]
        pixels[p] = Math.round(Math.max(0, Math.min(1, (r[i] - 0.02) / 0.43)) * 255);
        pixels[p + 1] = Math.round(Math.max(0, Math.min(1, (g[i] - 0.02) / 0.43)) * 255);
        pixels[p + 2] = Math.round(Math.max(0, Math.min(1, (b[i] - 0.02) / 0.43)) * 255);
        pixels[p + 3] = 255;
      }
    } else if (mode === 'FALSE_COLOR_NIR') {
      // Color Infrared: NIR -> Red, Red -> Green, Green -> Blue
      const nir = bNir || this.generateBandData('NIR');
      const red = bRed || this.generateBandData('RED');
      const green = bGreen || this.generateBandData('GREEN');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        pixels[p] = Math.round(Math.max(0, Math.min(1, (nir[i] - 0.05) / 0.65)) * 255);
        pixels[p + 1] = Math.round(Math.max(0, Math.min(1, (red[i] - 0.02) / 0.35)) * 255);
        pixels[p + 2] = Math.round(Math.max(0, Math.min(1, (green[i] - 0.02) / 0.35)) * 255);
        pixels[p + 3] = 255;
      }
    } else if (mode === 'SWIR_URBAN') {
      // SWIR2 -> Red, SWIR1 -> Green, Red -> Blue
      const swir2 = bSwir2 || this.generateBandData('SWIR2');
      const swir1 = bSwir1 || this.generateBandData('SWIR1');
      const red = bRed || this.generateBandData('RED');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        pixels[p] = Math.round(Math.max(0, Math.min(1, (swir2[i] - 0.02) / 0.45)) * 255);
        pixels[p + 1] = Math.round(Math.max(0, Math.min(1, (swir1[i] - 0.02) / 0.45)) * 255);
        pixels[p + 2] = Math.round(Math.max(0, Math.min(1, (red[i] - 0.02) / 0.35)) * 255);
        pixels[p + 3] = 255;
      }
    } else if (mode === 'THERMAL_SINGLE') {
      const tir = bTir || this.generateBandData('TIR1');
      // Dynamic range approx 18°C to 42°C
      const minT = 18, maxT = 42;
      const span = maxT - minT;

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const t = Math.max(0, Math.min(1, (tir[i] - minT) / span));
        const color = getColormapColor(colormap, t);
        pixels[p] = color.r;
        pixels[p + 1] = color.g;
        pixels[p + 2] = color.b;
        pixels[p + 3] = 255;
      }
    } else if (mode === 'INDEX_NDVI') {
      const nir = bNir || this.generateBandData('NIR');
      const red = bRed || this.generateBandData('RED');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const ndvi = (nir[i] - red[i]) / Math.max(0.001, (nir[i] + red[i]));
        const t = Math.max(0, Math.min(1, (ndvi + 0.2) / 1.0));
        const color = getColormapColor('viridis', t);
        pixels[p] = color.r;
        pixels[p + 1] = color.g;
        pixels[p + 2] = color.b;
        pixels[p + 3] = 255;
      }
    } else if (mode === 'INDEX_NDBI') {
      // NDBI = (SWIR - NIR) / (SWIR + NIR)
      const swir = bSwir1 || this.generateBandData('SWIR1');
      const nir = bNir || this.generateBandData('NIR');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const ndbi = (swir[i] - nir[i]) / Math.max(0.001, (swir[i] + nir[i]));
        const t = Math.max(0, Math.min(1, (ndbi + 0.4) / 0.8));
        const color = getColormapColor('magma', t);
        pixels[p] = color.r;
        pixels[p + 1] = color.g;
        pixels[p + 2] = color.b;
        pixels[p + 3] = 255;
      }
    } else if (mode === 'INDEX_MNDWI') {
      // MNDWI = (Green - SWIR) / (Green + SWIR)
      const green = bGreen || this.generateBandData('GREEN');
      const swir = bSwir1 || this.generateBandData('SWIR1');

      for (let i = 0; i < size; i++) {
        const p = i * 4;
        const mndwi = (green[i] - swir[i]) / Math.max(0.001, (green[i] + swir[i]));
        const t = Math.max(0, Math.min(1, (mndwi + 0.5) / 1.0));
        const color = getColormapColor('turbo', t);
        pixels[p] = color.r;
        pixels[p + 1] = color.g;
        pixels[p + 2] = color.b;
        pixels[p + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Probes all imported bands at (x, y)
   */
  public probeBands(x: number, y: number, width: number = 256, height: number = 256): Record<string, number> {
    const px = Math.max(0, Math.min(width - 1, x));
    const py = Math.max(0, Math.min(height - 1, y));
    const idx = py * width + px;

    const values: Record<string, number> = {};
    for (const b of this.importedBands) {
      values[b.role] = b.data[idx];
    }

    // Compute indices
    const nir = values['NIR'] ?? 0;
    const red = values['RED'] ?? 0;
    const swir = values['SWIR1'] ?? 0;
    const green = values['GREEN'] ?? 0;

    values['NDVI'] = (nir - red) / Math.max(0.001, (nir + red));
    values['NDBI'] = (swir - nir) / Math.max(0.001, (swir + nir));
    values['MNDWI'] = (green - swir) / Math.max(0.001, (green + swir));

    return values;
  }
}

export const bandService = new BandService();
