import { create } from 'zustand';

interface CanvasPosition {
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

interface UnderlaySize {
  width: number;
  height: number;
}

interface CanvasState {
  // Camera state
  scale: number;
  position: CanvasPosition;
  // Underlay state
  underlayUrl: string | null;
  underlaySize: UnderlaySize | null;
  underlayName: string | null;
  // Actions
  setScale: (scale: number) => void;
  setPosition: (position: CanvasPosition) => void;
  setScaleAndPosition: (scale: number, position: CanvasPosition) => void;
  setUnderlay: (url: string, size: UnderlaySize, name: string) => void;
  clearUnderlay: () => void;
  // Calibration state
  isCalibrating: boolean;
  calibrationPoints: Point[];
  scaleFactor: number | null; // meters per pixel
  // Calibration actions
  setIsCalibrating: (value: boolean) => void;
  setCalibrationPoints: (points: Point[]) => void;
  setScaleFactor: (factor: number | null) => void;
  resetCalibration: () => void;
  reset: () => void;
}

// NOTE: This store is intentionally NOT wrapped with zundo temporal middleware.
// Camera position, zoom level, and underlay state are UI state, not project data.
// Undo/Redo (zundo) only applies to useZoneStore (zone/floor/system data).
export const useCanvasStore = create<CanvasState>((set) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  underlayUrl: null,
  underlaySize: null,
  underlayName: null,

  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  setScaleAndPosition: (scale, position) => set({ scale, position }),
  
  setUnderlay: (url, size, name) => set({ 
    underlayUrl: url, 
    underlaySize: size, 
    underlayName: name 
  }),
  
  clearUnderlay: () => set({ 
    underlayUrl: null, 
    underlaySize: null,
    underlayName: null 
  }),

  // Calibration defaults
  isCalibrating: false,
  calibrationPoints: [],
  scaleFactor: null,

  setIsCalibrating: (isCalibrating) => set({ isCalibrating }),
  setCalibrationPoints: (calibrationPoints) => set({ calibrationPoints }),
  setScaleFactor: (scaleFactor) => set({ scaleFactor }),
  resetCalibration: () => set({ 
    isCalibrating: false, 
    calibrationPoints: [], 
    scaleFactor: null 
  }),

  reset: () => set({
    scale: 1,
    position: { x: 0, y: 0 },
    underlayUrl: null,
    underlaySize: null,
    underlayName: null,
    isCalibrating: false,
    calibrationPoints: [],
    scaleFactor: null,
  }),
}));
