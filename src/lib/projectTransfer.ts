import { useProjectStore } from '../stores/useProjectStore';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import type { Project, ProjectStateData } from '../types';
import type { FloorCanvasState } from '../stores/useCanvasStore';

export interface WentcadExportData {
  version: string;
  metadata: {
    id: string;
    name: string;
    createdAt: string;
    exportedAt: string;
  };
  zoneState: ProjectStateData;
  canvasState: Record<string, FloorCanvasState>;
}

export function exportCurrentProjectData(): WentcadExportData | null {
  const activeProject = useProjectStore.getState().activeProject;
  if (!activeProject) return null;

  const zoneStateRaw = useZoneStore.getState();
  
  // Build ProjectStateData from live ZoneStore
  const zoneState: ProjectStateData = {
    floors: zoneStateRaw.floors,
    zones: zoneStateRaw.zones,
    systems: zoneStateRaw.systems,
    analysisPresets: zoneStateRaw.analysisPresets,
    stylePresets: zoneStateRaw.stylePresets,
    isSystemColoringEnabled: zoneStateRaw.isSystemColoringEnabled,
    globalSystemOpacity: zoneStateRaw.globalSystemOpacity,
    columnState: zoneStateRaw.columnState,
    globalPatternScale: zoneStateRaw.globalPatternScale,
    globalTagSettings: zoneStateRaw.globalTagSettings,
  };

  const allCanvasFloors = useCanvasStore.getState().floors;
  const projectCanvasFloors: Record<string, FloorCanvasState> = {};
  
  // Extract only canvas states for the floors that belong to this project
  Object.keys(zoneState.floors).forEach(floorId => {
    if (allCanvasFloors[floorId]) {
      projectCanvasFloors[floorId] = allCanvasFloors[floorId];
    }
  });

  return {
    version: "1.0",
    metadata: {
      id: activeProject.id,
      name: activeProject.name,
      createdAt: activeProject.created_at,
      exportedAt: new Date().toISOString()
    },
    zoneState,
    canvasState: projectCanvasFloors
  };
}

export function downloadProjectFile(data: WentcadExportData, filename?: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = filename || `${data.metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  link.download = `${safeName}.wentcad`;
  link.href = url;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProjectFromDashboard(project: Project): WentcadExportData | null {
  if (!project) return null;

  const zoneState = project.state_data;
  const allCanvasFloors = useCanvasStore.getState().floors;
  const projectCanvasFloors: Record<string, FloorCanvasState> = {};
  
  if (zoneState.floors) {
    Object.keys(zoneState.floors).forEach(floorId => {
      if (allCanvasFloors[floorId]) {
        projectCanvasFloors[floorId] = allCanvasFloors[floorId];
      }
    });
  }

  return {
    version: "1.0",
    metadata: {
      id: project.id,
      name: project.name,
      createdAt: project.created_at,
      exportedAt: new Date().toISOString()
    },
    zoneState,
    canvasState: projectCanvasFloors
  };
}

export interface ImportOptions {
  mode: 'NEW_PROJECT' | 'MERGE';
  floorsToImport?: string[];
  importSystems?: boolean;
}

export async function parseProjectFile(file: File): Promise<WentcadExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.version || !json.metadata || !json.zoneState) {
          throw new Error('Nieprawidłowy lub uszkodzony plik projektu WENTCAD.');
        }
        resolve(json as WentcadExportData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Błąd odczytu pliku.'));
    reader.readAsText(file);
  });
}
