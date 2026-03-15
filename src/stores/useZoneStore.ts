import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ZoneData } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';

export interface SystemDef {
  id: string;
  name: string;
  type: 'SUPPLY' | 'EXHAUST' | 'INTAKE' | 'OUTTAKE';
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

    // Check if anything changed to avoid unnecessary object mutations
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
  zones: Record<string, ZoneData>;
  systems: SystemDef[];
  setActiveProject: (projectId: string | null) => void;
  setSelectedZone: (zoneId: string | null) => void;
  addZone: (zone: ZoneData) => void;
  updateZone: (id: string, updates: Partial<ZoneData>) => void;
  removeZone: (id: string) => void;
  recalculateAirBalance: (id?: string) => void;
  addSystem: (system: SystemDef) => void;
  removeSystem: (id: string) => void;
}

export const useZoneStore = create<ZoneStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      selectedZoneId: null,
      zones: {},
  systems: [
    { id: 'NW1', name: 'Nawiew 1', type: 'SUPPLY' },
    { id: 'NW2', name: 'Nawiew 2', type: 'SUPPLY' },
    { id: 'WW1', name: 'Wywiew 1', type: 'EXHAUST' },
    { id: 'WW2', name: 'Wywiew 2', type: 'EXHAUST' },
  ],
  
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),

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
      // Optional: Clear systemId from zones when system is removed
      Object.keys(nextZones).forEach(zId => {
        if (nextZones[zId].systemSupplyId === id) nextZones[zId].systemSupplyId = '';
        if (nextZones[zId].systemExhaustId === id) nextZones[zId].systemExhaustId = '';
      });
      return { systems: newSystems, zones: resolveZonesState(nextZones) };
    });
  }
}),
    {
      name: 'wentcad-zone-storage',
      version: 1,
    }
  )
);
