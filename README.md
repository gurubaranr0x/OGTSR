# Optyne

### Remote-Sensing Research System for Sub-Pixel Thermal Spatial Reconstruction

OGTSR investigates whether high-spatial-resolution optical satellite information (30 m Landsat OLI) can help reconstruct finer spatial thermal patterns from coarser thermal observations (Landsat TIRS ~100 m native resolution).

---

## Scientific Principles & Disambiguation

> **Essential Physical Grounding:**
> - **Optical Imagery:** Landsat OLI surface reflectance bands (B1–B7) at **30 m native grid**. Provides structural, textural, and biophysical context (impervious surfaces, roads, vegetation canopy, water bodies).
> - **Thermal Observations:** Landsat TIRS Surface Temperature (`ST_B10`) has an optical sensor aperture of approximately **~100 m**.
> - **Thermal Product Grid:** Distributed by USGS on a **30 m resampled grid**. This 30 m output grid **must NOT be presented or interpreted as independent 30 m thermal measurements**.
> - **OGTSR Reconstruction:** Reconstructs estimated sub-100 m thermal structure under local energy conservation (spatial flux constraint).
> - **Scientific Honesty:** Avoid claims such as *"Convert 100m thermal into accurate 30m temperature"*. Use terminology such as *"Optical-guided thermal spatial reconstruction"*, *"Estimated fine-scale thermal structure"*, and *"Research reconstruction"*.

---

## Application Architecture

The UI is built with strict modularity between the visualization layer and the research model service:

```
frontend/
├── src/
│   ├── types/
│   │   └── ogtsr.ts               # Core data structures, Landsat metadata, AOI, metrics
│   ├── utils/
│   │   └── colormaps.ts           # Scientific palettes (Inferno, Magma, Viridis, Turbo, Plasma)
│   │                              # & USGS Collection 2 Level-2 radiometric calibration
│   ├── services/
│   │   ├── datasetService.ts      # Landsat 8/9 C2 L2 scenes, band definitions & AOIs
│   │   ├── imageService.ts        # Canvas rendering, multi-spectral synthesis, pixel probing
│   │   ├── modelService.ts        # Pipeline manager & pluggable backend API connector
│   │   ├── validationService.ts   # Error metrics (RMSE, MAE, PSNR, SSIM, flux delta) & transects
│   │   ├── experimentService.ts   # Research experiment tracking and ledger
│   │   └── exportService.ts       # Scientific audit reports, GeoJSON, CSV transects
│   ├── components/
│   │   ├── shell/                 # TopNav & LeftRail navigation
│   │   ├── overview/              # Research overview, problem statement & status
│   │   ├── dataset/               # Landsat metadata & band radiometric inspector
│   │   ├── workspace/             # High-precision interactive image analysis viewer
│   │   │   ├── ImageWorkspace.tsx
│   │   │   ├── SplitSliderCanvas.tsx
│   │   │   ├── PixelProbePanel.tsx
│   │   │   └── ColormapBar.tsx
│   │   ├── reconstruction/        # Pipeline orchestration & ML backend connector
│   │   ├── validation/            # Empirical validation, reference comparisons & transects
│   │   ├── experiments/           # Benchmark ledger & hyperparameter logs
│   │   └── export/                # Reproducible research export center
│   ├── context/
│   │   └── AppContext.tsx         # Central application state
│   ├── App.tsx
│   └── main.tsx
```

---

## Plugging In Your Custom ML Backend

The frontend is designed so your Python/PyTorch model backend can be connected without modifying any UI components:

1. In the **Reconstruction** tab, enable the **"Connect External ML Server"** checkbox.
2. Provide your backend endpoint URL (default: `http://localhost:8000/api/reconstruct`).
3. Your endpoint should accept a `POST` request with JSON payload:
   ```json
   {
     "sceneId": "LC09_L2SP_012042_20260919_02_T1",
     "aoiId": "aoi_urban_dense",
     "config": {
       "guidanceBands": ["SR_B2", "SR_B3", "SR_B4", "SR_B5"],
       "opticalScale": 30,
       "thermalNativeScale": 100,
       "targetGrid": 30,
       "thermalConservationWeight": 0.95
     }
   }
   ```
4. Respond with the tensor reconstruction result and summary statistics. When the backend is offline, the frontend falls back cleanly to the local research guidance heuristic with clear scientific disclaimers.

---

## Running the Frontend

To start the development server:

```bash
# From this directory:
npm run dev

# Or directly in frontend:
cd frontend
npm run dev
```

To build for production:

```bash
npm run build
```
