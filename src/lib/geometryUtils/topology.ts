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
 * Ensures vertices are in Counter-Clockwise order (in Y-down space).
 * Area > 0 in our coords (Y-down) means CCW.
 */
function ensureCCW(vertices: {x:number, y:number}[]): {x:number, y:number}[] {
  if (vertices.length < 3) return vertices;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    area += (p2.x - p1.x) * (p2.y + p1.y);
  }
  // area > 0 means CCW in Y-down coordinate system
  if (area < 0) return [...vertices].reverse();
  return vertices;
}

/**
 * Calculates azimuth (0-360) where 0 is North (+Y in our coordinate system)
 */
export function calculateAzimuth(p1: {x:number, y:number}, p2: {x:number, y:number}): number {
  // Angle of segment (0 is East, 90 is South in Y-down)
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  
  // For CCW winding: Outward Normal = Segment Angle + 90 deg.
  // Segment Azimuth (CW from North=0) = angle + 90.
  // Outward Normal Azimuth = (angle + 90) + 90 = angle + 180.
  let azimuth = angle + 180; 
  
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
 * Checks if two segments are parallel and identifies overlapping fragments.
 * Splits the original wall into multiple pieces: INTERIOR (matches) and UNRESOLVED (gaps).
 */
export function checkAdjacency(zoneA: ZoneData, otherZones: ZoneData[], scale: number = 1.0, maxDist: number = 0.6): ZoneBoundary[] {
  const boundaries: ZoneBoundary[] = [];
  const verticesA = ensureCCW((zoneA as any)._vertices || []); 
  
  if (verticesA.length < 2) return [];

  for (let i = 0; i < verticesA.length; i++) {
    const p1 = verticesA[i];
    const p2 = verticesA[(i + 1) % verticesA.length];
    
    const sp1 = { x: p1.x * scale, y: p1.y * scale };
    const sp2 = { x: p2.x * scale, y: p2.y * scale };

    const v = { x: sp2.x - sp1.x, y: sp2.y - sp1.y };
    const L2 = v.x * v.x + v.y * v.y;
    if (L2 < 0.0001) continue;

    const angleA = normalizeAngle(sp1, sp2);
    const overlaps: { tStart: number, tEnd: number, zoneId: string, dist: number }[] = [];

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
          // Project sq1, sq2 onto line sp1-sp2 to find the interval [t1, t2]
          const t1 = ((sq1.x - sp1.x) * v.x + (sq1.y - sp1.y) * v.y) / L2;
          const t2 = ((sq2.x - sp1.x) * v.x + (sq2.y - sp1.y) * v.y) / L2;

          const tStart = Math.max(0, Math.min(t1, t2));
          const tEnd = Math.min(1, Math.max(t1, t2));

          if (tEnd - tStart > 0.01) { // Min 1cm overlap
            const midT = (tStart + tEnd) / 2;
            const midPointOnA = { x: sp1.x + midT * v.x, y: sp1.y + midT * v.y };
            const dist = distPointToSegment(midPointOnA, sq1, sq2);

            if (dist > 0.01 && dist <= maxDist) {
              overlaps.push({ tStart, tEnd, zoneId: zoneB.id, dist });
            }
          }
        }
      }
    }

    // Sort overlaps by start position
    overlaps.sort((a, b) => a.tStart - b.tStart);

    // Merge/fill gaps to create boundary segments
    let currentT = 0;
    let subIdx = 0;

    for (const ov of overlaps) {
      // Create UNRESOLVED segment for the gap before the overlap
      if (ov.tStart > currentT + 0.001) {
        boundaries.push(createBoundary(zoneA.id, null, i, subIdx++, 'UNRESOLVED', sp1, sp2, currentT, ov.tStart, 0));
      }
      // Create INTERIOR segment for the overlap
      if (ov.tEnd > currentT + 0.001) {
        const actualStart = Math.max(currentT, ov.tStart);
        boundaries.push(createBoundary(zoneA.id, ov.zoneId, i, subIdx++, 'INTERIOR', sp1, sp2, actualStart, ov.tEnd, ov.dist));
        currentT = ov.tEnd;
      }
    }

    // Create UNRESOLVED segment for the remaining gap after last overlap
    if (currentT < 0.999) {
      boundaries.push(createBoundary(zoneA.id, null, i, subIdx++, 'UNRESOLVED', sp1, sp2, currentT, 1.0, 0));
    }
  }

  return boundaries;
}

/**
 * Internal helper to create a sub-segment ZoneBoundary
 */
function createBoundary(
  zoneAId: string, 
  adjacentZoneId: string | null, 
  edgeIdx: number, 
  subIdx: number, 
  type: 'INTERIOR' | 'UNRESOLVED',
  p1: {x:number, y:number}, 
  p2: {x:number, y:number}, 
  t1: number, 
  t2: number,
  thickness: number
): ZoneBoundary {
  const v = { x: p2.x - p1.x, y: p2.y - p1.y };
  const subP1 = { x: p1.x + t1 * v.x, y: p1.y + t1 * v.y };
  const subP2 = { x: p1.x + t2 * v.x, y: p1.y + t2 * v.y };
  const length = Math.hypot(subP2.x - subP1.x, subP2.y - subP1.y);

  return {
    id: adjacentZoneId 
      ? `wall-${zoneAId}-${adjacentZoneId}-${edgeIdx}-${subIdx}`
      : `unresolved-${zoneAId}-${edgeIdx}-${subIdx}`,
    type,
    isExternal: false,
    adjacentZoneId: adjacentZoneId || undefined,
    geometry: {
      p1: subP1,
      p2: subP2,
      lengthNet: length,
      azimuth: calculateAzimuth(subP1, subP2),
      thickness
    },
    openings: []
  };
}

/**
 * Checks unresolved edges against the building footprint
 */
export function checkBoundary(
  edges: ZoneBoundary[], 
  footprint: { outer: {x:number, y:number}[]; courtyards: {x:number, y:number}[][] }, 
  maxDist: number = 1.2, // Increased tolerance for exterior detection
  maxThickness: number = 1.2 // Capping for auto-thickness
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
       // CAP thickness to user-defined value to avoid shafts causing massive walls
       let thickness = distFound > 0.05 ? distFound : 0.35;
       if (thickness > maxThickness) thickness = 0.35; // Fallback to standard if it looks like a shaft/far boundary

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
export function snapOpeningsToEdges(edges: ZoneBoundary[], openings: OpeningInstance[], scale: number = 1.0, maxSnapDist: number = 1.0): ZoneBoundary[] {
  const result = [...edges];

  openings.forEach(op => {
    if (!op.centroid) return;

    // SCALE centroid to match the already scaled edges
    const scx = op.centroid.x * scale;
    const scy = op.centroid.y * scale;

    let bestDist = Infinity;
    let bestEdgeIdx = -1;
    let bestT = 0;

    result.forEach((edge, idx) => {
      const v = edge.geometry.p1;
      const w = edge.geometry.p2;
      const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
      if (l2 === 0) return;

      let t = ((scx - v.x) * (w.x - v.x) + (scy - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(scx - (v.x + t * (w.x - v.x)), scy - (v.y + t * (w.y - v.y)));

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
