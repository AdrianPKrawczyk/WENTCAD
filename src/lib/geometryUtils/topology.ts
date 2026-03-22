import { ZoneData, ZoneBoundary, OpeningInstance } from '../../types';

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
export function checkAdjacency(zoneA: ZoneData, otherZones: ZoneData[], maxDist: number = 0.6): ZoneBoundary[] {
  const boundaries: ZoneBoundary[] = [];
  const verticesA = (zoneA as any)._vertices || []; // Assuming vertices are passed or stored

  if (verticesA.length < 2) return [];

  for (let i = 0; i < verticesA.length; i++) {
    const p1 = verticesA[i];
    const p2 = verticesA[(i + 1) % verticesA.length];
    const angleA = normalizeAngle(p1, p2);
    const lenA = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    let matched = false;

    for (const zoneB of otherZones) {
      if (zoneB.id === zoneA.id) continue;
      const verticesB = (zoneB as any)._vertices || [];

      for (let j = 0; j < verticesB.length; j++) {
        const q1 = verticesB[j];
        const q2 = verticesB[(j + 1) % verticesB.length];
        const angleB = normalizeAngle(q1, q2);

        // 1. Parallel check (tolerance 2 degrees)
        if (Math.abs(angleA - angleB) < 2 || Math.abs(angleA - angleB) > 178) {
          // 2. Distance check (using midpoint of A)
          const midA = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          const dist = distPointToSegment(midA, q1, q2);

          if (dist > 0.01 && dist <= maxDist) {
            // 3. Overlap check (simplified: check if projection of midA is on B)
            // In a full engine we'd calculate the exact overlapping sub-segment
            boundaries.push({
              id: `wall-${zoneA.id}-${zoneB.id}-${i}`,
              type: 'INTERIOR',
              isExternal: false,
              adjacentZoneId: zoneB.id,
              geometry: {
                p1, p2,
                lengthNet: lenA,
                azimuth: calculateAzimuth(p1, p2),
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
         geometry: { p1, p2, lengthNet: lenA, azimuth: calculateAzimuth(p1, p2), thickness: 0 },
         openings: []
       });
    }
  }

  return boundaries;
}

/**
 * Checks unresolved edges against the building footprint
 */
export function checkBoundary(edges: ZoneBoundary[], footprints: {x:number, y:number}[][], maxDist: number = 0.8): ZoneBoundary[] {
  return edges.map(edge => {
    if (edge.type !== 'UNRESOLVED') return edge;

    const mid = { 
      x: (edge.geometry.p1.x + edge.geometry.p2.x) / 2, 
      y: (edge.geometry.p1.y + edge.geometry.p2.y) / 2 
    };

    for (const footprint of footprints) {
      for (let i = 0; i < footprint.length; i++) {
        const p1 = footprint[i];
        const p2 = footprint[(i + 1) % footprint.length];
        
        const dist = distPointToSegment(mid, p1, p2);
        if (dist <= maxDist) {
          return {
            ...edge,
            type: 'EXTERIOR',
            isExternal: true,
            geometry: { ...edge.geometry, thickness: dist > 0.05 ? dist : 0.4 } // fallback to 40cm if too close
          };
        }
      }
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
