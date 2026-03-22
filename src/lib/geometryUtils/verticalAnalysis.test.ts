import { calculateHorizontalBoundaries } from './verticalAnalysis';
import { ZoneData, Floor } from '../../types';

function createMockZone(id: string, floorId: string, points: number[]): any {
  return {
    id,
    floorId,
    area: 100, // mock area
    _vertices: points.map((_, i) => i % 2 === 0 ? { x: points[i], y: points[i+1] } : null).filter(v => v !== null)
  };
}

function runVerticalTests() {
  console.log('--- WATT Vertical Analysis Tests ---');

  const floorGround: Floor = { id: 'f0', name: 'Parter', elevation: 0, order: 0 };
  const floorFirst: Floor = { id: 'f1', name: 'Piętro', elevation: 3.5, order: 1 };
  
  const allFloors = { 'f0': floorGround, 'f1': floorFirst };

  // TEST 1: Roof Detection
  // Zone A on Ground Floor (0,0 to 10,10)
  // No Zone on First Floor
  const zoneA = createMockZone('A', 'f0', [0,0, 10,0, 10,10, 0,10]);
  const zonesOnFloorAbove: any[] = []; // empty floor above
  
  const result1 = calculateHorizontalBoundaries(zoneA, allFloors, [], zonesOnFloorAbove);
  const roof = result1.find(b => b.type === 'ROOF');
  console.assert(!!roof, 'Test 1.1 Failed: Roof not detected');
  console.assert(roof?.area === 100, `Test 1.2 Failed: Wrong roof area (${roof?.area})`);

  // TEST 2: Ceiling Detection (Interior)
  // Zone A on Ground Floor
  // Zone B on First Floor exactly above A
  const zoneB = createMockZone('B', 'f1', [0,0, 10,0, 10,10, 0,10]);
  const result2 = calculateHorizontalBoundaries(zoneA, allFloors, [], [zoneB]);
  const ceiling = result2.find(b => b.type === 'CEILING_INTERIOR');
  console.assert(!!ceiling, 'Test 2.1 Failed: Interior Ceiling not detected');
  console.assert(!result2.some(b => b.type === 'ROOF'), 'Test 2.2 Failed: Roof should not exist when zone above is present');

  // TEST 3: Partial Roof Detection
  // Zone A on Ground Floor (0,0 to 10,10)
  // Zone C on First Floor (0,0 to 5,10) -> Covers half of A
  const zoneC = createMockZone('C', 'f1', [0,0, 5,0, 5,10, 0,10]);
  const result3 = calculateHorizontalBoundaries(zoneA, allFloors, [], [zoneC]);
  const partialRoof = result3.find(b => b.type === 'ROOF');
  console.assert(!!partialRoof, 'Test 3.1 Failed: Partial Roof not detected');
  // With point sampling (10x10 grid), area should be approx 50
  console.assert(Math.abs((partialRoof?.area || 0) - 50) < 5, `Test 3.2 Failed: Wrong partial roof area (${partialRoof?.area})`);

  console.log('Vertical Analysis Tests: Finished');
}

runVerticalTests();
