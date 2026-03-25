import { parseWindowMetadata, extractWattTopology } from './dxfWattExtractor';

// Mock DXF structure for testing
const mockDxf = {
  entities: [
    {
      type: 'LWPOLYLINE',
      layer: 'OBRYS_BUDYNKU',
      closed: true,
      vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
    },
    {
      type: 'LWPOLYLINE',
      layer: 'OKNA_H1500_Ho900',
      closed: true,
      vertices: [
        { x: 2, y: 0 },
        { x: 4, y: 0 }, // width 2
        { x: 4, y: 0.1 },
        { x: 2, y: 0.1 }
      ]
    },
    {
      type: 'LWPOLYLINE',
      layer: 'OKNA_H200_Ho0', // centimeters
      closed: true,
      vertices: [
        { x: 5, y: 0 },
        { x: 5, y: 1 }, // width 1 (vertical orientation)
        { x: 5.1, y: 1 },
        { x: 5.1, y: 0 }
      ]
    },
    {
      type: 'LWPOLYLINE',
      layer: 'OKNA_STANDARD', // no meta
      closed: true,
      vertices: [
        { x: 8, y: 0 },
        { x: 9, y: 0 }, // width 1
        { x: 9, y: 0.1 },
        { x: 8, y: 0.1 }
      ]
    }
  ]
};

function runTests() {
  console.log('--- WATT DXF Extractor Tests ---');

  // 1. Test Regex Parser
  const m1 = parseWindowMetadata('LAYER_H1500_Ho900');
  console.assert(m1.height === 1.5 && m1.sillHeight === 0.9, 'Test 1 Failed: H1500_Ho900');

  const m2 = parseWindowMetadata('OKNO_H200_Ho0');
  console.assert(m2.height === 2.0 && m2.sillHeight === 0, 'Test 2 Failed: H200_Ho0');

  const m3 = parseWindowMetadata('JUST_A_WINDOW');
  console.assert(m3.height === 1.5 && m3.sillHeight === 0.9, 'Test 3 Failed: Default values');

  const m4 = parseWindowMetadata('STOLARKA_H1800');
  console.assert(m4.height === 1.8 && m4.sillHeight === 0.9, 'Test 4 Failed: Only H provided');

  console.log('Regex Tests: PASS');

  // 2. Test Extraction Engine
  const extracted = extractWattTopology(mockDxf, ['OBRYS_BUDYNKU'], [], ['OKNA_H1500_Ho900', 'OKNA_H200_Ho0', 'OKNA_STANDARD']);
  
  console.assert(extracted.buildingFootprint.outer.length === 4, 'Test 5 Failed: Footprint outer length');
  console.assert(extracted.windows.length === 3, 'Test 7 Failed: Windows count');
  
  const w1 = extracted.windows[0];
  console.assert(w1.width === 2, `Test 8 Failed: Window 1 width (${w1.width})`);
  console.assert(w1.height === 1.5, `Test 9 Failed: Window 1 height (${w1.height})`);
  
  const w2 = extracted.windows[1];
  console.assert(w2.width === 1, `Test 11 Failed: Window 2 width (${w2.width})`);
  console.assert(w2.height === 2.0, `Test 12 Failed: Window 2 height (${w2.height})`);

  console.log('Extraction Engine Tests: PASS');
  console.log('--- All tests completed ---');
}

runTests();