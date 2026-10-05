import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  LandsatScene,
  AOI,
  ThermalColormap,
  ViewMode,
  PixelInspection,
  ReconstructionResult,
  ValidationMetrics
} from '../types/ogtsr';
import { datasetService } from '../services/datasetService';
import { imageService, PatchRasterData } from '../services/imageService';
import { modelService } from '../services/modelService';
import { validationService, RegionValidationAnalysis } from '../services/validationService';

export type NavigationTab = 
  | 'overview' 
  | 'datasets' 
  | 'bands' 
  | 'workspace' 
  | 'reconstruction' 
  | 'validation' 
  | 'experiments' 
  | 'exports';

interface AppContextType {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Datasets & AOIs
  scenes: LandsatScene[];
  activeScene: LandsatScene;
  activeAoi: AOI;
  selectScene: (sceneId: string) => void;
  selectAoi: (aoiId: string) => void;
  addCustomAoi: (aoi: AOI) => void;

  // Rasters & Imagery
  activeRaster: PatchRasterData;
  hasReferenceData: boolean;
  setHasReferenceData: (hasRef: boolean) => void;

  // Viewer controls
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeColormap: ThermalColormap;
  setActiveColormap: (cmap: ThermalColormap) => void;
  tempUnit: 'celsius' | 'kelvin';
  setTempUnit: (unit: 'celsius' | 'kelvin') => void;
  tempRange: { minC: number; maxC: number };
  setTempRange: (range: { minC: number; maxC: number }) => void;
  splitPosition: number;
  setSplitPosition: (pos: number) => void;
  blendOpacity: number;
  setBlendOpacity: (opacity: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;

  // Inspection
  hoveredPixel: PixelInspection | null;
  setHoveredPixel: (pixel: PixelInspection | null) => void;
  selectedPixel: PixelInspection | null;
  setSelectedPixel: (pixel: PixelInspection | null) => void;
  transectY: number;
  setTransectY: (y: number) => void;

  // Model & Reconstruction
  isReconstructing: boolean;
  reconstructionProgress: { stage: number; message: string };
  reconstructionResult: ReconstructionResult | null;
  runReconstruction: () => Promise<void>;

  // Validation
  validationAnalysis: RegionValidationAnalysis;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: Dark mode is default
  const [isDark, setIsDark] = useState<boolean>(true);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  // Scene & AOI
  const scenes = useMemo(() => datasetService.getScenes(), []);
  const [activeScene, setActiveScene] = useState<LandsatScene>(datasetService.getActiveScene());
  const [activeAoi, setActiveAoi] = useState<AOI>(datasetService.getActiveAoi());

  // Reference data availability toggle (for research comparison)
  const [hasReferenceData, setHasReferenceData] = useState<boolean>(true);

  // Active raster patch
  const [activeRaster, setActiveRaster] = useState<PatchRasterData>(() =>
    imageService.getAoiRaster(activeAoi, activeScene.id, hasReferenceData)
  );

  // Viewer settings
  const [viewMode, setViewMode] = useState<ViewMode>('side_by_side');
  const [activeColormap, setActiveColormap] = useState<ThermalColormap>('inferno');
  const [tempUnit, setTempUnit] = useState<'celsius' | 'kelvin'>('celsius');
  const [tempRange, setTempRange] = useState<{ minC: number; maxC: number }>({
    minC: 20,
    maxC: 44
  });
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [blendOpacity, setBlendOpacity] = useState<number>(0.65);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inspection
  const [hoveredPixel, setHoveredPixel] = useState<PixelInspection | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<PixelInspection | null>(null);
  const [transectY, setTransectY] = useState<number>(128);

  // Model state
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [reconstructionProgress, setReconstructionProgress] = useState<{ stage: number; message: string }>({
    stage: 0,
    message: ''
  });
  const [reconstructionResult, setReconstructionResult] = useState<ReconstructionResult | null>(null);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Update raster when scene, AOI, or reference toggle changes
  useEffect(() => {
    const raster = imageService.getAoiRaster(activeAoi, activeScene.id, hasReferenceData);
    setActiveRaster(raster);
    setTempRange({
      minC: raster.tempRange.minC,
      maxC: raster.tempRange.maxC
    });
  }, [activeAoi, activeScene.id, hasReferenceData]);

  const selectScene = (sceneId: string) => {
    datasetService.setActiveScene(sceneId);
    const scene = datasetService.getActiveScene();
    setActiveScene(scene);
    setActiveAoi(datasetService.getActiveAoi());
  };

  const selectAoi = (aoiId: string) => {
    datasetService.setActiveAoi(aoiId);
    setActiveAoi(datasetService.getActiveAoi());
  };

  const addCustomAoi = (aoi: AOI) => {
    datasetService.addCustomAoi(aoi);
    setActiveAoi(aoi);
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const runReconstruction = useCallback(async () => {
    setIsReconstructing(true);
    try {
      const res = await modelService.runReconstruction(
        activeScene.id,
        activeAoi.id,
        (stageIndex, log) => {
          setReconstructionProgress({ stage: stageIndex, message: log });
        }
      );
      setReconstructionResult(res);
    } finally {
      setIsReconstructing(false);
    }
  }, [activeScene.id, activeAoi.id]);

  // Compute validation analysis dynamically
  const validationAnalysis = useMemo(() => {
    return validationService.analyzeReconstruction(activeRaster, hasReferenceData);
  }, [activeRaster, hasReferenceData]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isDark,
        toggleTheme,
        scenes,
        activeScene,
        activeAoi,
        selectScene,
        selectAoi,
        addCustomAoi,
        activeRaster,
        hasReferenceData,
        setHasReferenceData,
        viewMode,
        setViewMode,
        activeColormap,
        setActiveColormap,
        tempUnit,
        setTempUnit,
        tempRange,
        setTempRange,
        splitPosition,
        setSplitPosition,
        blendOpacity,
        setBlendOpacity,
        zoom,
        setZoom,
        pan,
        setPan,
        resetView,
        hoveredPixel,
        setHoveredPixel,
        selectedPixel,
        setSelectedPixel,
        transectY,
        setTransectY,
        isReconstructing,
        reconstructionProgress,
        reconstructionResult,
        runReconstruction,
        validationAnalysis
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
