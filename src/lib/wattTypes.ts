export type IfcMaterial = {
  id: string;
  name: string;
  category: string;
  thermalConductivity: number; // lambda [W/(m*K)]
  massDensity: number; // rho [kg/m^3]
  specificHeatCapacity: number; // cp [J/(kg*K)]
};

export type IfcMaterialLayer = {
  id: string;
  materialId: string;
  thickness: number; // d [m]
};

export type IfcMaterialLayerSet = {
  id: string;
  name: string;
  layers: IfcMaterialLayer[];
};

export type IfcWallType = {
  id: string;
  name: string;
  layerSetId: string;
  predefinedType: 'SOLIDWALL' | 'PARTITIONING' | 'STANDARD';
  isExternal: boolean;
  thermalType?: 'WALL' | 'FLOOR' | 'ROOF'; // NEW: for Rsi/Rse selection
  isGroundContact?: boolean; // NEW: for Rse=0
};

export type IfcWindowStyle = {
  id: string;
  name: string;
  overallUValue: number; // Uw [W/(m^2*K)]
  solarHeatGainCoefficient: number; // g [0-1]
  type?: 'WINDOW' | 'DOOR'; 
};

export type OpeningInstance = {
  id: string;
  windowStyleId?: string; // Reference to IfcWindowStyle
  width: number; // B [m]
  height: number; // H [m]
  sillHeight: number; // Ho [m]
  placement: number; // Offset on the wall length [m]
  centroid?: { x: number; y: number };
};

export type ZoneBoundary = {
  id: string;
  relatedWallTypeId?: string; // Reference to IfcWallType
  isExternal: boolean;
  type: 'INTERIOR' | 'EXTERIOR' | 'UNRESOLVED';
  geometry: {
    lengthNet: number; // L_osi [m]
    lengthGross?: number; // L_wew [m]
    azimuth: number; // Degrees from North
    thickness: number; // d [m]
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  };
  adjacentZoneId?: string; // If INTERIOR
  openings: OpeningInstance[];
};

export type Floor = {
  id: string;
  name: string;
  elevation: number; // rzędna poziomu podłogi [m]
  order: number;
  originDescription?: string;
  
  // WATT thermal heights [m]
  heightTotal: number;     // H_brutto: od podłogi do podłogi (lub dachu)
  heightNet: number;       // H_netto: od podłogi do stropu
  heightSuspended: number; // H_hvac: od podłogi do sufitu podwieszanego
};

export type HorizontalBoundary = {
  id: string;
  type: 'ROOF' | 'FLOOR_EXTERIOR' | 'CEILING_INTERIOR' | 'FLOOR_INTERIOR' | 'FLOOR_GROUND';
  area: number; // [m^2]
  uValueRef?: string; // Reference to Slab/Roof type
};

export type BuildingFootprint = {
  outer: { x: number; y: number }[];
  courtyards: { x: number; y: number }[][]; // DZIEDZIŃCE: Holes in the building footprint
};
