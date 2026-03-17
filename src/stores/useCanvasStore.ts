import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

/**
 * Custom storage for Zustand using idb-keyval to bypass the 5MB localStorage limit.
 * This is crucial for storing Base64 encoded underlay images.
 */
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface Point {
  x: number;
  y: number;
}

export interface FloorCanvasState {
  underlayUrl: string | null;
  underlaySize: { width: number; height: number } | null;
  underlayName: string | null;
  scaleFactor: number | null; // meters per pixel
  referenceOrigin: Point | null; // (0,0) point on building
  panPosition: Point;
  zoomLevel: number;
  polygons: { id: string, zoneId: string, points: number[] }[];
}

interface CanvasState {
  floors: Record<string, FloorCanvasState>;
  
  // Ephemeral UI state (not persisted per floor, or globally relevant)
  isCalibrating: boolean;
  calibrationPoints: Point[];
  isMeasuring: boolean;
  isSettingOrigin: boolean;
  isDrawingPolygon: boolean;
  currentPolygonPoints: Point[];

  // Actions
  getFloorState: (floorId: string) => FloorCanvasState;
  updateFloorState: (floorId: string, updates: Partial<FloorCanvasState>) => void;
  
  // Global/Ephemeral actions
  setIsCalibrating: (value: boolean) => void;
  setCalibrationPoints: (points: Point[]) => void;
  setIsMeasuring: (value: boolean) => void;
  setIsSettingOrigin: (value: boolean) => void;
  setIsDrawingPolygon: (value: boolean) => void;
  setCurrentPolygonPoints: (points: Point[]) => void;
  
  resetFloor: (floorId: string) => void;
  resetAll: () => void;
}

const DEFAULT_FLOOR_STATE: FloorCanvasState = {
  underlayUrl: null,
  underlaySize: null,
  underlayName: null,
  scaleFactor: null,
  referenceOrigin: null,
  panPosition: { x: 0, y: 0 },
  zoomLevel: 1,
  polygons: []
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      floors: {},
      
      isCalibrating: false,
      calibrationPoints: [],
      isMeasuring: false,
      isSettingOrigin: false,
      isDrawingPolygon: false,
      currentPolygonPoints: [],

      getFloorState: (floorId: string) => {
        return get().floors[floorId] || DEFAULT_FLOOR_STATE;
      },

      updateFloorState: (floorId, updates) => {
        set((state) => ({
          floors: {
            ...state.floors,
            [floorId]: {
              ...(state.floors[floorId] || DEFAULT_FLOOR_STATE),
              ...updates
            }
          }
        }));
      },

      setIsCalibrating: (isCalibrating) => set((state) => ({ 
        isCalibrating,
        isMeasuring: isCalibrating ? false : state.isMeasuring,
        isSettingOrigin: isCalibrating ? false : state.isSettingOrigin
      })),

      setCalibrationPoints: (calibrationPoints) => set({ calibrationPoints }),

      setIsMeasuring: (isMeasuring) => set((state) => ({ 
        isMeasuring,
        isCalibrating: isMeasuring ? false : state.isCalibrating,
        isSettingOrigin: isMeasuring ? false : state.isSettingOrigin
      })),

      setIsSettingOrigin: (isSettingOrigin) => set((state) => ({
        isSettingOrigin,
        isCalibrating: isSettingOrigin ? false : state.isCalibrating,
        isMeasuring: isSettingOrigin ? false : state.isMeasuring,
        isDrawingPolygon: isSettingOrigin ? false : state.isDrawingPolygon
      })),

      setIsDrawingPolygon: (isDrawingPolygon) => set((state) => ({
        isDrawingPolygon,
        isCalibrating: isDrawingPolygon ? false : state.isCalibrating,
        isMeasuring: isDrawingPolygon ? false : state.isMeasuring,
        isSettingOrigin: isDrawingPolygon ? false : state.isSettingOrigin
      })),

      setCurrentPolygonPoints: (currentPolygonPoints) => set({ currentPolygonPoints }),

      resetFloor: (floorId) => {
        set((state) => {
          const newFloors = { ...state.floors };
          delete newFloors[floorId];
          return { floors: newFloors };
        });
      },

      resetAll: () => set({
        floors: {},
        isCalibrating: false,
        calibrationPoints: [],
        isMeasuring: false,
        isSettingOrigin: false,
        isDrawingPolygon: false,
        currentPolygonPoints: []
      }),
    }),
    {
      name: 'wentcad-canvas-storage-v2',
      storage: createJSONStorage(() => idbStorage),
      // Only persist the floors data, ephemeral UI state like 'isCalibrating' should reset on reload
      partialize: (state) => ({ floors: state.floors }),
    }
  )
);
