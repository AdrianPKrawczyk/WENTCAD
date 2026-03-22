import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { ZoneData, Floor, SystemDef, ProjectStateData, AnalysisPreset, StylePreset, GlobalTagSettings, TagFieldConfig, DxfExportSettings, OpeningInstance } from '../types';
import type { IfcMaterial, IfcMaterialLayerSet, IfcWallType, IfcWindowStyle } from '../lib/wattTypes';
import { DEFAULT_DXF_EXPORT_SETTINGS } from '../types';
import { calculateZoneAirBalance } from '../lib/PhysicsEngine';
import { checkAdjacency, checkBoundary, snapOpeningsToEdges } from '../lib/geometryUtils/topology';
import { calculateHorizontalBoundaries } from '../lib/geometryUtils/verticalAnalysis';
import { useCanvasStore } from './useCanvasStore';

function syncTerminalsFromZones() {
  import('./useDuctStore').then(({ useDuctStore }) => {
    const ductState = useDuctStore.getState();
    const zoneState = useZoneStore.getState();
    
    const terminals = Object.values(ductState.nodes).filter(
      node => node.componentCategory === 'TERMINAL' && node.zoneId
    );
    
    const nodeUpdates: Record<string, Partial<any>> = {};
    
    terminals.forEach(terminal => {
      const zone = zoneState.zones[terminal.zoneId!];
      if (zone) {
        const terminalsInZone = Object.values(ductState.nodes).filter(
          n => n.componentCategory === 'TERMINAL' && n.zoneId === zone.id && n.systemId === terminal.systemId
        );
        const count = terminalsInZone.length;
        const fraction = terminal.flowFraction ?? 1;
        
        let terminalFlow = 0;
        if (terminal.systemId && zone.systemSupplyId && zone.systemSupplyId === terminal.systemId) {
          terminalFlow = (zone.calculatedVolume || 0) / (count || 1);
        } else if (terminal.systemId && zone.systemExhaustId && zone.systemExhaustId === terminal.systemId) {
          terminalFlow = (zone.calculatedExhaust || 0) / (count || 1);
        }
        
        const targetFlow = terminalFlow * fraction;
        if (Math.abs((terminal.flow || 0) - targetFlow) > 0.1) {
          nodeUpdates[terminal.id] = { flow: targetFlow };
        }
      }
    });
    
    if (Object.keys(nodeUpdates).length > 0) {
      useDuctStore.getState().bulkUpdateNodes(nodeUpdates);
    }
  }).catch(() => {});
}

function createDefaultFloors(): Record<string, Floor> {
  const id = `floor-${crypto.randomUUID()}`;
  return {
    [id]: { 
      id, 
      name: 'Parter', 
      elevation: 0.0, 
      order: 0,
      heightTotal: 3.5,
      heightNet: 3.0,
      heightSuspended: 2.7
    }
  };
}

const DEFAULT_TAG_FIELDS: TagFieldConfig[] = [
  { id: '1', type: 'ROOM_NR_NAME', enabled: true, prefix: '', suffix: '', order: 0, column: 1 },
  { id: '2', type: 'AREA', enabled: true, prefix: 'A: ', suffix: ' m²', order: 1, column: 1 },
  { id: '3', type: 'VOLUME', enabled: false, prefix: 'V: ', suffix: ' m³', order: 2, column: 1 },
  { id: '4', type: 'FLOW_SUPPLY_WITH_SYSTEM', enabled: true, prefix: '', suffix: ' m³/h', order: 3, column: 2 },
  { id: '5', type: 'FLOW_EXHAUST_WITH_SYSTEM', enabled: true, prefix: '', suffix: ' m³/h', order: 4, column: 2 },
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

    // Sync Volume based on Manual Flag
    const geometryVolume = finalArea * (zone.height || 0);
    let finalVolume = zone.isVolumeManual
      ? (zone.manualVolume || 0)
      : geometryVolume;
    
    finalVolume = Math.round(finalVolume * 100) / 100;
    const roundedManualVolume = Math.round((zone.manualVolume || 0) * 100) / 100;

    const updatedZone = { 
      ...zone, 
      area: finalArea, 
      manualArea: roundedManualArea,
      volume: finalVolume,
      manualVolume: roundedManualVolume,
      geometryVolume: Math.round(geometryVolume * 100) / 100
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
      updatedZone.area !== finalArea ||
      updatedZone.volume !== results.volume // Check if volume changed
    ) {
      newZones[id] = { ...updatedZone, ...results };
    }
  });

  return newZones;
}

import materialsData from '../data/materials.json';

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
  addFloor: (floor: Omit<Floor, 'id' | 'order' | 'heightTotal' | 'heightNet' | 'heightSuspended'>) => string;
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
  
  // WATT Properties
  buildingFootprint: { outer: { x: number; y: number }[]; courtyards: { x: number; y: number }[][] };
  materials: Record<string, IfcMaterial>;
  layerSets: Record<string, IfcMaterialLayerSet>;
  wallTypes: Record<string, IfcWallType>;
  windowStyles: Record<string, IfcWindowStyle>;
  wallTypeTemplates: IfcWallType[]; // Global presets
  pendingWindows: OpeningInstance[]; 
 // Loose windows from DXF awaiting topology assignment
  northAzimuth: number;
  setBuildingFootprint: (footprint: { outer: { x: number; y: number }[]; courtyards: { x: number; y: number }[][] }) => void;
  setPendingWindows: (windows: OpeningInstance[]) => void;
  setNorthAzimuth: (azimuth: number) => void;
  updateZoneTopology: (zoneId: string) => void;
  analyzeAllZones: () => void;
  
  // WATT Actions
  addMaterial: (material: IfcMaterial) => void;
  updateMaterial: (id: string, updates: Partial<IfcMaterial>) => void;
  removeMaterial: (id: string) => void;
  addLayerSet: (layerSet: IfcMaterialLayerSet) => void;
  updateLayerSet: (id: string, updates: Partial<IfcMaterialLayerSet>) => void;
  removeLayerSet: (id: string) => void;
  addWallType: (wallType: IfcWallType) => void;
  updateWallType: (id: string, updates: Partial<IfcWallType>) => void;
  removeWallType: (id: string) => void;
  addWallTypeTemplate: (template: IfcWallType) => void;
  removeWallTypeTemplate: (id: string) => void;
  
  addWindowStyle: (style: IfcWindowStyle) => void;
  updateWindowStyle: (id: string, updates: Partial<IfcWindowStyle>) => void;
  removeWindowStyle: (id: string) => void;
  
  // WATT UI State
  selectedBoundaryId: string | null;
  setSelectedBoundaryId: (id: string | null) => void;
  selectedHorizontalBoundaryId: string | null;
  setSelectedHorizontalBoundaryId: (id: string | null) => void;
}

export const useZoneStore = create<ZoneStore>()(
  temporal(
    persist(
    (set, get) => {
      const initialFloors = createDefaultFloors();
      const initialFloorId = Object.keys(initialFloors)[0];
      
      return {
        activeProjectId: null,
        selectedZoneId: null,
        activeFloorId: initialFloorId,
        zones: {},
        floors: initialFloors,
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
      
      // WATT Initial State
      buildingFootprint: { outer: [], courtyards: [] },
      materials: materialsData.reduce((acc, mat) => ({ ...acc, [mat.id]: mat }), {}),
      layerSets: {},
      wallTypes: {},
      windowStyles: {},
      wallTypeTemplates: [],
      pendingWindows: [],
      northAzimuth: 0,
      selectedBoundaryId: null,
      selectedHorizontalBoundaryId: null,
      
      setBuildingFootprint: (footprint) => set({ buildingFootprint: footprint }),
      setPendingWindows: (windows) => set({ pendingWindows: windows }),
      setNorthAzimuth: (azimuth) => set({ northAzimuth: azimuth }),
      setSelectedBoundaryId: (id) => set({ selectedBoundaryId: id }),
      setSelectedHorizontalBoundaryId: (id) => set({ selectedHorizontalBoundaryId: id }),

      addMaterial: (material) => set(s => ({ materials: { ...s.materials, [material.id]: material } })),
      updateMaterial: (id, updates) => set(s => ({ 
        materials: { ...s.materials, [id]: { ...s.materials[id], ...updates } } 
      })),
      removeMaterial: (id) => set(s => {
        const next = { ...s.materials };
        delete next[id];
        return { materials: next };
      }),

      addLayerSet: (layerSet) => set(s => ({ layerSets: { ...s.layerSets, [layerSet.id]: layerSet } })),
      updateLayerSet: (id, updates) => set(s => ({ 
        layerSets: { ...s.layerSets, [id]: { ...s.layerSets[id], ...updates } } 
      })),
      removeLayerSet: (id) => set(s => {
        const next = { ...s.layerSets };
        delete next[id];
        return { layerSets: next };
      }),

      addWallType: (wallType) => set(s => ({ wallTypes: { ...s.wallTypes, [wallType.id]: wallType } })),
      updateWallType: (id, updates) => set(s => ({ 
        wallTypes: { ...s.wallTypes, [id]: { ...s.wallTypes[id], ...updates } } 
      })),
      removeWallType: (id) => set(s => {
        const next = { ...s.wallTypes };
        delete next[id];
        return { wallTypes: next };
      }),
      
      addWindowStyle: (style: IfcWindowStyle) => set(s => ({ windowStyles: { ...s.windowStyles, [style.id]: style } })),
      updateWindowStyle: (id: string, updates: Partial<IfcWindowStyle>) => set(s => ({ 
        windowStyles: { ...s.windowStyles, [id]: { ...s.windowStyles[id], ...updates } } 
      })),
      removeWindowStyle: (id: string) => set(s => {
        const next = { ...s.windowStyles };
        delete next[id];
        return { windowStyles: next };
      }),

      addWallTypeTemplate: (template) => set(s => ({ 
        wallTypeTemplates: [...s.wallTypeTemplates, template] 
      })),
      removeWallTypeTemplate: (id) => set(s => ({ 
        wallTypeTemplates: s.wallTypeTemplates.filter(t => t.id !== id) 
      })),



      updateZoneTopology: (zoneId) => {
        const state = get();
        const zone = state.zones[zoneId];
        if (!zone) return;

        const canvasState = useCanvasStore.getState();
        const floorCanvas = canvasState.floors[zone.floorId];
        if (!floorCanvas || !floorCanvas.polygons) return;

        // Find polygon points for this zone
        const poly = floorCanvas.polygons.find(p => p.zoneId === zoneId);
        if (!poly) return;

        // Convert flat points [x1,y1, x2,y2] to vertices [{x,y}]
        const vertices: {x:number, y:number}[] = [];
        for (let i = 0; i < poly.points.length; i += 2) {
          vertices.push({ x: poly.points[i], y: poly.points[i+1] });
        }

        // Prepare other zones on same floor for adjacency check
        const otherZonesOnFloor = Object.values(state.zones)
          .filter(z => z.id !== zoneId && z.floorId === zone.floorId)
          .map(z => {
            const otherPoly = floorCanvas.polygons.find(p => p.zoneId === z.id);
            if (!otherPoly) return null;
            const otherVerts: {x:number, y:number}[] = [];
            for (let i = 0; i < otherPoly.points.length; i += 2) {
              otherVerts.push({ x: otherPoly.points[i], y: otherPoly.points[i+1] });
            }
            return { ...z, _vertices: otherVerts };
          })
          .filter(Boolean) as any[];

        // 1. Detect Interior Adjacency
        const mockedZoneWithVerts = { ...zone, _vertices: vertices };
        const scaleFactor = floorCanvas.scaleFactor || 1.0;
        
        let boundaries = checkAdjacency(mockedZoneWithVerts, otherZonesOnFloor, scaleFactor);

        // 2. Detect Exterior Boundaries (Building Footprint)
        if (state.buildingFootprint && state.buildingFootprint.outer && state.buildingFootprint.outer.length > 0) {
          boundaries = checkBoundary(boundaries, state.buildingFootprint);
        }

        // 3. Snap Windows from pending list
        if (state.pendingWindows && state.pendingWindows.length > 0) {
          boundaries = snapOpeningsToEdges(boundaries, state.pendingWindows);
        }

        // 4. Vertical Analysis (Horizontal Boundaries)
        const allFloorArray = Object.values(state.floors).sort((a, b) => a.order - b.order);
        const currentIndex = allFloorArray.findIndex(f => f.id === zone.floorId);
        
        const floorAbove = currentIndex < allFloorArray.length - 1 ? allFloorArray[currentIndex + 1] : null;
        const floorBelow = currentIndex > 0 ? allFloorArray[currentIndex - 1] : null;

        const zonesAbove = floorAbove ? Object.values(state.zones)
          .filter(z => z.floorId === floorAbove.id)
          .map(z => {
             const p = canvasState.floors[floorAbove.id]?.polygons?.find(poly => poly.zoneId === z.id);
             if (!p) return null;
             const v: {x:number, y:number}[] = [];
             for (let i = 0; i < p.points.length; i += 2) v.push({ x: p.points[i], y: p.points[i+1] });
             return { ...z, _vertices: v };
          }).filter(Boolean) : [];

        const zonesBelow = floorBelow ? Object.values(state.zones)
          .filter(z => z.floorId === floorBelow.id)
          .map(z => {
             const p = canvasState.floors[floorBelow.id]?.polygons?.find(poly => poly.zoneId === z.id);
             if (!p) return null;
             const v: {x:number, y:number}[] = [];
             for (let i = 0; i < p.points.length; i += 2) v.push({ x: p.points[i], y: p.points[i+1] });
             return { ...z, _vertices: v };
          }).filter(Boolean) : [];

        const horizontalBoundaries = calculateHorizontalBoundaries(
          mockedZoneWithVerts,
          state.floors,
          zonesBelow,
          zonesAbove,
          scaleFactor,
          state.buildingFootprint
        );

        set(s => ({
          zones: {
            ...s.zones,
            [zoneId]: { ...zone, boundaries, horizontalBoundaries }
          }
        }));
      },
      
      setColumnState: (state) => set({ columnState: state }),
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      setSelectedZone: (zoneId) => set({ selectedZoneId: zoneId }),
      setActiveFloor: (floorId) => set((state) => {
        if (!state.floors[floorId]) {
          console.warn(`Floor ${floorId} not found, choosing first available.`);
          const firstFloor = Object.keys(state.floors)[0];
          return { activeFloorId: firstFloor || floorId };
        }
        return { activeFloorId: floorId };
      }),
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
          const resolved = resolveZonesState(nextZones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
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
          const resolved = resolveZonesState(nextZones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
        });
      },

      removeZone: (id) => {
        set((state) => {
          const nextZones = { ...state.zones };
          delete nextZones[id];
          Object.keys(nextZones).forEach(zId => {
            if (nextZones[zId]) {
              nextZones[zId].transferOut = nextZones[zId].transferOut.filter(t => t.roomId !== id);
            }
          });
          const resolved = resolveZonesState(nextZones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
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
          const resolved = resolveZonesState(nextZones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
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
          const resolved = resolveZonesState(nextZones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
        });
      },

      recalculateAirBalance: () => {
        set((state) => {
          const resolved = resolveZonesState(state.zones);
          setTimeout(() => syncTerminalsFromZones(), 0);
          return { zones: resolved };
        });
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
        // Sanitize floors to ensure new height properties exist
        const loadedFloors = stateData.floors || {};
        const sanitizedFloors: Record<string, Floor> = {};
        Object.entries(loadedFloors).forEach(([id, floor]) => {
          sanitizedFloors[id] = {
            ...floor,
            heightTotal: floor.heightTotal ?? 3.5,
            heightNet: floor.heightNet ?? 3.0,
            heightSuspended: floor.heightSuspended ?? 2.7
          };
        });

        set({
          activeProjectId: projectId,
          zones: resolveZonesState(stateData.zones || {}),
          floors: sanitizedFloors,
          systems: stateData.systems || [],
          analysisPresets: stateData.analysisPresets || [],
          stylePresets: stateData.stylePresets || [],
          isSystemColoringEnabled: stateData.isSystemColoringEnabled ?? false,
          globalSystemOpacity: stateData.globalSystemOpacity ?? 20,
          columnState: stateData.columnState ?? null,
          activeFloorId: Object.keys(stateData.floors || {})[0] || `floor-${crypto.randomUUID()}`,
          globalPatternScale: stateData.globalPatternScale ?? 1.0,
          globalTagSettings: stateData.globalTagSettings || DEFAULT_TAG_SETTINGS,
          
          // WATT State
          buildingFootprint: stateData.buildingFootprint || { outer: [], courtyards: [] },
          materials: stateData.materials || materialsData.reduce((acc, mat) => ({ ...acc, [mat.id]: mat }), {}),
          layerSets: stateData.layerSets || {},
          wallTypes: stateData.wallTypes || {},
          windowStyles: stateData.windowStyles || {},
          wallTypeTemplates: stateData.wallTypeTemplates || [],
          pendingWindows: stateData.pendingWindows || [],
          northAzimuth: stateData.northAzimuth || 0
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
        const floorsArray = Object.values(state.floors).sort((a, b) => a.order - b.order);
        const lastFloor = floorsArray.length > 0 ? floorsArray[floorsArray.length - 1] : null;
        
        const maxOrder = lastFloor ? lastFloor.order : -1;
        const autoElevation = lastFloor ? (lastFloor.elevation + (lastFloor.heightTotal || 3.5)) : 0;

        const newFloor: Floor = {
          id: `floor-${Date.now()}`,
          name: floorData.name,
          elevation: autoElevation,
          order: maxOrder + 1,
          originDescription: (floorData as any).originDescription || "",
          heightTotal: 3.5,
          heightNet: 3.0,
          heightSuspended: 2.7
        };
        set((s) => ({ floors: { ...s.floors, [newFloor.id]: newFloor } }));
        return newFloor.id;
      },

      updateFloor: (id, updates) => {
        set((state) => {
          if (!state.floors[id]) return state;
          const nextFloors = {
            ...state.floors,
            [id]: { ...state.floors[id], ...updates }
          };

          // Re-calculate elevations for floors above if heightTotal changed
          if (updates.heightTotal !== undefined) {
             const sorted = Object.values(nextFloors).sort((a, b) => a.order - b.order);
             let currentElev = sorted[0].elevation;
             sorted.forEach((f, idx) => {
                if (idx > 0) {
                   f.elevation = currentElev;
                }
                currentElev += f.heightTotal;
             });
          }

          return { floors: nextFloors };
        });
      },

      analyzeAllZones: () => {
        const state = get();
        Object.keys(state.zones).forEach(id => {
           state.updateZoneTopology(id);
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
    };
  },
  {
      name: 'wentcad-zone-storage',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            floors: persistedState.floors || createDefaultFloors(),
            activeFloorId: persistedState.activeFloorId || Object.keys(persistedState.floors || {})[0] || `floor-${crypto.randomUUID()}`
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
        dxfExportSettings,
        buildingFootprint,
        materials,
        layerSets,
        wallTypes,
        windowStyles,
        pendingWindows
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
        dxfExportSettings,
        buildingFootprint,
        materials,
        layerSets,
        wallTypes,
        windowStyles,
        pendingWindows
      };
    },
  }
)
);
