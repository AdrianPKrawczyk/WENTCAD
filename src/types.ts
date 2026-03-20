/**
 * HVAC Data Foundation (Step 1)
 * SINGLE SOURCE OF TRUTH FOR HVAC SYSTEM TYPES
 * Based on docs/01-system-guardrails.md and docs/05-hvac-formulas.md
 */

export type TagFieldType = 
  | 'ROOM_NR_NAME' | 'AREA' | 'VOLUME' 
  | 'FLOW_SUPPLY' | 'FLOW_EXHAUST' 
  | 'FLOW_SUPPLY_WITH_SYSTEM' | 'FLOW_EXHAUST_WITH_SYSTEM'
  | 'REAL_ACH' | 'ACOUSTICS'
  | 'SUPPLY_SYSTEM_NAME'
  | 'EXHAUST_SYSTEM_NAME'
  | 'INTERNAL_TEMP'
  | 'OCCUPANTS'
  | 'HEAT_GAINS';

export interface TagFieldConfig {
  id: string;
  type: TagFieldType;
  enabled: boolean;
  prefix: string;
  suffix: string;
  order: number;
  column: 1 | 2;
}

export interface GlobalTagSettings {
  fields: TagFieldConfig[];
  fontSize: number;
  fillColor: string; // Tło metki, np. '#ffffff'
  strokeColor: string; // Ramka metki, np. '#000000'
  isFixedSize: boolean;
}

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
  dxfOutlines?: {
    id: string;
    points: number[];
    area: number;
  }[];
  exportRegions?: { id: string; name: string; x: number; y: number; width: number; height: number }[];
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
  tagPosition?: { x: number; y: number } | null;
  
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

// Legacy - kept for backward compatibility
export type NodeType = 'TERMINAL' | 'BRANCH' | 'SILENCER' | 'DAMPER' | 'FAN' | 'ROOM_CONNECTION'

// New hierarchy: ComponentCategory → ComponentType
export type ComponentCategory = 
  | 'EQUIPMENT'   // AHU, Fan, Heat Recovery
  | 'TERMINAL'    // Anemostats, Grilles, Diffusers
  | 'INLINE'      // Dampers, Fire Dampers, Silencers, Heaters, Coolers
  | 'JUNCTION'    // Tees, Crosses, Wyes
  | 'SHAFT'       // Vertical shafts through floors
  | 'VIRTUAL_ROOT'; // Virtual root for flow summation

export type ComponentType = 
  // EQUIPMENT
  | 'AHU' | 'FAN' | 'HEAT_RECOVERY'
  // TERMINAL
  | 'ANEMOSTAT' | 'GRILLE' | 'DIFFUSER' | 'LOUVRE' | 'AIR_VALVE'
  // INLINE
  | 'DAMPER' | 'FIRE_DAMPER' | 'SILENCER' | 'HEATER' | 'COOLER' | 'FILTER_BOX'
  // JUNCTION
  | 'TEE' | 'CROSS' | 'WYE'
  // SHAFT
  | 'SHAFT_UP' | 'SHAFT_DOWN' | 'SHAFT_THROUGH'
  // VIRTUAL_ROOT
  | 'VIRTUAL_ROOT';

// Default component type for each category
export const CATEGORY_DEFAULT_TYPE: Record<ComponentCategory, ComponentType> = {
  EQUIPMENT: 'AHU',
  TERMINAL: 'ANEMOSTAT',
  INLINE: 'DAMPER',
  JUNCTION: 'TEE',
  SHAFT: 'SHAFT_THROUGH', // Przelotowy jako domyślny
  VIRTUAL_ROOT: 'VIRTUAL_ROOT',
};

// Map old NodeType to new ComponentCategory (for migration)
export const NODE_TYPE_TO_CATEGORY: Record<NodeType, ComponentCategory> = {
  TERMINAL: 'TERMINAL',
  BRANCH: 'JUNCTION',
  SILENCER: 'INLINE',
  DAMPER: 'INLINE',
  FAN: 'EQUIPMENT',
  ROOM_CONNECTION: 'TERMINAL',
};

export type DuctShape = 'CIRCULAR' | 'RECTANGULAR'

export interface DuctNode {
  id: string;
  // Legacy field - kept for compatibility, use componentCategory instead
  type: NodeType;
  // New typed fields
  componentCategory: ComponentCategory;
  componentType: ComponentType;
  zoneId?: string; // If node connects to a Zone
  systemId: string; // np. 'NW1', 'WW1'
  ahuId: string;    // Powiązanie z konkretną centralą wentylacyjną
  
  // Coordinates
  x: number;
  y: number;
  floorId: string;
  
  // Aerodynamics
  flow: number; // m^3/h (calculated or input from zone)
  pressureDropLocal: number; // Pa (miejscowy spadek ciśnienia - zeta factor equivalent)
  
  // Flow distribution (for TERMINALs in same zone)
  flowFraction?: number; // 0.0-1.0, default 1.0 for single terminal
  
  // Visual rotation for INLINE components (degrees)
  rotation?: number;
  
  // Dimension lock for pricing (Krok 7)
  isLocked?: boolean;
  
  // AHU/FAN parameters (for Krok 4 physics) - w cm dla UX
  ratedFlow?: number;    // m³/h nominal
  ratedPressure?: number; // Pa nominal
  widthCm?: number;     // Szerokość w cm (dla EQUIPMENT)
  heightCm?: number;    // Wysokość w cm (dla EQUIPMENT)
  lengthCm?: number;    // Długość w cm (dla EQUIPMENT/FAN)
  
  // TERMINAL dimensions - w cm
  terminalWidthCm?: number;
  terminalHeightCm?: number;
  terminalDiameterCm?: number;
  
  // Heat exchanger parameters
  heatRecoveryType?: 'ROTARY' | 'PLATE' | 'HEAT_PIPE' | 'RUN_AROUND';
  efficiency?: number;    // 0-1
  
  // INLINE component dimensions (for rendering)
  width?: number;  // mm
  height?: number; // mm
  
  // SHAFT parameters
  shaftId?: string;           // Unikalny identyfikator pionu (np. "P1")
  shaftAutoNumber?: number;   // Numer automatyczny (1, 2, 3...)
  shaftRange?: {              // Zakres kondygnacji
    fromFloorId: string;      // Od kondygnacji
    toFloorId: string;         // Do kondygnacji
  };
  shaftShiftX?: number;       // Przesunięcie X na innych kondygnacjach (px)
  shaftShiftY?: number;       // Przesunięcie Y na innych kondygnacjach (px)
  
  // Acoustics (8 octave bands: 63, 125, 250, 500, 1000, 2000, 4000, 8000 Hz)
  // Placeholder for Krok 6 - initialized to zeros
  soundPowerLevel: number[];
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
  globalPatternScale?: number;
  globalTagSettings: GlobalTagSettings;
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

// ============================================
// DXF EXPORT SETTINGS
// ============================================

export interface DxfExportSettings {
  fontHeight: number;    // Wysokość czcionki metek w metrach [0.05 - 0.5]
  lineSpacing: number;   // Mnożnik wysokości czcionki na odstęp między wierszami [0.25 - 2.0]
  paddingX: number;      // Mnożnik wysokości czcionki na margines poziomy ramki [0.2 - 2.0]
  paddingY: number;      // Mnożnik wysokości czcionki na margines pionowy ramki [0.1 - 1.0]
}

export const DEFAULT_DXF_EXPORT_SETTINGS: DxfExportSettings = {
  fontHeight: 0.1,    // 10 cm jako domyślna wysokość czcionki
  lineSpacing: 1.25,  // odstęp między wierszami = 1.25 × fontHeight
  paddingX: 1.0,     // margines poziomy = 1.0 × fontHeight
  paddingY: 0.36,     // margines pionowy = 0.36 × fontHeight
};
