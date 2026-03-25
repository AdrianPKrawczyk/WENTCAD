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
  const isDoor = layerName.toLowerCase().includes('drzwi') || layerName.toLowerCase().includes('door');
  const type: 'WINDOW' | 'DOOR' = isDoor ? 'DOOR' : 'WINDOW';

  // Use more robust individual matches (look for S, H, Ho anywhere after a boundary)
  // Boundary is start of string, underscore, hyphen or space
  const boundary = '(?:^|[\\s_-])';
  // Capture value and optional unit
  const heightMatch = layerName.match(new RegExp(`${boundary}H(\\d+(\\.\\d+)?)(cm|mm)?(?![oO])`, 'i'));
  const sillMatch = layerName.match(new RegExp(`${boundary}Ho(\\d+(\\.\\d+)?)(cm|mm)?`, 'i'));
  
  // Also support WxH format (e.g. 90x200)
  const dimMatch = layerName.match(/(\d+)x(\d+)/i);

  const parseVal = (valStr: string | undefined, unit: string | undefined, defaultVal: number) => {
    if (!valStr) return defaultVal;
    const val = parseFloat(valStr);
    const u = unit?.toLowerCase();

    // 1. Explicit unit
    if (u === 'mm') return val / 1000;
    if (u === 'cm') return val / 100;
    
    // 2. Auto-detect if no unit
    // > 500 -> assume mm (e.g. 1500 -> 1.5m, but 500 could be 500mm=0.5m)
    // > 20 -> assume cm (e.g. 150 -> 1.5m, 250 -> 2.5m)
    // <= 20 -> assume meters (e.g. 1.5 -> 1.5m)
    if (val > 500) return val / 1000;
    if (val > 20) return val / 100;
    return val;
  };

  const height = parseVal(heightMatch?.[1] || dimMatch?.[2], heightMatch?.[3], isDoor ? 2.0 : 1.5);
  const sillHeight = parseVal(sillMatch?.[1], sillMatch?.[3], isDoor ? 0.0 : 0.9);

  return { height, sillHeight, type };
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
    const layer = ent.layer || '';

    // OUTER FOOTPRINT
    if (footprintLayers.includes(layer)) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        if (ent.vertices.length >= 3) {
           if (footprint.outer.length === 0) {
              console.log(`[WATT] Detected Footprint on layer: ${layer}, points: ${ent.vertices.length}`);
              footprint.outer = ent.vertices.map((v: any) => ({ x: v.x, y: v.y }));
           }
        }
      }
    }

    // COURTYARDS (Inner holes)
    if (courtyardLayers.includes(layer)) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        if (ent.vertices.length >= 3) {
           footprint.courtyards.push(ent.vertices.map((v: any) => ({ x: v.x, y: v.y })));
        }
      }
    }

    // WINDOWS & DOORS
    // Permissive match: Check if the layer matches any of the prefixes exactly OR follows the prefix pattern
    const isWindowLayer = windowLayers.some(wl => 
      layer === wl || layer.startsWith(wl + '_') || layer.startsWith(wl + '-') || layer.startsWith(wl + ' ')
    );

    if (isWindowLayer) {
      if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        const vCount = ent.vertices.length;
        if (vCount >= 2) { // Allow even segments/lines drawn as polylines
          const v = ent.vertices;
          
          let width = 0;
          if (vCount >= 3) {
            const d1 = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y);
            const d2 = Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y);
            width = Math.max(d1, d2);
          } else if (vCount === 2) {
            width = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y);
          }

          // Centroid
          let sumX = 0, sumY = 0;
          v.forEach((p: any) => { sumX += p.x; sumY += p.y; });
          const cx = sumX / vCount;
          const cy = sumY / vCount;

          const meta = parseWindowMetadata(layer);
          console.log(`[WATT] Detected Opening: ${layer}, w=${width.toFixed(2)}, type=${meta.type}`);

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
