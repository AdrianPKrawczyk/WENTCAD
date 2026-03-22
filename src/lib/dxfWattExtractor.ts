import type { OpeningInstance } from './wattTypes';

export interface ExtractedWattData {
  buildingFootprint: { x: number; y: number }[][];
  windows: OpeningInstance[];
}

export interface WindowMetadata {
  height: number;
  sillHeight: number;
}

/**
 * Parses layer name to extract Window Height (H) and Sill Height (Ho)
 * Expected pattern: "ANYNAME_H2000_Ho900" or "WINDOWS_H1500" (cm or mm values, returned as meters)
 */
export function parseWindowMetadata(layerName: string): WindowMetadata {
  // Matches _H followed by numbers, optionally followed by _Ho and numbers
  const match = layerName.match(/_H(\d+)(?:_Ho(\d+))?/i);
  
  if (!match) {
    return { height: 1.5, sillHeight: 0.9 }; // Default 1.5m window, 0.9m sill
  }

  // Value is assumed to be in mm or cm. Let's convert to meters.
  // Standard CAD values for 1.5m are usually 1500 (mm) or 150 (cm).
  const hRaw = parseInt(match[1], 10);
  const hMeters = hRaw > 300 ? hRaw / 1000 : (hRaw > 30 ? hRaw / 100 : hRaw);
  
  let hoMeters = 0.9;
  if (match[2]) {
    const hoRaw = parseInt(match[2], 10);
    hoMeters = hoRaw > 300 ? hoRaw / 1000 : (hoRaw > 30 ? hoRaw / 100 : hoRaw);
  }

  return { height: hMeters, sillHeight: hoMeters };
}

/**
 * Extracts WATT topology data (footprint and windows) from parsed DXF structure
 */
export function extractWattTopology(
  dxf: any,
  footprintLayers: string[],
  windowLayers: string[]
): ExtractedWattData {
  const footprint: { x: number; y: number }[][] = [];
  const windows: OpeningInstance[] = [];

  if (!dxf || !dxf.entities) return { buildingFootprint: footprint, windows };

  let windowIdCounter = 1;

  dxf.entities.forEach((ent: any) => {
    // Check if layer belongs to footprint
    if (footprintLayers.includes(ent.layer)) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        if (ent.closed || ent.shape) {
           footprint.push(ent.vertices.map((v: any) => ({ x: v.x, y: v.y })));
        }
      }
    }

    // Check if layer belongs to windows
    if (windowLayers.includes(ent.layer)) {
      // Look for closed 4-vertex polylines
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices && (ent.closed || ent.shape)) {
        // Standard rectangle has 4 points
        if (ent.vertices.length === 4) {
          const v = ent.vertices;
          
          // Calculate lengths of two adjacent edges to find width
          const d1 = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y);
          const d2 = Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y);
          const width = Math.max(d1, d2); // Window width B is always the longer side of the rect

          // Calculate Centroid (average of 4 points)
          const cx = (v[0].x + v[1].x + v[2].x + v[3].x) / 4;
          const cy = (v[0].y + v[1].y + v[2].y + v[3].y) / 4;

          const meta = parseWindowMetadata(ent.layer);

          windows.push({
            id: `win-${windowIdCounter++}`,
            width: width,
            height: meta.height,
            sillHeight: meta.sillHeight,
            placement: 0, // Computed later in Step 3 (Topology Engine)
            centroid: { x: cx, y: cy }
          });
        }
      }
    }
  });

  return { buildingFootprint: footprint, windows };
}
