import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { ZoneData, Floor, SystemDef, ProjectStateData, AnalysisPreset, StylePreset } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';

const DEFAULT_FLOOR_ID = 'floor-parter';

function createDefaultFloors(): Record<string, Floor> {
  return {
    [DEFAULT_FLOOR_ID]: { id: DEFAULT_FLOOR_ID, name: 'Parter', elevation: 0.0, order: 0 }
  };
}

function resolveZonesState(zones: Record<string, ZoneData>): Record<string, ZoneData> {
  const newZones = { ...zones };

  // 1. Clear all transferIn
  Object.keys(newZones).forEach(id => {
    if (newZones[id]) {
      newZones[id] = { ...newZones[id], transferIn: [] };
    }
  });

  // 2. Rebuild transferIn from transferOut
  Object.values(newZones).forEach(sourceZone => {
    if (sourceZone.transferOut && sourceZone.transferOut.length > 0) {
      sourceZone.transferOut.forEach(tOut => {
        const targetId = tOut.roomId;
        if (newZones[targetId]) {
          newZones[targetId].transferIn.push({
            roomId: sourceZone.id,
            volume: tOut.volume
          });
        }
      });
    }
  });

  // 3. Recalculate physics and handle area sync for all zones
  Object.keys(newZones).forEach(id => {
    const zone = newZones[id];
    
    // Sync Area based on Manual Flag
    let finalArea = zone.isAreaManual 
      ? (zone.manualArea || 0) 
      : (zone.geometryArea ?? zone.manualArea ?? 0);
    
    // Rounding to 2 decimal places
    finalArea = Math.round(finalArea * 100) / 100;
    const roundedManualArea = Math.round((zone.manualArea || 0) * 100) / 100;

    const updatedZone = { 
      ...zone, 
      area: finalArea, 
      manualArea: roundedManualArea 
    };
    
    const results = calculateZoneAirBalance(updatedZone);

    if (
      updatedZone.area !== results.calculatedVolume || // Wait, area is input to physics, not output
      updatedZone.calculatedVolume !== results.calculatedVolume ||
      updatedZone.calculatedExhaust !== results.calculatedExhaust ||
      updatedZone.transferInSum !== results.transferInSum ||
      updatedZone.transferOutSum !== results.transferOutSum ||
      updatedZone.netBalance !== results.netBalance ||
      updatedZone.realACH !== results.realACH ||
      updatedZone.targetACH !== results.targetACH ||
      updatedZone.area !== finalArea // Ensure area change triggers update
    ) {
      newZones[id] = { ...updatedZone, ...results };
    }
  });

  return newZones;
}

interface ZoneStore {
  activeProjectId: string | null;
  selectedZoneId: string | null;
  activeFloorId: string;
  analysisPresets: AnalysisPreset[];
  zones: Record<string, ZoneData>;
  floors: Record<string, Floor>;
  systems: SystemDef[];
  stylePresets: StylePreset[];
  isSystemColoringEnabled: boolean;
  globalSystemOpacity: number;
  columnState: any | null;
  setColumnState: (state: any) => void;
  setActiveProject: (projectId: string | null) => void;
  setSelectedZone: (zoneId: string | null) => void;
  setActiveFloor: (floorId: string) => void;
  addZone: (zone: ZoneData) => void;
  updateZone: (id: string, updates: Partial<ZoneData>) => void;
  removeZone: (id: string) => void;
  bulkUpdateZones: (ids: string[], updates: Partial<ZoneData>) => void;
  bulkDeleteZones: (ids: string[]) => void;
  recalculateAirBalance: (id?: string) => void;
  addSystem: (system: SystemDef) => void;
  addSystems: (systems: SystemDef[]) => void;
  updateSystem: (id: string, updates: Partial<SystemDef>) => void;
  removeSystem: (id: string) => void;
  setIsSystemColoringEnabled: (enabled: boolean) => void;
  setGlobalSystemOpacity: (val: number) => void;
  generateAutoColors: () => void;
  saveStylePreset: (preset: StylePreset) => void;
  removeStylePreset: (id: string) => void;
  loadState: (projectId: string, state: ProjectStateData) => void;
  addFloor: (floor: Omit<Floor, 'id' | 'order'>) => string;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  removeFloor: (id: string) => void;
  saveAnalysisPreset: (preset: AnalysisPreset) => void;
  removeAnalysisPreset: (id: string) => void;
}

export const useZoneStore = create<ZoneStore>()(
  temporal(
    persist(
    (set, get) => ({
      activeProjectId: null,
      selectedZoneId: null,
      activeFloorId: DEFAULT_FLOOR_ID,
      zones: {},
      floors: createDefaultFloors(),
      systems: [
        { id: 'N1', name: 'Nawiew 1', type: 'SUPPLY' },
        { id: 'N2', name: 'Nawiew 2', type: 'SUPPLY' },
        { id: 'W1', name: 'Wywiew 1', type: 'EXHAUST' },
        { id: 'W2', name: 'Wywiew 2', type: 'EXHAUST' },
      ],
      analysisPresets: [],
      stylePresets: [],
      isSystemColoringEnabled: false,
      globalSystemOpacity: 20,
      columnState: null,
      
      setColumnState: (state) => set({ columnState: state }),
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
      setActiveFloor: (floorId) => set({ activeFloorId: floorId }),

      addZone: (zone) => {
        set((state) => {
          const nextZones = { ...state.zones, [zone.id]: zone };
          return { zones: resolveZonesState(nextZones) };
        });
      },

      updateZone: (id, updates) => {
        set((state) => {
          const existingZone = state.zones[id];
          if (!existingZone) return state;
          const nextZones = {
            ...state.zones,
            [id]: { ...existingZone, ...updates }
          };
          return { zones: resolveZonesState(nextZones) };
        });
      },

      removeZone: (id) => {
        set((state) => {
          const nextZones = { ...state.zones };
          delete nextZones[id];
          // Sync transfers to remove orphan transferOut references
          Object.keys(nextZones).forEach(zId => {
            if (nextZones[zId]) {
              nextZones[zId].transferOut = nextZones[zId].transferOut.filter(t => t.roomId !== id);
            }
          });
          return { zones: resolveZonesState(nextZones) };
        });
      },

      bulkUpdateZones: (ids, updates) => {
        set((state) => {
          const nextZones = { ...state.zones };
          ids.forEach(id => {
            if (nextZones[id]) {
              nextZones[id] = { ...nextZones[id], ...updates };
            }
          });
          return { zones: resolveZonesState(nextZones) };
        });
      },

      bulkDeleteZones: (ids) => {
        set((state) => {
          const nextZones = { ...state.zones };
          const idsToRemove = new Set(ids);
          ids.forEach(id => delete nextZones[id]);
          
          Object.keys(nextZones).forEach(zId => {
            if (nextZones[zId]) {
              nextZones[zId].transferOut = nextZones[zId].transferOut.filter(t => !idsToRemove.has(t.roomId));
            }
          });
          return { zones: resolveZonesState(nextZones) };
        });
      },

      recalculateAirBalance: () => {
        set((state) => ({ zones: resolveZonesState(state.zones) }));
      },

      addSystem: (system) => {
        set((state) => {
          if (state.systems.some(s => s.id === system.id)) return state;
          return { systems: [...state.systems, system] };
        });
      },
      addSystems: (newSystems) => {
        set((state) => {
          const existingIds = new Set(state.systems.map(s => s.id));
          const filteredNew = newSystems.filter(s => !existingIds.has(s.id));
          if (filteredNew.length === 0) return state;
          return { systems: [...state.systems, ...filteredNew] };
        });
      },

      updateSystem: (id, updates) => {
        set((state) => ({
          systems: state.systems.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
      },

      removeSystem: (id) => {
        set((state) => {
          const newSystems = state.systems.filter(s => s.id !== id);
          const nextZones = { ...state.zones };
          Object.keys(nextZones).forEach(zId => {
            if (nextZones[zId].systemSupplyId === id) nextZones[zId].systemSupplyId = '';
            if (nextZones[zId].systemExhaustId === id) nextZones[zId].systemExhaustId = '';
          });
          return { systems: newSystems, zones: resolveZonesState(nextZones) };
        });
      },

      loadState: (projectId, stateData) => {
        set({
          activeProjectId: projectId,
          zones: resolveZonesState(stateData.zones || {}),
          floors: stateData.floors || {},
          systems: stateData.systems || [],
          analysisPresets: stateData.analysisPresets || [],
          stylePresets: stateData.stylePresets || [],
          isSystemColoringEnabled: stateData.isSystemColoringEnabled ?? false,
          globalSystemOpacity: stateData.globalSystemOpacity ?? 20,
          columnState: stateData.columnState ?? null,
          activeFloorId: Object.keys(stateData.floors || {})[0] || 'floor-parter'
        });
      },

      setIsSystemColoringEnabled: (enabled) => set({ isSystemColoringEnabled: enabled }),
      setGlobalSystemOpacity: (val) => set({ globalSystemOpacity: val }),

      generateAutoColors: () => {
        const hvacPallete = [
          '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', 
          '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
        ];
        set((state) => ({
          systems: state.systems.map((s, i) => ({
            ...s,
            color: s.color || hvacPallete[i % hvacPallete.length]
          }))
        }));
      },

      saveStylePreset: (preset) => {
        set((state) => {
          const index = state.stylePresets.findIndex(p => p.id === preset.id);
          const nextPresets = [...state.stylePresets];
          if (index >= 0) nextPresets[index] = preset;
          else nextPresets.push(preset);
          return { stylePresets: nextPresets };
        });
      },

      removeStylePreset: (id) => {
        set((state) => ({
          stylePresets: state.stylePresets.filter(p => p.id !== id)
        }));
      },

      // ===== FLOOR CRUD =====
      addFloor: (floorData) => {
        const state = get();
        const maxOrder = Object.values(state.floors).reduce(
          (max, f) => Math.max(max, f.order), -1
        );
        const newFloor: Floor = {
          id: `floor-${Date.now()}`,
          name: floorData.name,
          elevation: floorData.elevation,
          order: maxOrder + 1,
          originDescription: (floorData as any).originDescription || "",
        };
        set((s) => ({ floors: { ...s.floors, [newFloor.id]: newFloor } }));
        return newFloor.id;
      },

      updateFloor: (id, updates) => {
        set((state) => {
          if (!state.floors[id]) return state;
          return {
            floors: {
              ...state.floors,
              [id]: { ...state.floors[id], ...updates }
            }
          };
        });
      },

      removeFloor: (id) => {
        set((state) => {
          const floorCount = Object.keys(state.floors).length;
          if (floorCount <= 1) return state; // zawsze musi być ≥1 kondygnacja
          
          const newFloors = { ...state.floors };
          delete newFloors[id];

          // Usuń wszystkie pomieszczenia przypisane do usuwanej kondygnacji
          const nextZones = { ...state.zones };
          Object.keys(nextZones).forEach(zId => {
            if (nextZones[zId].floorId === id) {
              delete nextZones[zId];
            }
          });

          // Zmień aktywną kondygnację jeśli usunięto aktywną
          const newActiveFloorId = state.activeFloorId === id
            ? Object.keys(newFloors)[0]
            : state.activeFloorId;

          return {
            floors: newFloors,
            zones: resolveZonesState(nextZones),
            activeFloorId: newActiveFloorId,
          };
        });
      },
      saveAnalysisPreset: (preset) => {
        set((state) => {
          const index = state.analysisPresets.findIndex(p => p.id === preset.id);
          const nextPresets = [...state.analysisPresets];
          if (index >= 0) {
            nextPresets[index] = preset;
          } else {
            nextPresets.push(preset);
          }
          return { analysisPresets: nextPresets };
        });
      },

      removeAnalysisPreset: (id) => {
        set((state) => ({
          analysisPresets: state.analysisPresets.filter(p => p.id !== id)
        }));
      },
    }),
    {
      name: 'wentcad-zone-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            floors: persistedState.floors || createDefaultFloors(),
            activeFloorId: persistedState.activeFloorId || DEFAULT_FLOOR_ID
          };
        }
        return persistedState;
      },
    }
  ),
  {
    limit: 50,
    partialize: (state: any) => {
      const { 
        zones, 
        floors, 
        systems, 
        analysisPresets, 
        stylePresets, 
        isSystemColoringEnabled, 
        globalSystemOpacity 
      } = state;
      return { 
        zones, 
        floors, 
        systems, 
        analysisPresets, 
        stylePresets, 
        isSystemColoringEnabled, 
        globalSystemOpacity 
      };
    },
  }
)
);
