/**
 * Calculates the area of a polygon using the shoelace formula.
 * @param flatPoints Array of coordinates [x1, y1, x2, y2, ...]
 * @returns Area in square units
 */
export function calculatePolygonArea(flatPoints: number[]): number {
  if (flatPoints.length < 6) return 0;
  
  let area = 0;
  for (let i = 0; i < flatPoints.length; i += 2) {
    const x1 = flatPoints[i];
    const y1 = flatPoints[i + 1];
    const x2 = flatPoints[(i + 2) % flatPoints.length];
    const y2 = flatPoints[(i + 3) % flatPoints.length];
    area += x1 * y2 - x2 * y1;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculates the centroid (center of mass) of a polygon.
 * @param points Array of coordinates [x1, y1, x2, y2, ...]
 * @returns Centroid {x, y}
 */
export function calculatePolygonCentroid(points: number[]): { x: number, y: number } {
  if (points.length < 6) return { x: 0, y: 0 };

  let area = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[(i + 2) % points.length];
    const y2 = points[(i + 3) % points.length];

    const crossProduct = x1 * y2 - x2 * y1;
    area += crossProduct;
    centroidX += (x1 + x2) * crossProduct;
    centroidY += (y1 + y2) * crossProduct;
  }

  area /= 2;

  // Fallback if area is 0 (e.g. self-intersecting or colinear points)
  if (Math.abs(area) < 0.0001) {
    let sumX = 0;
    let sumY = 0;
    const numPoints = points.length / 2;
    for (let i = 0; i < points.length; i += 2) {
      sumX += points[i];
      sumY += points[i + 1];
    }
    return { x: sumX / numPoints, y: sumY / numPoints };
  }

  centroidX /= (6 * area);
  centroidY /= (6 * area);

  return { x: Math.abs(centroidX), y: Math.abs(centroidY) }; 
}
