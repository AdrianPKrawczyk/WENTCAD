/**
 * HVAC Data Foundation (Step 1)
 * SINGLE SOURCE OF TRUTH FOR HVAC SYSTEM TYPES
 * Based on docs/01-system-guardrails.md and docs/05-hvac-formulas.md
 */

// ============================================
// 1. ZONES & AIR BALANCE
// ============================================

export type ActivityType = 'OFFICE' | 'CONFERENCE' | 'TOILET' | 'CORRIDOR' | 'CUSTOM'
export type AcousticAbsorptionIndicator = 'HARD' | 'MEDIUM' | 'SOFT'

export interface ZoneData {
  id: string;
  name: string;
  activityType: ActivityType;
  
  // Geometry
  area: number;   // m^2
  height: number; // m
  
  // Air Volume Inputs (V_hig, V_krotnosc, V_norm)
  occupants: number;
  dosePerOccupant: number; // m^3/h 
  targetACH: number;       // 1/h
  normativeVolume: number; // m^3/h 
  
  // Thermodynamics (V_term)
  totalHeatGain: number; // W (Total heat gains, jawne + utajone)
  roomTemp: number;      // °C
  roomRH: number;        // %
  supplyTemp: number;    // °C
  supplyRH: number;      // %
  
  // Acoustics
  acousticAbsorption: AcousticAbsorptionIndicator;

  // Outputs (Calculated results)
  calculatedVolume: number; // m^3/h (V_final)
  realACH: number;          // 1/h (ACH_real)
}

// ============================================
// 2. DUCT NETWORK (DAG GRAPH)
// ============================================

export type NodeType = 'TERMINAL' | 'BRANCH' | 'SILENCER' | 'DAMPER' | 'FAN' | 'ROOM_CONNECTION'
export type DuctShape = 'CIRCULAR' | 'RECTANGULAR'

export interface DuctNode {
  id: string;
  type: NodeType;
  zoneId?: string; // If node connects to a Zone
  
  // Aerodynamics
  flow: number; // m^3/h (calculated or input)
  pressureDropLocal: number; // Pa (miejscowy spadek ciśnienia - zeta factor equivalent)
  
  // Acoustics (8 octave bands: 63, 125, 250, 500, 1000, 2000, 4000, 8000 Hz)
  soundPowerLevel: number[]; // dB (Moc akustyczna)
}

export interface DuctSegment {
  id: string;
  sourceNodeId: string; // From Node
  targetNodeId: string; // To Node
  
  // Geometry
  length: number; // m
  shape: DuctShape;
  
  // Dimensions 
  // Stored in mm based on UI input requirements, converted to m in PhysicsEngine
  diameter?: number; // mm (for CIRCULAR)
  width?: number;    // mm (for RECTANGULAR)
  height?: number;   // mm (for RECTANGULAR)
  
  // Materials & Insulation
  roughness: number;                   // m (e.g. 0.00015 for galv. steel)
  internalInsulationThickness: number; // m
  externalInsulationThickness: number; // m
  
  // Outputs
  velocity: number;        // m/s
  pressureDropLin: number; // Pa (Liniowy spadek ciśnienia)
}

// ============================================
// 3. PROJECT STATE (Persisted via JSONB)
// ============================================

export interface ProjectStateData {
  zones: Record<string, ZoneData>;
  nodes: Record<string, DuctNode>;
  edges: Record<string, DuctSegment>;
}
