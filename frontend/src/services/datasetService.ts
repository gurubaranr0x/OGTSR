import { LandsatBand, LandsatScene, AOI } from '../types/ogtsr';

export const LANDSAT_BANDS: LandsatBand[] = [
  {
    id: 'SR_B2',
    name: 'Band 2',
    commonName: 'Blue',
    wavelength: '0.452 - 0.512 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, water body and soil discrimination.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'SR_B3',
    name: 'Band 3',
    commonName: 'Green',
    wavelength: '0.533 - 0.590 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, peak vegetation reflectance.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'SR_B4',
    name: 'Band 4',
    commonName: 'Red',
    wavelength: '0.636 - 0.673 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, chlorophyll absorption band.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'SR_B5',
    name: 'Band 5',
    commonName: 'Near Infrared (NIR)',
    wavelength: '0.851 - 0.879 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, biomass content and shoreline delineation.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'SR_B6',
    name: 'Band 6',
    commonName: 'SWIR 1',
    wavelength: '1.566 - 1.651 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, moisture content in soil and vegetation.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'SR_B7',
    name: 'Band 7',
    commonName: 'SWIR 2',
    wavelength: '2.107 - 2.294 µm',
    resolution: 30,
    type: 'optical',
    description: 'Surface reflectance, mineral and soil composition.',
    scaleFactor: 0.0000275,
    addOffset: -0.2,
    unit: 'Unitless Reflectance'
  },
  {
    id: 'ST_B10',
    name: 'Band 10',
    commonName: 'Surface Temperature (TIRS)',
    wavelength: '10.60 - 11.19 µm',
    resolution: 30, // product grid
    type: 'thermal',
    description: 'Top-of-atmosphere brightness temperature converted to surface temperature (native aperture ~100m, resampled to 30m grid).',
    scaleFactor: 0.00341802,
    addOffset: 149.0,
    unit: 'Kelvin'
  },
  {
    id: 'ST_EMIS',
    name: 'Emissivity',
    commonName: 'Surface Emissivity',
    wavelength: 'N/A',
    resolution: 30,
    type: 'thermal',
    description: 'Estimated surface emissivity derived from ASTER GED.',
    scaleFactor: 0.0001,
    addOffset: 0.0,
    unit: 'Unitless (0 - 1)'
  },
  {
    id: 'QA_PIXEL',
    name: 'Pixel Quality',
    commonName: 'Surface QA Mask',
    wavelength: 'N/A',
    resolution: 30,
    type: 'quality',
    description: 'Bit-packed surface quality flags (clouds, cloud shadow, water, snow).',
    scaleFactor: 1,
    addOffset: 0,
    unit: 'Bitmask'
  }
];

export const MOCK_SCENES: LandsatScene[] = [
  {
    id: 'LC09_L2SP_012042_20260919_02_T1',
    satellite: 'Landsat 9',
    sensor: 'OLI/TIRS',
    productLevel: 'Collection 2 Level-2',
    path: 12,
    row: 42,
    acquisitionDate: '2026-09-19',
    acquisitionTime: '15:37:42 UTC',
    cloudCover: 1.84,
    sunElevation: 48.72,
    sunAzimuth: 143.19,
    spatial: {
      opticalResolution: 30,
      thermalNativeScale: 100,
      thermalProductGrid: 30,
      targetOutputScale: 10,
      crs: 'EPSG:32618 (WGS 84 / UTM zone 18N)',
      bounds: {
        minX: 520000,
        minY: 4280000,
        maxX: 750000,
        maxY: 4510000,
        minLat: 38.65,
        minLon: -77.35,
        maxLat: 40.75,
        maxLon: -74.75
      },
      dimensions: {
        width: 7641,
        height: 7781
      }
    },
    sampleAois: [
      {
        id: 'aoi_urban_dense',
        name: 'Metropolitan Core & River Waterfront',
        category: 'Urban / Impervious',
        description: 'Dense commercial towers, high thermal inertia asphalt streets, juxtaposed against a cool river channel and city park.',
        bounds: { x: 1200, y: 1500, width: 400, height: 400 }
      },
      {
        id: 'aoi_industrial_roofs',
        name: 'Logistics Park & Highway Corridor',
        category: 'Urban / Impervious',
        description: 'Large corrugated metal roofs with extreme localized heating bordered by highway interchanges and sparse grass.',
        bounds: { x: 2100, y: 2800, width: 400, height: 400 }
      },
      {
        id: 'aoi_suburban_mosaic',
        name: 'Suburban Canopy & Residential Grid',
        category: 'Forest / Mixed',
        description: 'Residential single-family homes with tree-lined street shading, showing fine sub-pixel thermal transitions.',
        bounds: { x: 3300, y: 1900, width: 400, height: 400 }
      }
    ],
    isDemo: true
  },
  {
    id: 'LC09_L2SP_143052_20260301_02_T1',
    satellite: 'Landsat 9',
    sensor: 'OLI/TIRS',
    productLevel: 'Collection 2 Level-2',
    path: 143,
    row: 52,
    acquisitionDate: '2026-03-01',
    acquisitionTime: '05:22:18 UTC',
    cloudCover: 0.42,
    sunElevation: 51.34,
    sunAzimuth: 139.81,
    spatial: {
      opticalResolution: 30,
      thermalNativeScale: 100,
      thermalProductGrid: 30,
      targetOutputScale: 10,
      crs: 'EPSG:32644 (WGS 84 / UTM zone 44N)',
      bounds: {
        minX: 210000,
        minY: 1890000,
        maxX: 440000,
        maxY: 2120000,
        minLat: 17.08,
        minLon: 78.12,
        maxLat: 19.16,
        maxLon: 80.35
      },
      dimensions: {
        width: 7641,
        height: 7781
      }
    },
    sampleAois: [
      {
        id: 'aoi_agri_irrigation',
        name: 'Irrigated Cropland & Dry Fallow Fields',
        category: 'Agricultural / Soil',
        description: 'Checkered agricultural parcel boundaries with sharp evapotranspirative cooling contrasts against dry bare soil.',
        bounds: { x: 1800, y: 2200, width: 400, height: 400 }
      },
      {
        id: 'aoi_reservoir_shore',
        name: 'Reservoir Boundary & Wetland Margin',
        category: 'Water / Coastal',
        description: 'Sharp land-water thermal interface testing edge bleeding and thermal blooming artifacts in ~100m sensor data.',
        bounds: { x: 4200, y: 3100, width: 400, height: 400 }
      }
    ],
    isDemo: true
  },
  {
    id: 'LC08_L2SP_144052_20260908_02_T1',
    satellite: 'Landsat 8',
    sensor: 'OLI/TIRS',
    productLevel: 'Collection 2 Level-2',
    path: 144,
    row: 52,
    acquisitionDate: '2026-09-08',
    acquisitionTime: '05:28:44 UTC',
    cloudCover: 3.12,
    sunElevation: 56.18,
    sunAzimuth: 132.05,
    spatial: {
      opticalResolution: 30,
      thermalNativeScale: 100,
      thermalProductGrid: 30,
      targetOutputScale: 10,
      crs: 'EPSG:32643 (WGS 84 / UTM zone 43N)',
      bounds: {
        minX: 300000,
        minY: 1850000,
        maxX: 530000,
        maxY: 2080000
      },
      dimensions: {
        width: 7551,
        height: 7721
      }
    },
    sampleAois: [
      {
        id: 'aoi_urban_sprawl',
        name: 'Peripheral Industrial Zone & Quarry',
        category: 'Urban / Impervious',
        description: 'Exposed bedrock, mining pit, and warehouse complexes surrounded by natural scrubland.',
        bounds: { x: 2800, y: 3400, width: 400, height: 400 }
      }
    ],
    isDemo: true
  }
];

class DatasetService {
  private scenes: LandsatScene[] = [...MOCK_SCENES];
  private activeSceneId: string = MOCK_SCENES[0].id;
  private activeAoiId: string = MOCK_SCENES[0].sampleAois[0].id;

  public getScenes(): LandsatScene[] {
    return this.scenes;
  }

  public getActiveScene(): LandsatScene {
    const found = this.scenes.find((s) => s.id === this.activeSceneId);
    return found || this.scenes[0];
  }

  public setActiveScene(sceneId: string): void {
    const scene = this.scenes.find((s) => s.id === sceneId);
    if (scene) {
      this.activeSceneId = sceneId;
      if (scene.sampleAois.length > 0) {
        this.activeAoiId = scene.sampleAois[0].id;
      }
    }
  }

  public getActiveAoi(): AOI {
    const scene = this.getActiveScene();
    const found = scene.sampleAois.find((a) => a.id === this.activeAoiId);
    return found || scene.sampleAois[0];
  }

  public setActiveAoi(aoiId: string): void {
    this.activeAoiId = aoiId;
  }

  public addCustomAoi(aoi: AOI): void {
    const scene = this.getActiveScene();
    scene.sampleAois.push(aoi);
    this.activeAoiId = aoi.id;
  }

  public getBands(): LandsatBand[] {
    return LANDSAT_BANDS;
  }
}

export const datasetService = new DatasetService();
