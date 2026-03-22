import { checkAdjacency, checkBoundary, snapOpeningsToEdges } from './topology';
import { ZoneData, ZoneBoundary, OpeningInstance } from '../../types';

// Helper to create a simple rectangular zone
function createRectZone(id: string, x: number, y: number, w: number, h: number): ZoneData {
  return {
    id,
    nr: id,
    name: id,
    activityType: 'CUSTOM',
    calculationMode: 'AUTO_MAX',
    area: w * h,
    height: 3,
    floorId: 'f1',
    // Geometry as flat points for the canvas store logic
    // But for topology we'll use polygons/vertices
    geometryArea: w * h,
    isAreaManual: false,
    // We will assume our topology engine takes ZoneData but looks at its polygon points
    // For testing, let's mock the vertices we'll use in the engine
    _vertices: [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w, y: y + h },
      { x: x, y: y + h }
    ]
  } as any;
}

function runTopologyTests() {
  console.log('--- WATT Topology Engine Tests ---');

  // TEST 1: Adjacency Detection (Interior Walls)
  // Zone A: (0,0) to (5,5)
  // Zone B: (5.2, 0) to (10, 5) -> Gap of 0.2m (typical wall)
  const zoneA = createRectZone('A', 0, 0, 5, 5);
  const zoneB = createRectZone('B', 5.2, 0, 5, 5);
  
  const adjResult = checkAdjacency(zoneA, [zoneB], 0.6); // 0.6m max gap
  
  console.assert(adjResult.length > 0, 'Test 1.1 Failed: No adjacency detected');
  if (adjResult.length > 0) {
    const wall = adjResult.find(b => b.adjacentZoneId === 'B');
    console.assert(!!wall, 'Test 1.2 Failed: Adjacency with Zone B not found');
    console.assert(wall?.type === 'INTERIOR', 'Test 1.3 Failed: Wall type should be INTERIOR');
    console.assert(Math.abs(wall!.geometry.thickness - 0.2) < 0.01, `Test 1.4 Failed: Wrong thickness (${wall?.geometry.thickness})`);
    console.assert(Math.abs(wall!.geometry.lengthNet - 5) < 0.01, 'Test 1.5 Failed: Wrong wall length');
  }

  // TEST 2: Exterior Boundary Detection
  // Building Footprint: (0,0) to (20, 20)
  // Zone A: (0,0) to (5,5) -> Should have 2 exterior walls (bottom and left)
  const footprint = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
    { x: 0, y: 20 }
  ];
  
  // Unresolved edges from zoneA (assume they weren't matched as interior)
  const unresolvedEdges: ZoneBoundary[] = [
    { id: 'e1', type: 'UNRESOLVED', isExternal: false, geometry: { p1: {x:0, y:0}, p2: {x:5, y:0}, lengthNet: 5, azimuth: 0, thickness: 0 }, openings: [] },
    { id: 'e2', type: 'UNRESOLVED', isExternal: false, geometry: { p1: {x:5, y:0}, p2: {x:5, y:5}, lengthNet: 5, azimuth: 90, thickness: 0 }, openings: [] },
  ];

  const extResult = checkBoundary(unresolvedEdges, [footprint]);
  
  const e1 = extResult.find(r => r.id === 'e1');
  console.assert(e1?.type === 'EXTERIOR', 'Test 2.1 Failed: Edge e1 should be EXTERIOR');
  
  const e2 = extResult.find(r => r.id === 'e2');
  console.assert(e2?.type === 'UNRESOLVED', 'Test 2.2 Failed: Edge e2 should stay UNRESOLVED (it is inside)');

  // TEST 3: Opening Snapping
  // Wall from (0,0) to (10,0)
  // Opening at (5, 0.1) -> Should snap to this wall
  const wallSegment: ZoneBoundary = {
    id: 'wall1',
    type: 'EXTERIOR',
    isExternal: true,
    geometry: { p1: {x:0, y:0}, p2: {x:10, y:0}, lengthNet: 10, azimuth: 0, thickness: 0.4 },
    openings: []
  };

  const openings: OpeningInstance[] = [
    { id: 'win1', width: 2, height: 1.5, sillHeight: 0.9, placement: 0, centroid: { x: 5, y: 0.1 } }
  ];

  const snapped = snapOpeningsToEdges([wallSegment], openings);
  console.assert(snapped[0].openings.length === 1, 'Test 3.1 Failed: Opening not snapped to wall');
  if (snapped[0].openings.length > 1) {
    console.assert(snapped[0].openings[0].placement === 5, `Test 3.2 Failed: Wrong placement (${snapped[0].openings[0].placement})`);
  }

  console.log('Topology Tests: Finished');
}

runTopologyTests();
