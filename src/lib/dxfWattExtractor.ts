import type { OpeningInstance } from './wattTypes';

export interface ExtractedWattData {
  buildingFootprint: {
    outer: { x: number; y: number }[];
    courtyards: { x: number; y: number }[][];
  };
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
  const match = layerName.match(/_H(\d+)(?:_Ho(\d+))?/i);
  
  if (!match) {
    return { height: 1.5, sillHeight: 0.9 }; // Default 1.5m window, 0.9m sill
  }

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
  courtyardLayers: string[],
  windowLayers: string[]
): ExtractedWattData {
  const footprint: ExtractedWattData['buildingFootprint'] = { outer: [], courtyards: [] };
  const windows: OpeningInstance[] = [];

  console.log('[WATT] extractWattTopology starting...', {
    entities: dxf?.entities?.length,
    footprintLayers,
    windowLayers
  });

  if (!dxf || !dxf.entities) return { buildingFootprint: footprint, windows };

  let windowIdCounter = 1;

  dxf.entities.forEach((ent: any) => {
    // OUTER FOOTPRINT
    if (footprintLayers.includes(ent.layer)) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        // Obrys budynku nie musi być zamknięty de jure, ale de facto powinien tworzyć pętlę
        if (ent.vertices.length >= 3) {
           if (footprint.outer.length === 0) {
              console.log(`[WATT] Detected Footprint on layer: ${ent.layer}, points: ${ent.vertices.length}`);
              footprint.outer = ent.vertices.map((v: any) => ({ x: v.x, y: v.y }));
           }
        }
      }
    }

    // COURTYARDS (Inner holes)
    if (courtyardLayers.includes(ent.layer)) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        if (ent.vertices.length >= 3) {
           footprint.courtyards.push(ent.vertices.map((v: any) => ({ x: v.x, y: v.y })));
        }
      }
    }

    // WINDOWS
    if (windowLayers.includes(ent.layer)) {
      // Relaxed vertex check: 4 (unclosed rect) or 5 (closed rect explicitly)
      // or even more if drawn poorly but still rectangular
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        const vCount = ent.vertices.length;
        if (vCount >= 3) {
          const v = ent.vertices;
          
          // Calculate bounding box or simple distance
          // For windows we usually expect 4 vertices forming a rectangle
          // but we take first 4 to avoid issues with 5th point = 1st point
          const d1 = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y);
          const d2 = vCount >= 3 ? Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y) : 0;
          const width = Math.max(d1, d2); 

          // Centroid
          let sumX = 0, sumY = 0;
          ent.vertices.forEach((p: any) => { sumX += p.x; sumY += p.y; });
          const cx = sumX / vCount;
          const cy = sumY / vCount;

          const meta = parseWindowMetadata(ent.layer);
          console.log(`[WATT] Detected Window: ${ent.layer}, w=${width.toFixed(2)}, h=${meta.height}`);

          windows.push({
            id: `win-${windowIdCounter++}`,
            width: width,
            height: meta.height,
            sillHeight: meta.sillHeight,
            placement: 0, 
            centroid: { x: cx, y: cy }
          });
        }
      }
    }
  });

  return { buildingFootprint: footprint, windows };
}
