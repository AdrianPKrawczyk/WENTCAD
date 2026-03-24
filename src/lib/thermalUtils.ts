import type { IfcMaterialLayer, IfcMaterial } from './wattTypes';

/**
 * Calculates thermal resistance R [m2K/W] for a set of layers
 * R = sum(d / lambda) + Rsi + Rse
 */
export function calculateUValue(
  layers: IfcMaterialLayer[], 
  materials: Record<string, IfcMaterial>,
  isExternal: boolean = true,
  type: 'WALL' | 'FLOOR' | 'ROOF' = 'WALL',
  isGroundContact: boolean = false
): number {
  if (layers.length === 0) return 0;
  
  // Standard surface thermal resistances [m2K/W] according to ISO 6946
  let Rsi = 0.13; // Horizontal heat flow (walls)
  if (type === 'ROOF') Rsi = 0.10; // Upwards heat flow
  if (type === 'FLOOR') Rsi = 0.17; // Downwards heat flow

  // Rse logic: 0 for ground contact, 0.04 for external, or same as Rsi for internal
  const Rse = isGroundContact ? 0 : (isExternal ? 0.04 : Rsi);

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
