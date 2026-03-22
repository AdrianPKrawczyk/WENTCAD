import type { ZoneData, Floor } from '../../types';
import type { HorizontalBoundary } from '../wattTypes';
import { isPointInPolygon } from '../geometryUtils';

/**
 * Grid Sampling Analysis for vertical boundaries (Roof, Terraces, Overhangs)
 * Estimates areas where a zone is exposed to exterior (up or down)
 */
export function calculateHorizontalBoundaries(
  zone: ZoneData,
  allFloors: Record<string, Floor>,
  zonesBelow: any[],
  zonesAbove: any[],
  scale: number = 1.0,
  buildingFootprint?: { outer: {x:number, y:number}[]; courtyards: {x:number, y:number}[][] }
): HorizontalBoundary[] {
  const vertices = (zone as any)._vertices || [];
  if (vertices.length < 3) return [];

  // Convert vertices to flat array and SCALE TO METERS
  const flatPoints = vertices.flatMap((v: any) => [v.x * scale, v.y * scale]);

  // Calculate Bounding Box in METERS
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < flatPoints.length; i += 2) {
    const x = flatPoints[i];
    const y = flatPoints[i+1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // LOGIKA L_osi: Rozszerzamy bounding box o grubość ściany (uproszczenie) 
  const offset = 0.5; // 50cm offset to cover wall area
  minX -= offset; maxX += offset;
  minY -= offset; maxY += offset;

  const width = maxX - minX;
  const height = maxY - minY;
  
  // Sampling density
  const steps = 25; // Increased for better precision
  const dx = width / steps;
  const dy = height / steps;
  const sampleArea = dx * dy;

  let totalPointsGross = 0;
  let pointsCoveredAbove = 0;
  let pointsCoveredBelow = 0;

  // Prepare footprints for PIP
  const footprintOuter = buildingFootprint?.outer?.flatMap(p => [p.x, p.y]) || [];

  const preparedAbove = zonesAbove.map(z => ({
    id: z.id,
    flatPoints: ((z as any)._vertices || []).flatMap((v: any) => [v.x * scale, v.y * scale])
  })).filter(z => z.flatPoints.length >= 6);

  const preparedBelow = zonesBelow.map(z => ({
    id: z.id,
    flatPoints: ((z as any)._vertices || []).flatMap((v: any) => [v.x * scale, v.y * scale])
  })).filter(z => z.flatPoints.length >= 6);

  // Sample grid
  for (let ix = 0; ix < steps; ix++) {
    for (let iy = 0; iy < steps; iy++) {
      const px = minX + ix * dx + dx / 2;
      const py = minY + iy * dy + dy / 2;

      // GROSS AREA LOGIC:
      // Point is counted if it's INSIDE the zone OR 
      // (INSIDE building footprint AND closer to this zone than any other)
      const isInZone = isPointInPolygon(px, py, flatPoints);
      const isInFootprint = footprintOuter.length >= 6 ? isPointInPolygon(px, py, footprintOuter) : false;
      
      if (isInZone || (isInFootprint && isInZone)) { 
        // Note: isInZone is priority. If we had multiple zones, we'd check proximity.
        // For a single room building, isInFootprint is enough.
        const effectiveIn = isInZone || isInFootprint;
        
        if (effectiveIn) {
          totalPointsGross++;

          const isCoveredAbove = preparedAbove.some(z => isPointInPolygon(px, py, z.flatPoints));
          if (isCoveredAbove) pointsCoveredAbove++;

          const isCoveredBelow = preparedBelow.some(z => isPointInPolygon(px, py, z.flatPoints));
          if (isCoveredBelow) pointsCoveredBelow++;
        }
      }
    }
  }

  if (totalPointsGross === 0) return [];

  // Estimated areas based on samples
  const grossArea = totalPointsGross * sampleArea;
  const roofArea = (totalPointsGross - pointsCoveredAbove) * sampleArea;
  const floorExteriorArea = (totalPointsGross - pointsCoveredBelow) * sampleArea;
  const ceilingInteriorArea = pointsCoveredAbove * sampleArea;
  const floorInteriorArea = pointsCoveredBelow * sampleArea;

  const boundaries: HorizontalBoundary[] = [];

  if (roofArea > 0.1) {
    boundaries.push({ id: `roof-${zone.id}`, type: 'ROOF', area: Math.round(roofArea * 100) / 100 });
  }
  if (ceilingInteriorArea > 0.1) {
    boundaries.push({ id: `ceil-${zone.id}`, type: 'CEILING_INTERIOR', area: Math.round(ceilingInteriorArea * 100) / 100 });
  }

  const currentFloor = allFloors[zone.floorId];
  const isGroundFloor = currentFloor?.elevation === 0 || currentFloor?.order === 0;

  if (isGroundFloor) {
    boundaries.push({ id: `ground-${zone.id}`, type: 'FLOOR_GROUND', area: Math.round(grossArea * 100) / 100 });
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
