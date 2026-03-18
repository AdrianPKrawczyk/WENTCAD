import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { ZoneData, Floor, SystemDef, ProjectStateData, AnalysisPreset, StylePreset, GlobalTagSettings, TagFieldConfig, DxfExportSettings } from '../types';
import { DEFAULT_DXF_EXPORT_SETTINGS } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';

const DEFAULT_FLOOR_ID = 'floor-parter';

function createDefaultFloors(): Record<string, Floor> {
  return {
    [DEFAULT_FLOOR_ID]: { id: DEFAULT_FLOOR_ID, name: 'Parter', elevation: 0.0, order: 0 }
  };
}

const DEFAULT_TAG_FIELDS: TagFieldConfig[] = [
  { id: '1', type: 'ROOM_NR_NAME', enabled: true, prefix: '', suffix: '', order: 0, column: 1 },
  { id: '2', type: 'AREA', enabled: true, prefix: 'A: ', suffix: ' m²', order: 1, column: 1 },
  { id: '3', type: 'VOLUME', enabled: false, prefix: 'V: ', suffix: ' m³', order: 2, column: 1 },
  { id: '4', type: 'FLOW_SUPPLY', enabled: true, prefix: 'Vn: ', suffix: ' m³/h', order: 3, column: 2 },
  { id: '5', type: 'FLOW_EXHAUST', enabled: true, prefix: 'Vw: ', suffix: ' m³/h', order: 4, column: 2 },
  { id: '6', type: 'REAL_ACH', enabled: false, prefix: 'n: ', suffix: ' 1/h', order: 5, column: 2 },
  { id: '7', type: 'ACOUSTICS', enabled: false, prefix: 'Lp: ', suffix: ' dB(A)', order: 6, column: 2 },
  { id: '8', type: 'SUPPLY_SYSTEM_NAME', enabled: false, prefix: 'Sys N: ', suffix: '', order: 7, column: 2 },
  { id: '9', type: 'EXHAUST_SYSTEM_NAME', enabled: false, prefix: 'Sys W: ', suffix: '', order: 8, column: 2 },
  { id: '10', type: 'INTERNAL_TEMP', enabled: false, prefix: 't: ', suffix: ' °C', order: 9, column: 1 },
  { id: '11', type: 'OCCUPANTS', enabled: false, prefix: 'Osób: ', suffix: '', order: 10, column: 1 },
  { id: '12', type: 'HEAT_GAINS', enabled: false, prefix: 'Q: ', suffix: ' W', order: 11, column: 1 },
];

const DEFAULT_TAG_SETTINGS: GlobalTagSettings = {
  fontSize: 10,
  fillColor: '#ffffff',
  strokeColor: '#cbd5e1',
  isFixedSize: true,
  fields: DEFAULT_TAG_FIELDS,
};

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
  clearZoneGeometry: (id: string) => void;
  checkedZoneIds: string[];
  setCheckedZoneIds: (ids: string[]) => void;
  showZonesOnCanvas: boolean;
  toggleShowZonesOnCanvas: () => void;
  hiddenSystemIdsOnCanvas: string[];
  toggleSystemVisibility: (systemId: string) => void;
  isZoneFilterPanelOpen: boolean;
  setZoneFilterPanelOpen: (open: boolean) => void;
  globalPatternScale: number;
  setGlobalPatternScale: (scale: number) => void;
  linkingZoneId: string | null;
  setLinkingZoneId: (id: string | null) => void;
  selectedDxfOutlineId: string | null;
  setSelectedDxfOutlineId: (id: string | null) => void;
  globalTagSettings: GlobalTagSettings;
  updateGlobalTagSettings: (settings: Partial<GlobalTagSettings>) => void;
  dxfExportSettings: DxfExportSettings;
  setDxfFontHeight: (height: number) => void;
  setDxfLineSpacing: (spacing: number) => void;
  setDxfPaddingX: (padding: number) => void;
  setDxfPaddingY: (padding: number) => void;
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
      checkedZoneIds: [],
      showZonesOnCanvas: true,
      hiddenSystemIdsOnCanvas: [],
      isZoneFilterPanelOpen: false,
      globalPatternScale: 1.0,
      linkingZoneId: null,
      selectedDxfOutlineId: null,
      globalTagSettings: DEFAULT_TAG_SETTINGS,
      dxfExportSettings: DEFAULT_DXF_EXPORT_SETTINGS,
      
      setColumnState: (state) => set({ columnState: state }),
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
      setActiveFloor: (floorId) => set({ activeFloorId: floorId }),
      setCheckedZoneIds: (ids) => set({ checkedZoneIds: ids }),
      toggleShowZonesOnCanvas: () => set((s) => ({ showZonesOnCanvas: !s.showZonesOnCanvas })),
      toggleSystemVisibility: (systemId) => set((s) => {
        const hidden = s.hiddenSystemIdsOnCanvas.includes(systemId)
          ? s.hiddenSystemIdsOnCanvas.filter(id => id !== systemId)
          : [...s.hiddenSystemIdsOnCanvas, systemId];
        return { hiddenSystemIdsOnCanvas: hidden };
      }),
      setZoneFilterPanelOpen: (open: boolean) => set({ isZoneFilterPanelOpen: open }),
      setGlobalPatternScale: (scale: number) => set({ globalPatternScale: scale }),
      setLinkingZoneId: (id: string | null) => set({ linkingZoneId: id }),
      setSelectedDxfOutlineId: (id: string | null) => set({ selectedDxfOutlineId: id }),
      updateGlobalTagSettings: (settings) => set((s) => ({
        globalTagSettings: { ...s.globalTagSettings, ...settings }
      })),
      setDxfFontHeight: (height: number) => set((s) => {
        const clampedHeight = Math.max(0.05, Math.min(0.5, height));
        return { dxfExportSettings: { ...s.dxfExportSettings, fontHeight: clampedHeight } };
      }),
      setDxfLineSpacing: (spacing: number) => set((s) => {
        const clampedSpacing = Math.max(0.25, Math.min(2.0, spacing));
        return { dxfExportSettings: { ...s.dxfExportSettings, lineSpacing: clampedSpacing } };
      }),
      setDxfPaddingX: (padding: number) => set((s) => {
        const clampedPadding = Math.max(0.2, Math.min(2.0, padding));
        return { dxfExportSettings: { ...s.dxfExportSettings, paddingX: clampedPadding } };
      }),
      setDxfPaddingY: (padding: number) => set((s) => {
        const clampedPadding = Math.max(0.1, Math.min(1.0, padding));
        return { dxfExportSettings: { ...s.dxfExportSettings, paddingY: clampedPadding } };
      }),

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
          activeFloorId: Object.keys(stateData.floors || {})[0] || 'floor-parter',
          globalPatternScale: stateData.globalPatternScale ?? 1.0,
          globalTagSettings: stateData.globalTagSettings || DEFAULT_TAG_SETTINGS
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

      removeAnalysisPreset: (id) => set((s) => ({ analysisPresets: s.analysisPresets.filter(p => p.id !== id) })),
      
      clearZoneGeometry: (id) => {
        const zone = get().zones[id];
        if (!zone) return;
        
        // 1. Update zone table data
        get().updateZone(id, { geometryArea: null });
        
        // 2. Clear canvas data (requires canvas store import or direct call if available)
        // Note: useCanvasStore is usually available in the same project
        import('./useCanvasStore').then(module => {
           module.useCanvasStore.getState().removePolygonByZoneId(zone.floorId, id);
        }).catch(() => {
           // Fallback if import is tricky, though it should work in Vite
        });
      }
    }),
    {
      name: 'wentcad-zone-storage',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            floors: persistedState.floors || createDefaultFloors(),
            activeFloorId: persistedState.activeFloorId || DEFAULT_FLOOR_ID
          };
        }
        // Migracja v2 -> v3: uzupełnienie brakujących pól dxfExportSettings
        if (version < 3) {
          const defaultDxfSettings = {
            fontHeight: 0.1,
            lineSpacing: 1.25,
            paddingX: 1.0,
            paddingY: 0.36,
          };
          return {
            ...persistedState,
            dxfExportSettings: {
              ...defaultDxfSettings,
              ...(persistedState.dxfExportSettings || {}),
            }
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
        globalSystemOpacity,
        globalPatternScale,
        globalTagSettings,
        dxfExportSettings
      } = state;
      return { 
        zones, 
        floors, 
        systems, 
        analysisPresets, 
        stylePresets, 
        isSystemColoringEnabled, 
        globalSystemOpacity,
        globalPatternScale,
        globalTagSettings,
        dxfExportSettings
      };
    },
  }
)
);
