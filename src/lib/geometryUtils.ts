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
