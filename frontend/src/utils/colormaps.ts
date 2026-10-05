// Perceptually uniform scientific colormaps for thermal remote sensing
// Includes Inferno, Magma, Viridis, Plasma, Turbo, and Grayscale

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Key stops for Inferno colormap (Matplotlib standard)
const INFERNO_STOPS: [number, number, number][] = [
  [0, 0, 4],
  [16, 11, 46],
  [44, 10, 77],
  [74, 12, 107],
  [106, 18, 111],
  [137, 27, 105],
  [169, 39, 93],
  [199, 56, 75],
  [224, 79, 53],
  [242, 108, 29],
  [251, 142, 9],
  [251, 179, 21],
  [244, 217, 56],
  [252, 255, 164]
];

// Key stops for Magma colormap
const MAGMA_STOPS: [number, number, number][] = [
  [0, 0, 4],
  [20, 14, 54],
  [51, 16, 103],
  [82, 17, 123],
  [114, 23, 128],
  [147, 33, 125],
  [182, 46, 114],
  [213, 65, 96],
  [238, 93, 80],
  [251, 131, 74],
  [254, 172, 84],
  [254, 213, 117],
  [252, 253, 191]
];

// Key stops for Viridis colormap
const VIRIDIS_STOPS: [number, number, number][] = [
  [68, 1, 84],
  [71, 39, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 131, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37]
];

// Key stops for Plasma colormap
const PLASMA_STOPS: [number, number, number][] = [
  [13, 8, 135],
  [60, 2, 163],
  [106, 0, 168],
  [152, 2, 152],
  [191, 35, 121],
  [221, 74, 88],
  [240, 112, 60],
  [249, 154, 43],
  [249, 196, 38],
  [240, 249, 33]
];

// Key stops for Turbo colormap
const TURBO_STOPS: [number, number, number][] = [
  [48, 18, 59],
  [70, 107, 237],
  [39, 173, 238],
  [34, 222, 170],
  [124, 252, 79],
  [205, 238, 38],
  [253, 186, 36],
  [241, 107, 23],
  [203, 37, 8],
  [122, 4, 2]
];

function interpolateStops(stops: [number, number, number][], t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;

  if (idx >= stops.length - 1) {
    const s = stops[stops.length - 1];
    return { r: s[0], g: s[1], b: s[2] };
  }

  const c1 = stops[idx];
  const c2 = stops[idx + 1];

  return {
    r: Math.round(c1[0] + frac * (c2[0] - c1[0])),
    g: Math.round(c1[1] + frac * (c2[1] - c1[1])),
    b: Math.round(c1[2] + frac * (c2[2] - c1[2]))
  };
}

export function getColormapColor(
  colormap: 'inferno' | 'magma' | 'viridis' | 'plasma' | 'turbo' | 'grayscale',
  t: number
): RGB {
  switch (colormap) {
    case 'inferno':
      return interpolateStops(INFERNO_STOPS, t);
    case 'magma':
      return interpolateStops(MAGMA_STOPS, t);
    case 'viridis':
      return interpolateStops(VIRIDIS_STOPS, t);
    case 'plasma':
      return interpolateStops(PLASMA_STOPS, t);
    case 'turbo':
      return interpolateStops(TURBO_STOPS, t);
    case 'grayscale': {
      const v = Math.round(Math.max(0, Math.min(1, t)) * 255);
      return { r: v, g: v, b: v };
    }
  }
}

/**
 * Landsat Collection 2 Level 2 Calibrations
 */
export function rawDnToKelvin(dn: number): number {
  if (dn <= 0) return 0;
  // Landsat Collection 2 L2 ST_B10: LST = DN * 0.00341802 + 149.0 (in Kelvin)
  return dn * 0.00341802 + 149.0;
}

export function kelvinToCelsius(k: number): number {
  if (k <= 0) return 0;
  return k - 273.15;
}

export function celsiusToKelvin(c: number): number {
  return c + 273.15;
}

export function rawDnToReflectance(dn: number): number {
  if (dn <= 0) return 0;
  // Landsat Collection 2 L2 Surface Reflectance: SR = DN * 0.0000275 - 0.2
  return Math.max(0, Math.min(1.0, dn * 0.0000275 - 0.2));
}

export function formatTemp(celsius: number, unit: 'celsius' | 'kelvin' = 'celsius'): string {
  if (unit === 'kelvin') {
    return `${(celsius + 273.15).toFixed(1)} K`;
  }
  return `${celsius.toFixed(1)} °C`;
}
