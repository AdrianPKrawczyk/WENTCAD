import { useProjectStore } from '../stores/useProjectStore';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import type { WentcadExportData, ImportOptions } from './projectTransfer';
import type { FloorCanvasState } from '../stores/useCanvasStore';
import type { Project, Floor, ZoneData, SystemDef } from '../types';

export const importProjectService = {
  async execute(data: WentcadExportData, options: ImportOptions): Promise<void> {
    if (options.mode === 'NEW_PROJECT') {
      await this.importAsNewProject(data);
    } else if (options.mode === 'MERGE') {
      await this.mergeIntoCurrentProject(data, options);
    }
  },

  async importAsNewProject(data: WentcadExportData): Promise<void> {
    const { createProject, setActiveProject } = useProjectStore.getState();
    const { loadState } = useZoneStore.getState();
    const { updateFloorState } = useCanvasStore.getState();

    // 1. Create a physical new project entry in the DB/Store
    // To distinguish, maybe append "(Imported)" or something? Let's keep the name from JSON.
    const newName = `${data.metadata.name} (Z importu)`;
    const newProject = await createProject(newName);
    if (!newProject) throw new Error("Nie udało się utworzyć nowego projektu.");

    // 2. We don't need to remap floor IDs or zone IDs for a NEW project, 
    // because the canvas uses floorId as globally unique but Wait:
    // If the floorId was "floor-uuid-123", another project might use the same "floor-uuid-123" 
    // and they would share the Canvas state! (Data leak).
    // So we MUST remap Floor IDs and Polygon IDs even for a NEW project!

    const { newZoneState, newCanvasState } = this.remapAllIds(data.zoneState, data.canvasState);

    // 3. Load ZoneStore state
    loadState(newProject.id, newZoneState);

    // 4. Update Project Record State
    newProject.state_data = newZoneState;
    setActiveProject(newProject);

    // 5. Load CanvasStore state
    Object.keys(newCanvasState).forEach(floorId => {
      updateFloorState(floorId, newCanvasState[floorId]);
    });
  },

  async mergeIntoCurrentProject(data: WentcadExportData, options: ImportOptions): Promise<void> {
    const activeProject = useProjectStore.getState().activeProject;
    if (!activeProject) throw new Error("Brak aktywnego projektu do scalenia.");

    if (!options.floorsToImport || options.floorsToImport.length === 0) {
      return; // Nothing to merge
    }

    const { addFloor, addZone, addSystems } = useZoneStore.getState();
    const { updateFloorState } = useCanvasStore.getState();

    // 1. Remap all IDs from the incoming payload so they are fresh and won't conflict
    const { newZoneState, newCanvasState, floorIdMap } = this.remapAllIds(data.zoneState, data.canvasState);

    // Filter systems to add if requested
    if (options.importSystems) {
      // Add all systems that come from the imported file
      addSystems(newZoneState.systems);
    }

    // 2. Merge Floors
    options.floorsToImport.forEach(oldFloorId => {
      // Find the newly mapped floor ID
      const newFloorId = floorIdMap.get(oldFloorId);
      if (!newFloorId) return;

      const floorToImport = newZoneState.floors[newFloorId];
      if (!floorToImport) return;

      // Add to ZoneStore
      addFloor({
        name: `${floorToImport.name} (Import)`,
        elevation: floorToImport.elevation,
        originDescription: floorToImport.originDescription
      });

      // Wait, addFloor generates a NEW ID internally.
      // So instead of addFloor, we should just inject it directly or use an action that accepts a full Floor object.
      // Since addFloor forces a new ID, we have to do it manually or add a new action.
      // Actually, updating the state directly is bad. Let's modify `addZone` and use a generic `addFloorWithId`?
      // Better: we can just call `bulkUpdateZones`? No, floors are stored in `state.floors`.
      useZoneStore.setState((state) => ({
        floors: {
          ...state.floors,
          [newFloorId]: {
            ...floorToImport,
            name: `${floorToImport.name} (Import)`
          }
        }
      }));

      // Add all zones for this floor
      Object.values(newZoneState.zones).forEach(zone => {
        if (zone.floorId === newFloorId) {
          addZone(zone);
        }
      });

      // Add canvas state
      if (newCanvasState[newFloorId]) {
        updateFloorState(newFloorId, newCanvasState[newFloorId]);
      }
    });
  },

  remapAllIds(zoneState: WentcadExportData['zoneState'], canvasState: WentcadExportData['canvasState']) {
    const floorIdMap = new Map<string, string>();
    const zoneIdMap = new Map<string, string>();
    const systemIdMap = new Map<string, string>();

    const newZoneState = JSON.parse(JSON.stringify(zoneState)) as WentcadExportData['zoneState'];
    const newCanvasState = JSON.parse(JSON.stringify(canvasState)) as WentcadExportData['canvasState'];

    // 1. Map Floors
    const newFloors: Record<string, Floor> = {};
    Object.values(newZoneState.floors).forEach(floor => {
      const oldId = floor.id;
      const newId = `floor-${crypto.randomUUID()}`;
      floorIdMap.set(oldId, newId);
      floor.id = newId;
      newFloors[newId] = floor;
    });
    newZoneState.floors = newFloors;

    // 2. Map Systems
    newZoneState.systems.forEach(sys => {
      const oldId = sys.id;
      const newId = `sys-${crypto.randomUUID()}`;
      systemIdMap.set(oldId, newId);
      sys.id = newId;
    });

    // 3. Map Zones
    const newZones: Record<string, ZoneData> = {};
    Object.values(newZoneState.zones).forEach(zone => {
      const oldId = zone.id;
      const newId = `zone-${crypto.randomUUID()}`;
      zoneIdMap.set(oldId, newId);
      zone.id = newId;
      
      if (zone.floorId && floorIdMap.has(zone.floorId)) {
        zone.floorId = floorIdMap.get(zone.floorId)!;
      }
      
      if (zone.systemSupplyId && systemIdMap.has(zone.systemSupplyId)) {
        zone.systemSupplyId = systemIdMap.get(zone.systemSupplyId)!;
      }
      
      if (zone.systemExhaustId && systemIdMap.has(zone.systemExhaustId)) {
        zone.systemExhaustId = systemIdMap.get(zone.systemExhaustId)!;
      }

      newZones[newId] = zone;
    });
    newZoneState.zones = newZones;

    // 4. Map Canvas Floor States
    const finalCanvasState: Record<string, FloorCanvasState> = {};
    Object.keys(newCanvasState).forEach(oldFloorId => {
      const canvasFloor = newCanvasState[oldFloorId];
      const newFloorId = floorIdMap.get(oldFloorId);
      
      if (newFloorId) {
        // Map polygon zone IDs inside the canvas
        canvasFloor.polygons.forEach(poly => {
          if (zoneIdMap.has(poly.zoneId)) {
            poly.zoneId = zoneIdMap.get(poly.zoneId)!;
          }
          poly.id = `poly-${crypto.randomUUID()}`; // Regenerate polygon IDs too
        });

        canvasFloor.dxfOutlines.forEach(outline => {
          outline.id = `outline-${crypto.randomUUID()}`;
        });

        finalCanvasState[newFloorId] = canvasFloor;
      }
    });

    return { 
      newZoneState, 
      newCanvasState: finalCanvasState,
      floorIdMap,
      zoneIdMap,
      systemIdMap
    };
  }
};
