import { describe, it, expect } from 'vitest';
import { calculateZoneAirBalance } from './PhysicsEngine';
import type { ZoneData } from '../types';

describe('PhysicsEngine - Air Balance (TDD)', () => {
  const createMockZone = (overrides: Partial<ZoneData> = {}): ZoneData => ({
    id: 'z1',
    name: 'Test Room',
    activityType: 'OFFICE',
    area: 20,
    height: 3,
    isAreaLinkedToGeometry: false,
    maxAllowedDbA: 35,
    occupants: 0,
    dosePerOccupant: 30,
    targetACH: 0,
    normativeVolume: 0,
    totalHeatGain: 0,
    roomTemp: 24,
    roomRH: 50,
    supplyTemp: 16,
    supplyRH: 80,
    acousticAbsorption: 'MEDIUM',
    calculatedVolume: 0,
    realACH: 0,
    ...overrides
  });

  it('should calculate V_hig correctly (occupants * dose)', () => {
    const zone = createMockZone({ occupants: 5, dosePerOccupant: 30 }); // 150 m3/h
    const result = calculateZoneAirBalance(zone);
    expect(result.calculatedVolume).toBe(150);
  });

  it('should calculate V_krotnosc correctly (ACH * Area * Height)', () => {
    // Volume = 20 * 3 = 60 m3. ACH = 4. 60 * 4 = 240 m3/h
    const zone = createMockZone({ targetACH: 4 });
    const result = calculateZoneAirBalance(zone);
    expect(result.calculatedVolume).toBe(240);
  });

  it('should return max of all factors (Thermal overrides others)', () => {
    // V_hig = 2 * 30 = 60
    // V_krot = 1 * 60 = 60
    // Heat gain = 2000W, Room=24C,50%RH, Supply=16C,100%RH (roughly 14C diff in enthalpy)
    const zone = createMockZone({
      occupants: 2,
      targetACH: 1,
      totalHeatGain: 2000,
      roomTemp: 24,
      roomRH: 50,
      supplyTemp: 16,
      supplyRH: 100 // Use 100% to simulate cooling coil leaving state
    });

    const result = calculateZoneAirBalance(zone);
    
    // Manual rough calc: 
    // hp ~ 47.9 kJ/kg
    // hn ~ 44.8 kJ/kg
    // dp = 3.1 kJ/kg
    // V_term = 2000 * 3.6 / (1.2 * 3.1) ~ 1935 m3/h
    // This expects thermal to be greater than 60.
    expect(result.calculatedVolume).toBeGreaterThan(1500);
    expect(result.calculatedVolume).toBe(Math.max(60, 60, 0, result.calculatedVolume));
  });

  it('should calculate realACH correctly after picking max volume', () => {
    const zone = createMockZone({ occupants: 10, dosePerOccupant: 50, area: 10, height: 2 }); // vol=20, V=500 -> ACH=25
    const result = calculateZoneAirBalance(zone);
    expect(result.realACH).toBe(25);
  });

  it('handle edge cases - zero area/height', () => {
    const zone = createMockZone({ area: 0, height: 0, normativeVolume: 100 });
    const result = calculateZoneAirBalance(zone);
    expect(result.calculatedVolume).toBe(100);
    expect(result.realACH).toBe(0); // Should not be Infinity or NaN
  });

  it('handle edge cases - zero temperature delta or heating mode', () => {
    // If supply is warmer than room, V_term for cooling doesn't apply (returns 0 for V_term)
    const zone = createMockZone({ totalHeatGain: 1000, roomTemp: 20, supplyTemp: 22, normativeVolume: 150 });
    const result = calculateZoneAirBalance(zone);
    expect(result.calculatedVolume).toBe(150); // V_term ignored
  });
});
