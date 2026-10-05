import { LandsatScene, AOI, ReconstructionResult, ValidationMetrics, TransectPoint } from '../types/ogtsr';

class ExportService {
  /**
   * Generates a GeoJSON representation of the active AOI.
   */
  public generateAoiGeoJson(scene: LandsatScene, aoi: AOI): string {
    const geo = {
      type: 'FeatureCollection',
      name: `OGTSR_AOI_${aoi.id}`,
      crs: {
        type: 'name',
        properties: { name: scene.spatial.crs }
      },
      features: [
        {
          type: 'Feature',
          properties: {
            sceneId: scene.id,
            aoiId: aoi.id,
            name: aoi.name,
            category: aoi.category,
            opticalResolutionMeters: scene.spatial.opticalResolution,
            thermalNativeScaleMeters: scene.spatial.thermalNativeScale,
            thermalProductGridMeters: scene.spatial.thermalProductGrid,
            acquisitionDate: scene.acquisitionDate
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [aoi.bounds.geoMinX || aoi.bounds.x * 30, aoi.bounds.geoMinY || aoi.bounds.y * 30],
                [(aoi.bounds.geoMaxX || (aoi.bounds.x + aoi.bounds.width) * 30), aoi.bounds.geoMinY || aoi.bounds.y * 30],
                [(aoi.bounds.geoMaxX || (aoi.bounds.x + aoi.bounds.width) * 30), (aoi.bounds.geoMaxY || (aoi.bounds.y + aoi.bounds.height) * 30)],
                [aoi.bounds.geoMinX || aoi.bounds.x * 30, (aoi.bounds.geoMaxY || (aoi.bounds.y + aoi.bounds.height) * 30)],
                [aoi.bounds.geoMinX || aoi.bounds.x * 30, aoi.bounds.geoMinY || aoi.bounds.y * 30]
              ]
            ]
          }
        }
      ]
    };
    return JSON.stringify(geo, null, 2);
  }

  /**
   * Generates a formal scientific research report in Markdown.
   */
  public generateScientificAuditReport(
    scene: LandsatScene,
    aoi: AOI,
    reconResult?: ReconstructionResult,
    metrics?: ValidationMetrics
  ): string {
    return `# OGTSR — Scientific Research & Reconstruction Audit Report
**Project:** Optical-Guided Thermal Super-Resolution (OGTSR)
**Generated:** ${new Date().toISOString()}

---

## 1. Physical Sensor & Data Specifications
- **Data Source:** ${scene.satellite} (${scene.sensor})
- **Product Level:** ${scene.productLevel}
- **Scene ID:** \`${scene.id}\`
- **Acquisition Timestamp:** ${scene.acquisitionDate} ${scene.acquisitionTime}
- **Solar Geometry:** Elevation ${scene.sunElevation}°, Azimuth ${scene.sunAzimuth}°
- **Cloud Cover:** ${scene.cloudCover}%
- **Coordinate Reference System (CRS):** ${scene.spatial.crs}

### Spatial Resolution Disambiguation
> **Scientific Integrity Notice:** The Landsat TIRS native spatial sensor aperture is **~100 m**. While the standard USGS Level-2 product is distributed on a **30 m** resampled grid, this does NOT constitute independent 30 m thermal measurements. OGTSR investigates optical guidance to estimate sub-100 m thermal structure under local energy conservation.

- **Optical Resolution (OLI B2-B7):** 30.0 m
- **Thermal Native Scale (TIRS ST_B10):** ~100.0 m
- **Thermal Product Distribution Grid:** 30.0 m
- **Target Experimental Output Grid:** ${scene.spatial.targetOutputScale}.0 m

---

## 2. Area of Interest (AOI)
- **AOI Identifier:** \`${aoi.id}\`
- **Name:** ${aoi.name}
- **Land Cover Class:** ${aoi.category}
- **Grid Extent:** ${aoi.bounds.width} × ${aoi.bounds.height} pixels (approx. ${(aoi.bounds.width * 30) / 1000} km × ${(aoi.bounds.height * 30) / 1000} km)
- **Description:** ${aoi.description}

---

## 3. OGTSR Reconstruction Model Configuration
${reconResult ? `
- **Model Version:** \`${reconResult.config.modelVersion}\` (\`${reconResult.config.modelName}\`)
- **Guidance Features:** ${reconResult.config.guidanceBands.join(', ')}
- **Thermal Conservation Weight (λ):** ${reconResult.config.thermalConservationWeight}
- **Edge Guidance Weight:** ${reconResult.config.edgeGuidanceWeight}
- **Execution Mode:** ${reconResult.isModelSimulated ? 'Experimental Guidance Heuristic (Simulated Research)' : 'Connected PyTorch Backend'}
- **Estimated Mean Temperature:** ${reconResult.meanTempC.toFixed(2)} °C
- **Estimated Temperature Range:** ${reconResult.minTempC.toFixed(2)} °C – ${reconResult.maxTempC.toFixed(2)} °C (Std: ${reconResult.stdTempC.toFixed(2)} °C)
` : 'No reconstruction run recorded for current session.'}

---

## 4. Quantitative Validation & Consistency Assessment
${metrics ? `
- **Validation Status:** ${metrics.hasReferenceData ? 'Evaluated against high-resolution reference observations' : 'Awaiting high-resolution reference dataset'}
${metrics.hasReferenceData ? `
- **Root Mean Squared Error (RMSE):** ${metrics.rmseKelvin?.toFixed(3)} K
- **Mean Absolute Error (MAE):** ${metrics.maeKelvin?.toFixed(3)} K
- **Peak Signal-to-Noise Ratio (PSNR):** ${metrics.psnrDb?.toFixed(2)} dB
- **Structural Similarity Index (SSIM):** ${metrics.ssim?.toFixed(4)}
- **Pearson Spatial Correlation (r):** ${metrics.pearsonR?.toFixed(4)}
` : ''}
- **Mean Spatial Flux Conservation Delta:** ${metrics.spatialEnergyConservationDeltaK ? `${metrics.spatialEnergyConservationDeltaK.toFixed(4)} K` : 'N/A'}
- **Scientific Disclaimer:** ${metrics.disclaimer}
` : 'Quantitative metrics not computed.'}

---
*Report produced by OGTSR Research Platform. Strictly for scientific investigation.*
`;
  }

  /**
   * Generates CSV format for a transect profile.
   */
  public generateTransectCsv(points: TransectPoint[]): string {
    const header = 'Distance_Meters,Coarse_Thermal_Celsius,Reconstructed_Celsius,Reference_Celsius,Optical_NDVI,Land_Cover\n';
    const rows = points.map((p) =>
      [
        p.distanceMeters,
        p.coarseThermalC.toFixed(2),
        p.reconstructedC.toFixed(2),
        p.referenceC !== undefined ? p.referenceC.toFixed(2) : 'N/A',
        p.opticalNdvi.toFixed(4),
        `"${p.landCoverClass}"`
      ].join(',')
    );
    return header + rows.join('\n');
  }

  /**
   * Triggers client-side browser file download.
   */
  public downloadFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports an HTMLCanvasElement as a PNG download.
   */
  public downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const exportService = new ExportService();
