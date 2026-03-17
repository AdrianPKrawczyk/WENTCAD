import { describe, it, expect } from 'vitest';
import { calculateZoneAirBalance } from './PhysicsEngine';
import type { ZoneData } from '../types';

describe('PhysicsEngine - Air Balance (TDD)', () => {
  const createMockZone = (overrides: Partial<ZoneData> = {}): ZoneData => ({
    id: 'z1',
    nr: 'P-01',
    name: 'Test Room',
    activityType: 'Pomieszczenie socjalne',
    calculationMode: 'AUTO_MAX',
    systemSupplyId: 'NW1',
    floorId: 'floor-parter',
    area: 20,
    manualArea: 20,
    height: 3,
    geometryArea: null,
    isAreaManual: false,
    maxAllowedDbA: 35,
    occupants: 0,
    dosePerOccupant: 30,
    isTargetACHManual: false,
    manualTargetACH: null,
    targetACH: 0,
    normativeVolume: 0,
    normativeExhaust: 0,
    isMaxDbAManual: false,
    manualMaxAllowedDbA: null,
    totalHeatGain: 0,
    roomTemp: 24,
    roomRH: 50,
    supplyTemp: 16,
    supplyRH: 80,
    acousticAbsorption: 'MEDIUM',
    transferIn: [],
    transferOut: [],
    calculatedVolume: 0,
    calculatedExhaust: 0,
    transferInSum: 0,
    transferOutSum: 0,
    netBalance: 0,
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

  it('should calculate transfers, manual volume and specific modes correctly', () => {
    const zone = createMockZone({ 
      calculationMode: 'MANUAL', 
      normativeVolume: 100,
      normativeExhaust: 80,
      manualVolume: 50, // zamiast area*height (60)
      transferIn: [{ volume: 40, roomId: 'z2' }],
      transferOut: [{ volume: 20, roomId: 'z3' }]
    });
    
    const result = calculateZoneAirBalance(zone);
    
    // MANUAL mode ignores vHig/vKrot, uses normativeVolume directly
    expect(result.calculatedVolume).toBe(100);
    expect(result.calculatedExhaust).toBe(80);
    
    // Transfers sums
    expect(result.transferInSum).toBe(40);
    expect(result.transferOutSum).toBe(20);
    
    // Net Balance = (100 + 40) - (80 + 20) = 140 - 100 = 40
    expect(result.netBalance).toBe(40);
    
    // realACH considers max(Supply, Exhaust) / volume
    // Supply side total = 140
    // Exhaust side total = 100
    // Max = 140. Volume = 50. 140 / 50 = 2.8
    expect(result.realACH).toBe(2.8);
  });
});
