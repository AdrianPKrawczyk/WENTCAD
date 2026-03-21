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

/**
 * Calculates the closest point on a line segment to a given point.
 * @param p The point to check {x, y}
 * @param v The start of the line segment {x, y}
 * @param w The end of the line segment {x, y}
 * @returns The closest point on the segment {x, y}
 */
export function getClosestPointOnSegment(
  p: { x: number, y: number },
  v: { x: number, y: number },
  w: { x: number, y: number }
): { x: number, y: number } {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return { ...v };
  
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  
  return { 
    x: v.x + t * (w.x - v.x), 
    y: v.y + t * (w.y - v.y) 
  };
}

/**
 * Checks if a point is inside a polygon using the ray-casting algorithm.
 * @param x x-coordinate of the point
 * @param y y-coordinate of the point
 * @param flatPoints Array of coordinates [x1, y1, x2, y2, ...]
 */
export function isPointInPolygon(x: number, y: number, flatPoints: number[]): boolean {
  if (flatPoints.length < 6) return false;
  
  let inside = false;
  for (let i = 0, j = flatPoints.length - 2; i < flatPoints.length; i += 2) {
    const xi = flatPoints[i], yi = flatPoints[i + 1];
    const xj = flatPoints[j], yj = flatPoints[j + 1];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  
  return inside;
}
