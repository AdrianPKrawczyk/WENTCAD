declare module 'psychrolib' {
  export const SI: any;
  export const IP: any;
  export function SetUnitSystem(system: any): void;
  export function GetHumRatioFromRelHum(tDryBulb: number, relHum: number, pressure: number): number;
  export function GetMoistAirEnthalpy(tDryBulb: number, humRatio: number): number;
}
