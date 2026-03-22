import type { IfcMaterialLayer, IfcMaterial } from './wattTypes';

/**
 * Calculates thermal resistance R [m2K/W] for a set of layers
 * R = sum(d / lambda) + Rsi + Rse
 */
export function calculateUValue(
  layers: IfcMaterialLayer[], 
  materials: Record<string, IfcMaterial>,
  isExternal: boolean = true
): number {
  // Standard surface thermal resistances [m2K/W]
  // Vertical heat flow (walls)
  const Rsi = 0.13;
  const Rse = isExternal ? 0.04 : 0.13; // Rse = Rsi if both sides are internal

  let R_layers = 0;

  layers.forEach(layer => {
    const mat = materials[layer.materialId];
    if (mat && mat.thermalConductivity > 0) {
      R_layers += layer.thickness / mat.thermalConductivity;
    }
  });

  const R_total = Rsi + R_layers + Rse;
  
  if (R_total === 0) return 0;
  
  return Math.round((1 / R_total) * 1000) / 1000;
}
