import type { ZoneData } from '../../types';
import type { ZoneBoundary, OpeningInstance } from '../wattTypes';

/**
 * Normalizes an angle to 0-180 range to check for parallelism
 */
function normalizeAngle(p1: {x:number, y:number}, p2: {x:number, y:number}): number {
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  if (angle < 0) angle += 180;
  if (angle >= 180) angle -= 180;
  return angle;
}

/**
 * Calculates azimuth (0-360) where 0 is North (+Y in our coordinate system)
 */
export function calculateAzimuth(p1: {x:number, y:number}, p2: {x:number, y:number}): number {
  // DXF/Canvas: 0 is East (+X). Let's convert to Compass: 0 North, 90 East.
  // Math.atan2 gives angle from X axis.
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  let azimuth = 90 - angle; 
  while (azimuth < 0) azimuth += 360;
  while (azimuth >= 360) azimuth -= 360;
  return azimuth;
}

/**
 * Finds distance between a point and a line segment
 */
function distPointToSegment(p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}): number {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

/**
 * Checks if two segments are parallel and close to each other
 */
export function checkAdjacency(zoneA: ZoneData, otherZones: ZoneData[], scale: number = 1.0, maxDist: number = 0.6): ZoneBoundary[] {
  const boundaries: ZoneBoundary[] = [];
  const verticesA = (zoneA as any)._vertices || []; 
  
  if (verticesA.length < 2) return [];

  for (let i = 0; i < verticesA.length; i++) {
    const p1 = verticesA[i];
    const p2 = verticesA[(i + 1) % verticesA.length];
    
    // SCALE TO METERS BEFORE ANALYSIS
    const sp1 = { x: p1.x * scale, y: p1.y * scale };
    const sp2 = { x: p2.x * scale, y: p2.y * scale };

    const angleA = normalizeAngle(sp1, sp2);
    const lenA = Math.hypot(sp2.x - sp1.x, sp2.y - sp1.y);

    let matched = false;

    for (const zoneB of otherZones) {
      if (zoneB.id === zoneA.id) continue;
      const verticesB = (zoneB as any)._vertices || [];

      for (let j = 0; j < verticesB.length; j++) {
        const q1 = verticesB[j];
        const q2 = verticesB[(j + 1) % verticesB.length];

        const sq1 = { x: q1.x * scale, y: q1.y * scale };
        const sq2 = { x: q2.x * scale, y: q2.y * scale };

        const angleB = normalizeAngle(sq1, sq2);


        // 1. Parallel check (tolerance 2 degrees)
        if (Math.abs(angleA - angleB) < 2 || Math.abs(angleA - angleB) > 178) {
          const midA = { x: (sp1.x + sp2.x) / 2, y: (sp1.y + sp2.y) / 2 };
          const dist = distPointToSegment(midA, sq1, sq2);

          if (dist > 0.01 && dist <= maxDist) {
            boundaries.push({
              id: `wall-${zoneA.id}-${zoneB.id}-${i}`,
              type: 'INTERIOR',
              isExternal: false,
              adjacentZoneId: zoneB.id,
              geometry: {
                p1: sp1, p2: sp2,
                lengthNet: lenA,
                azimuth: calculateAzimuth(sp1, sp2),
                thickness: dist
              },
              openings: []
            });
            matched = true;
            break;
          }
        }
      }
      if (matched) break;
    }

    if (!matched) {
       boundaries.push({
         id: `unresolved-${zoneA.id}-${i}`,
         type: 'UNRESOLVED',
         isExternal: false,
         geometry: { p1: sp1, p2: sp2, lengthNet: lenA, azimuth: calculateAzimuth(sp1, sp2), thickness: 0 },
         openings: []
       });
    }
  }

  return boundaries;
}

/**
 * Checks unresolved edges against the building footprint
 */
export function checkBoundary(
  edges: ZoneBoundary[], 
  footprint: { outer: {x:number, y:number}[]; courtyards: {x:number, y:number}[][] }, 
  maxDist: number = 1.2 // Increased tolerance for exterior detection
): ZoneBoundary[] {
  return edges.map(edge => {
    if (edge.type !== 'UNRESOLVED') return edge;

    const mid = { 
      x: (edge.geometry.p1.x + edge.geometry.p2.x) / 2, 
      y: (edge.geometry.p1.y + edge.geometry.p2.y) / 2 
    };

    let matched = false;
    let distFound = 0;

    // Check Outer Shell
    if (footprint.outer && footprint.outer.length > 0) {
      for (let i = 0; i < footprint.outer.length; i++) {
        const p1 = footprint.outer[i];
        const p2 = footprint.outer[(i + 1) % footprint.outer.length];
        
        const dist = distPointToSegment(mid, p1, p2);
        if (dist <= maxDist) {
          matched = true;
          distFound = dist;
          break;
        }
      }
    }

    // Check Courtyards (Internal Holes)
    if (!matched && footprint.courtyards) {
      for (const court of footprint.courtyards) {
        for (let i = 0; i < court.length; i++) {
          const p1 = court[i];
          const p2 = court[(i + 1) % court.length];
          const dist = distPointToSegment(mid, p1, p2);
          if (dist <= maxDist) {
            matched = true;
            distFound = dist;
            break;
          }
        }
        if (matched) break;
      }
    }

    if (matched) {
       // L_osi LOGIC: Add detected thickness to the length to approximate axial length
       const thickness = distFound > 0.05 ? distFound : 0.35;
       return {
         ...edge,
         type: 'EXTERIOR',
         isExternal: true,
         geometry: { 
           ...edge.geometry, 
           thickness: thickness,
           lengthNet: edge.geometry.lengthNet + thickness // Approximate L_osi
         }
       };
    }

    return edge;
  });
}

/**
 * Snaps loose openings to the nearest wall segments
 */
export function snapOpeningsToEdges(edges: ZoneBoundary[], openings: OpeningInstance[], maxSnapDist: number = 1.0): ZoneBoundary[] {
  const result = [...edges];

  openings.forEach(op => {
    if (!op.centroid) return;

    let bestDist = Infinity;
    let bestEdgeIdx = -1;
    let bestT = 0;

    result.forEach((edge, idx) => {
      const v = edge.geometry.p1;
      const w = edge.geometry.p2;
      const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
      if (l2 === 0) return;

      let t = ((op.centroid!.x - v.x) * (w.x - v.x) + (op.centroid!.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(op.centroid!.x - (v.x + t * (w.x - v.x)), op.centroid!.y - (v.y + t * (w.y - v.y)));

      if (dist < bestDist && dist <= maxSnapDist) {
        bestDist = dist;
        bestEdgeIdx = idx;
        bestT = t;
      }
    });

    if (bestEdgeIdx !== -1) {
      const edge = result[bestEdgeIdx];
      edge.openings.push({
        ...op,
        placement: Math.round(bestT * edge.geometry.lengthNet * 100) / 100
      });
    }
  });

  return result;
}
