import type { ZoneData, Floor } from '../../types';
import type { HorizontalBoundary } from '../wattTypes';
import { isPointInPolygon } from '../geometryUtils';

/**
 * Grid Sampling Analysis for vertical boundaries (Roof, Terraces, Overhangs)
 * Estmates areas where a zone is exposed to exterior (up or down)
 */
export function calculateHorizontalBoundaries(
  zone: ZoneData,
  allFloors: Record<string, Floor>,
  zonesBelow: any[],
  zonesAbove: any[]
): HorizontalBoundary[] {
  const vertices = (zone as any)._vertices || [];
  if (vertices.length < 3) return [];

  // Convert vertices to flat array for isPointInPolygon util
  const flatPoints = vertices.flatMap((v: any) => [v.x, v.y]);

  // Calculate Bounding Box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  vertices.forEach((v: any) => {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  
  // Sampling density (increase for more accuracy, 20x20 is usually enough for thermal)
  const steps = 20;
  const dx = width / steps;
  const dy = height / steps;
  const cellArea = dx * dy;

  let totalPointsInZone = 0;
  let pointsCoveredAbove = 0;
  let pointsCoveredBelow = 0;

  // Prepare flat points for other zones to speed up PIP checks
  const preparedAbove = zonesAbove.map(z => ({
    id: z.id,
    flatPoints: ((z as any)._vertices || []).flatMap((v: any) => [v.x, v.y])
  })).filter(z => z.flatPoints.length >= 6);

  const preparedBelow = zonesBelow.map(z => ({
    id: z.id,
    flatPoints: ((z as any)._vertices || []).flatMap((v: any) => [v.x, v.y])
  })).filter(z => z.flatPoints.length >= 6);

  // Sample grid
  for (let ix = 0; ix < steps; ix++) {
    for (let iy = 0; iy < steps; iy++) {
      const px = minX + ix * dx + dx / 2;
      const py = minY + iy * dy + dy / 2;

      if (isPointInPolygon(px, py, flatPoints)) {
        totalPointsInZone++;

        // Check if covered from above
        const isCoveredAbove = preparedAbove.some(z => isPointInPolygon(px, py, z.flatPoints));
        if (isCoveredAbove) pointsCoveredAbove++;

        // Check if covered from below
        const isCoveredBelow = preparedBelow.some(z => isPointInPolygon(px, py, z.flatPoints));
        if (isCoveredBelow) pointsCoveredBelow++;
      }
    }
  }

  if (totalPointsInZone === 0) return [];

  const zoneArea = zone.area || 0;
  // Area ratio per point based on actual zone area (more accurate than cellArea * points)
  const areaPerPoint = zoneArea / totalPointsInZone;

  const roofArea = (totalPointsInZone - pointsCoveredAbove) * areaPerPoint;
  const floorExteriorArea = (totalPointsInZone - pointsCoveredBelow) * areaPerPoint;
  const ceilingInteriorArea = pointsCoveredAbove * areaPerPoint;
  const floorInteriorArea = pointsCoveredBelow * areaPerPoint;

  const boundaries: HorizontalBoundary[] = [];

  // 1. CEILING / ROOF
  if (roofArea > 0.1) {
    boundaries.push({ id: `roof-${zone.id}`, type: 'ROOF', area: Math.round(roofArea * 100) / 100 });
  }
  if (ceilingInteriorArea > 0.1) {
    boundaries.push({ id: `ceil-${zone.id}`, type: 'CEILING_INTERIOR', area: Math.round(ceilingInteriorArea * 100) / 100 });
  }

  // 2. FLOOR / GROUND
  const currentFloor = allFloors[zone.floorId];
  const isGroundFloor = currentFloor?.elevation === 0 || currentFloor?.order === 0;

  if (isGroundFloor) {
    boundaries.push({ id: `ground-${zone.id}`, type: 'FLOOR_GROUND', area: zoneArea });
  } else {
    if (floorExteriorArea > 0.1) {
      boundaries.push({ id: `overhang-${zone.id}`, type: 'FLOOR_EXTERIOR', area: Math.round(floorExteriorArea * 100) / 100 });
    }
    if (floorInteriorArea > 0.1) {
      boundaries.push({ id: `floor-int-${zone.id}`, type: 'FLOOR_INTERIOR', area: Math.round(floorInteriorArea * 100) / 100 });
    }
  }

  return boundaries;
}
