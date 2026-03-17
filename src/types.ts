/**
 * HVAC Data Foundation (Step 1)
 * SINGLE SOURCE OF TRUTH FOR HVAC SYSTEM TYPES
 * Based on docs/01-system-guardrails.md and docs/05-hvac-formulas.md
 */

// ============================================
// 1. ZONES & AIR BALANCE
// ============================================

export type ActivityType = 
  | 'Akumulatornia'
  | 'Apteka: Izba recepturowa'
  | 'Apteka: Izba homeopatyczna'
  | 'Apteka: Zmywalnia'
  | 'Apteka: Pozostałe'
  | 'Archiwum'
  | 'Garaż zamknięty (<10 stan.)'
  | 'Gastronomia: Kuchnia'
  | 'Gastronomia: Obieralnia'
  | 'Gastronomia: Zmywalnia'
  | 'Gastronomia: Przygotowalnia'
  | 'Gastronomia: Rozdzielnia kelnerska'
  | 'Gastronomia: Magazyn produktów suchych'
  | 'Gastronomia: Magazyn napojów'
  | 'Gastronomia: Magazyn bielizny czystej'
  | 'Jadalnia'
  | 'Komunikacja / Korytarz'
  | 'Laboratorium chemiczne'
  | 'Magazyn oleju opałowego'
  | 'Komora malowania / natryskowa'
  | 'Natryski'
  | 'Palarnia'
  | 'Służba zdrowia: Gabinet lekarski'
  | 'Służba zdrowia: Gabinet zabiegowy'
  | 'Służba zdrowia: Zabiegowy (znieczulenie)'
  | 'Służba zdrowia: Sterylizatornia'
  | 'Służba zdrowia: Gabinet RTG'
  | 'Pomieszczenie socjalne'
  | 'Szatnia okryć wierzchnich'
  | 'Szatnia personelu (pozostałe)'
  | 'Umywalnia'
  | 'CUSTOM';

export type AcousticAbsorptionIndicator = 'HARD' | 'MEDIUM' | 'SOFT'

export type CalculationMode = 'AUTO_MAX' | 'MANUAL' | 'HYGIENIC_ONLY' | 'ACH_ONLY' | 'THERMAL_ONLY';

export interface AirTransfer {
  volume: number;
  roomId: string; // ID of the connected room
}

// Kondygnacja (piętro budynku)
export interface Floor {
  id: string;
  name: string;      // np. "Parter", "+1 Piętro"
  elevation: number; // Rzędna terenu [m], np. 0.0, 3.5
  order: number;     // Kolejność wyświetlania
  originDescription?: string; // np. "Przecięcie osi A i 1"
}

export interface ZoneData {
  id: string;
  nr: string;
  name: string;
  activityType: ActivityType;
  
  // Systems
  systemSupplyId?: string; // e.g. 'NW1'
  systemExhaustId?: string; // e.g. 'WW1'
  floorId: string; // REQUIRED - must belong to a floor
  
  // Geometry
  area: number;   // Wartość ostateczna [m²] - zaokrąglona do 2 miejsc
  manualArea: number; // Wartość wpisana ręcznie przez użytkownika [m²]
  geometryArea: number | null; // Powierzchnia wyliczona z poligonu CAD [m²]
  isAreaManual: boolean; // Flaga sterująca (domyślnie: true)
  height: number; // m
  manualVolume?: number | null; // kubatura podana ręcznie
  
  // Air Volume Inputs
  calculationMode: CalculationMode;
  occupants: number;
  dosePerOccupant: number; // m^3/h 
  isTargetACHManual: boolean; // Flaga określająca, czy użytkownik ręcznie podał krotność
  manualTargetACH: number | null; // Wartość wpisana ręcznie przez inżyniera [1/h]
  targetACH: number;       // 1/h (Legacy/Computed - W oparciu o normy i flagę)
  normativeVolume: number; // m^3/h (używane jako manual supply w MANUAL mode)
  normativeExhaust: number; // m^3/h (dla potrzeb kuchni, toalet)
  
  // Transfers
  transferIn: AirTransfer[];
  transferOut: AirTransfer[];
  
  // Thermodynamics (V_term)
  totalHeatGain: number; // W (Total heat gains, jawne + utajone)
  roomTemp: number;      // °C
  roomRH: number;        // %
  supplyTemp: number;    // °C
  supplyRH: number;      // %
  
  // Acoustics
  acousticAbsorption: AcousticAbsorptionIndicator;
  isMaxDbAManual: boolean;     // If true, use manualMaxAllowedDbA instead of preset
  manualMaxAllowedDbA: number | null; // User-overridden noise limit
  maxAllowedDbA: number; // Preset/computed noise limit [dB(A)]

  // Outputs (Calculated results)
  calculatedVolume: number;  // m^3/h (V_final nawiew)
  calculatedExhaust: number; // m^3/h (V_final wyciąg)
  transferInSum: number;     // m^3/h
  transferOutSum: number;    // m^3/h
  netBalance: number;        // m^3/h: (Nawiew + Transfer IN) - (Wyciąg + Transfer OUT)
  realACH: number;           // 1/h (ACH_real)
  thermodynamicError?: boolean; // True if enthalpy difference is <= 0 while cooling
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
  systemId: string; // np. 'NW1', 'WW1'
  ahuId: string;    // Powiązanie z konkretną centralą wentylacyjną
  
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
  systemId: string;
  ahuId: string;
  
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
  internalInsulationThickness: number; // mm
  externalInsulationThickness: number; // mm
  
  // Outputs
  velocity: number;        // m/s
  pressureDropLin: number; // Pa (Liniowy spadek ciśnienia)
}

// ============================================
// 3. PROJECT STATE (Persisted via JSONB)
// ============================================

// Definicja Systemu Wentylacyjnego
export interface SystemDef {
  id: string;
  name: string;
  type: 'SUPPLY' | 'EXHAUST' | 'INTAKE' | 'OUTTAKE';
  color?: string; // HEX color for visualization
  patternId?: string; // Optional hatch pattern ID
  isColorPriority?: boolean;
  isPatternPriority?: boolean;
  opacity?: number; // 0-100
}

// Scenariusz Analizy (Krok 1.7)
export interface AnalysisPreset {
  id: string;
  name: string;
  systemIds: string[];
  floorIds: string[];
  description?: string;
}

// System Style Preset (Krok 1.8)
export interface StylePreset {
  id: string;
  name: string;
  systemStyles: {
    systemId: string;
    color?: string;
    patternId?: string;
    isColorPriority: boolean;
    isPatternPriority: boolean;
    opacity?: number; // 0-100
  }[];
}

export interface ProjectStateData {
  floors: Record<string, Floor>;
  zones: Record<string, ZoneData>;
  systems: SystemDef[];
  analysisPresets: AnalysisPreset[];
  stylePresets: StylePreset[];
  isSystemColoringEnabled: boolean;
  globalSystemOpacity: number;
  columnState: any | null;
}

// Rekord Projektu
export interface Project {
  id: string;
  name: string;
  state_data: ProjectStateData;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Snapshot (Migawka) Projektu
export interface ProjectVersion {
  id: string;
  project_id: string;
  name: string;
  state_data: ProjectStateData;
  created_at: string;
}

export type SyncStatus = 'SAVED' | 'SAVING' | 'ERROR';
