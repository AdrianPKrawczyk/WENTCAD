import { create } from 'zustand';
import type { ZoneData } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';

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
      zone.realACH !== results.realACH
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
  setActiveProject: (projectId: string | null) => void;
  setSelectedZone: (zoneId: string | null) => void;
  addZone: (zone: ZoneData) => void;
  updateZone: (id: string, updates: Partial<ZoneData>) => void;
  removeZone: (id: string) => void;
  recalculateAirBalance: (id?: string) => void;
}

export const useZoneStore = create<ZoneStore>((set) => ({
  activeProjectId: null,
  selectedZoneId: null,
  zones: {},
  
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
      // Sync transfers to remove orphan transferIns
      return { zones: resolveZonesState(nextZones) };
    });
  },

  recalculateAirBalance: () => {
    // Resolve robustly applies logic to all zones
    set((state) => ({ zones: resolveZonesState(state.zones) }));
  }
}));
