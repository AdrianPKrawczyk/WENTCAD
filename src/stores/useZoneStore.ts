import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ZoneData, Floor, SystemDef, ProjectStateData } from '../types';
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

  // 3. Recalculate physics for all zones
  Object.keys(newZones).forEach(id => {
    const zone = newZones[id];
    const results = calculateZoneAirBalance(zone);

    if (
      zone.calculatedVolume !== results.calculatedVolume ||
      zone.calculatedExhaust !== results.calculatedExhaust ||
      zone.transferInSum !== results.transferInSum ||
      zone.transferOutSum !== results.transferOutSum ||
      zone.netBalance !== results.netBalance ||
      zone.realACH !== results.realACH ||
      zone.targetACH !== results.targetACH
    ) {
      newZones[id] = { ...zone, ...results };
    }
  });

  return newZones;
}

interface ZoneStore {
  activeProjectId: string | null;
  selectedZoneId: string | null;
  activeFloorId: string;
  zones: Record<string, ZoneData>;
  floors: Record<string, Floor>;
  systems: SystemDef[];
  setActiveProject: (projectId: string | null) => void;
  setSelectedZone: (zoneId: string | null) => void;
  setActiveFloor: (floorId: string) => void;
  addZone: (zone: ZoneData) => void;
  updateZone: (id: string, updates: Partial<ZoneData>) => void;
  removeZone: (id: string) => void;
  recalculateAirBalance: (id?: string) => void;
  addSystem: (system: SystemDef) => void;
  removeSystem: (id: string) => void;
  loadState: (state: ProjectStateData) => void;
  addFloor: (floor: Omit<Floor, 'id' | 'order'>) => string;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  removeFloor: (id: string) => void;
}

export const useZoneStore = create<ZoneStore>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      selectedZoneId: null,
      activeFloorId: DEFAULT_FLOOR_ID,
      zones: {},
      floors: createDefaultFloors(),
      systems: [
        { id: 'NW1', name: 'Nawiew 1', type: 'SUPPLY' },
        { id: 'NW2', name: 'Nawiew 2', type: 'SUPPLY' },
        { id: 'WW1', name: 'Wywiew 1', type: 'EXHAUST' },
        { id: 'WW2', name: 'Wywiew 2', type: 'EXHAUST' },
      ],
      
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
            nextZones[zId].transferOut = nextZones[zId].transferOut.filter(t => t.roomId !== id);
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

      loadState: (stateData) => {
        set({
          zones: resolveZonesState(stateData.zones || {}),
          floors: stateData.floors || {},
          systems: stateData.systems || [],
          activeFloorId: Object.keys(stateData.floors || {})[0] || 'floor-parter'
        });
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
    }),
    {
      name: 'wentcad-zone-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Add default floors if they don't exist
          return {
            ...persistedState,
            floors: persistedState.floors || createDefaultFloors(),
            activeFloorId: persistedState.activeFloorId || DEFAULT_FLOOR_ID
          };
        }
        return persistedState;
      },
    }
  )
);
