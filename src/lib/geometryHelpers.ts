/**
 * Converts degrees (0-360) to compass direction strings (N, NE, E, SE, S, SW, W, NW)
 * Assumes 0 is North, 90 is East...
 */
export function getCompassDirection(azimuth: number): string {
  const normalized = ((azimuth % 360) + 360) % 360;
  const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return sectors[index];
}
