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
  type: 'WINDOW' | 'DOOR';
}

/**
 * Parses layer name to extract Window Height (H) and Sill Height (Ho)
 * Expected patterns: 
 * "OKNO_H1500_Ho900" -> 1.5m, 0.9m
 * "OKNO_H150cm_Ho90cm" -> 1.5m, 0.9m
 * "OKNO_H1.5_Ho0.9" -> 1.5m, 0.9m
 */
export function parseWindowMetadata(layerName: string): WindowMetadata {
  const match = layerName.match(/_H([\d.]+)(?:cm|mm)?(?:_Ho([\d.]+)(?:cm|mm)?)?/i);
  const isDoor = layerName.toLowerCase().includes('drzwi') || layerName.toLowerCase().includes('door');
  const type: 'WINDOW' | 'DOOR' = isDoor ? 'DOOR' : 'WINDOW';
  
  if (!match) {
    return { 
      height: isDoor ? 2.0 : 1.5, 
      sillHeight: isDoor ? 0.0 : 0.9, 
      type 
    };
  }

  const parseVal = (valStr: string, defaultVal: number) => {
    if (!valStr) return defaultVal;
    const val = parseFloat(valStr);
    // Detection logic:
    // > 300 -> assume mm
    // > 10 -> assume cm
    // <= 10 -> assume meters
    if (val > 300) return val / 1000;
    if (val > 10) return val / 100;
    return val;
  };

  const hMeters = parseVal(match[1], isDoor ? 2.0 : 1.5);
  const hoMeters = parseVal(match[2], isDoor ? 0.0 : 0.9);

  return { height: hMeters, sillHeight: hoMeters, type };
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
            centroid: { x: cx, y: cy },
            type: meta.type
          });
        }
      }
    }
  });

  return { buildingFootprint: footprint, windows };
}
