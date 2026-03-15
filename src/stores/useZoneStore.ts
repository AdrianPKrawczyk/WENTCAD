import { create } from 'zustand';
import type { ZoneData } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';

interface ZoneStore {
  zones: Record<string, ZoneData>;
  addZone: (zone: ZoneData) => void;
  updateZone: (id: string, updates: Partial<ZoneData>) => void;
  removeZone: (id: string) => void;
  recalculateAirBalance: (id: string) => void;
}

export const useZoneStore = create<ZoneStore>((set, get) => ({
  zones: {},
  
  addZone: (zone) => {
    set((state) => ({
      zones: { ...state.zones, [zone.id]: zone }
    }));
    get().recalculateAirBalance(zone.id);
  },

  updateZone: (id, updates) => {
    set((state) => {
      const existingZone = state.zones[id];
      if (!existingZone) return state;
      return {
        zones: {
          ...state.zones,
          [id]: { ...existingZone, ...updates }
        }
      };
    });
    // Zawsze recalculate po update
    get().recalculateAirBalance(id);
  },

  removeZone: (id) => {
    set((state) => {
      const newZones = { ...state.zones };
      delete newZones[id];
      return { zones: newZones };
    });
  },

  recalculateAirBalance: (id) => {
    set((state) => {
      const zone = state.zones[id];
      if (!zone) return state;

      const { calculatedVolume, realACH } = calculateZoneAirBalance(zone);
      
      // Optymalizacja renderów Reacta - nie nadpisuj jeśli wyniki równe
      if (zone.calculatedVolume === calculatedVolume && zone.realACH === realACH) {
        return state;
      }

      return {
        zones: {
          ...state.zones,
          [id]: { ...zone, calculatedVolume, realACH } // Only override computed results
        }
      };
    });
  }
}));
