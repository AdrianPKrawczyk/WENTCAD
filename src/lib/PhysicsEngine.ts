import psychrolib from 'psychrolib';
import type { ZoneData } from '../types';
import { ROOM_TYPE_ACH_MAPPING, DEFAULT_ACTIVITY_TYPE } from './hvacConstants';

// Inicjalizacja biblioteki psychrolib do jednostek SI
psychrolib.SetUnitSystem(psychrolib.SI);

const ATMOSPHERIC_PRESSURE = 101325; // Standard atmospheric pressure in Pa
const AIR_DENSITY = 1.2; // kg/m^3 (From HVAC_FORMULAS.md)

/**
 * Zwraca entalpię powietrza [kJ/kg] na podstawie temperatury i wilgotności względnej.
 * @param temp Temperature in °C
 * @param rh Relative Humidity in % (0 - 100)
 */
export function calculateEnthalpy(temp: number, rh: number): number {
  if (temp === undefined || rh === undefined) return 0;
  // psychrolib oczekuje RH w formacie 0.0 - 1.0 (może zależeć od wersji lib, dla pewności użyjmy psychrolib funkcji)
  // GetHumRatioFromRelHum(TDryBulb, RelHum, Pressure) -> RelHum is 0.0 to 1.0
  const humRatio = psychrolib.GetHumRatioFromRelHum(temp, rh / 100, ATMOSPHERIC_PRESSURE);
  const enthalpy = psychrolib.GetMoistAirEnthalpy(temp, humRatio);
  return enthalpy / 1000; // psychrolib returns J/kg in SI, we need kJ/kg or we can use J/kg
  // Wait, in psychrolib SI, enthalpy is returned in J/kg.
  // We divide by 1000 to get kJ/kg for our formula, or we just adjust formula:
  // formula: V_term = Q_total * 3.6 / (1.2 * (h_p - h_n)) 
  // if h_p and h_n are in kJ/kg, it works out if 3.6 factor is used.
}

const SPECIFIC_HEAT_AIR = 1005; // J/(kg·K)

/**
 * Oblicza ostateczny bilans powietrza dla strefy (Air Balance)
 * Implementuje Zasadę Maximum oraz TDD z docs/05-hvac-formulas.md
 */
export function calculateZoneAirBalance(zone: ZoneData) {
  // 1. Zapotrzebowanie higieniczne
  const vHig = (zone.occupants || 0) * (zone.dosePerOccupant || 0);

  // 2. Krotność wymian
  const computedACH = zone.isTargetACHManual 
    ? (zone.manualTargetACH ?? 0) 
    : (ROOM_TYPE_ACH_MAPPING[zone.activityType] ?? ROOM_TYPE_ACH_MAPPING[DEFAULT_ACTIVITY_TYPE]);

  const volumeM3 = zone.isVolumeManual 
    ? (zone.manualVolume || 0) 
    : (zone.area * zone.height);
    
  const vKrotnosc = computedACH * volumeM3;

  // 3. Normatywne
  const vNorm = zone.normativeVolume || 0;

  // 4. Termodynamiczne (Legacy/Simple Chłodzenie)
  let vTerm = 0;
  let thermodynamicError = false;
  if ((zone.totalHeatGain || 0) > 0 && (zone.supplyTemp || 0) < (zone.roomTemp || 0)) {
    const hp = calculateEnthalpy(zone.roomTemp, zone.roomRH);
    const hn = calculateEnthalpy(zone.supplyTemp, zone.supplyRH);
    const enthalpyDiff = hp - hn;
    if (enthalpyDiff > 0) {
      vTerm = (zone.totalHeatGain * 3.6) / (AIR_DENSITY * enthalpyDiff);
    } else {
      thermodynamicError = true;
    }
  }

  // 5. WATT - Od straty ciepła (ZIMA)
  let vHeatLoss = 0;
  const currentHeatLoss = zone.isHeatLossManual ? (zone.manualHeatLoss || 0) : (zone.wattHeatLoss || 0);
  const dT_winter = (zone.supplyTempWinter || 0) - (zone.roomTempWinter || 0);
  if (currentHeatLoss > 0 && dT_winter > 0) {
    // V = Q * 3600 / (rho * cp * dT)
    vHeatLoss = (currentHeatLoss * 3600) / (AIR_DENSITY * SPECIFIC_HEAT_AIR * dT_winter);
  }

  // 6. WATT - Od zysków ciepła jawnego (LATO)
  let vHeatGain = 0;
  const currentSensibleGain = zone.isSensibleGainManual ? (zone.manualSensibleGain || 0) : (zone.wattSensibleGain || 0);
  const dT_summer = (zone.roomTempSummer || 0) - (zone.supplyTempSummer || 0);
  if (currentSensibleGain > 0 && dT_summer > 0) {
    vHeatGain = (currentSensibleGain * 3600) / (AIR_DENSITY * SPECIFIC_HEAT_AIR * dT_summer);
  }

  // 7. WATT - Od asymilacji wilgoci (LATO/ZIMA - zwykle Lato dla osuszania, ale tutaj ogólne)
  let vMoisture = 0;
  const currentMoistureGain = zone.isMoistureGainManual ? (zone.manualMoistureGain || 0) : (zone.wattMoistureGain || 0);
  
  // Oblicz x (Humidity Ratio) dla pokoju i nawiewu (sezon lato jako domyślny dla wilgoci)
  const x_room = psychrolib.GetHumRatioFromRelHum(zone.roomTempSummer || 24, (zone.roomRHSummer || 50) / 100, ATMOSPHERIC_PRESSURE);
  const x_supply = psychrolib.GetHumRatioFromRelHum(zone.supplyTempSummer || 18, (zone.supplyRHSummer || 90) / 100, ATMOSPHERIC_PRESSURE);
  const dX = (x_room - x_supply) * 1000; // g/kg
  
  if (currentMoistureGain > 0 && dX > 0) {
    // V = W [g/s] * 3600 / (rho * dX [g/kg])
    vMoisture = (currentMoistureGain * 3600) / (AIR_DENSITY * dX);
  }

  // Wydatek końcowy - zależny od trybu obliczeń
  let calculatedVolumeRaw = 0;
  const mode = zone.calculationMode || 'AUTO_MAX';
  
  switch (mode) {
    case 'HYGIENIC_ONLY':
      calculatedVolumeRaw = vHig;
      break;
    case 'ACH_ONLY':
      calculatedVolumeRaw = vKrotnosc;
      break;
    case 'THERMAL_ONLY':
      calculatedVolumeRaw = vTerm;
      break;
    case 'HEAT_LOSS':
      calculatedVolumeRaw = vHeatLoss;
      break;
    case 'HEAT_GAIN':
      calculatedVolumeRaw = vHeatGain;
      break;
    case 'MOISTURE_GAIN':
      calculatedVolumeRaw = vMoisture;
      break;
    case 'MANUAL':
      calculatedVolumeRaw = vNorm;
      break;
    case 'AUTO_MAX':
    default:
      calculatedVolumeRaw = Math.max(vHig, vKrotnosc, vNorm, vTerm, vHeatLoss, vHeatGain, vMoisture);
      break;
  }

  const calculatedVolume = Math.ceil(calculatedVolumeRaw);
  
  // Transfery
  const transferInSum = zone.transferIn ? zone.transferIn.reduce((sum, t) => sum + t.volume, 0) : 0;
  const transferOutSum = zone.transferOut ? zone.transferOut.reduce((sum, t) => sum + t.volume, 0) : 0;

  // Wyciąg
  let calculatedExhaustRaw = zone.normativeExhaust || 0;
  if (calculatedExhaustRaw === 0 && zone.systemExhaustId && zone.systemExhaustId !== 'Brak') {
    calculatedExhaustRaw = Math.max(0, calculatedVolume + transferInSum - transferOutSum);
  }
  
  const calculatedExhaust = Math.ceil(calculatedExhaustRaw);
  const netBalance = (calculatedVolume + transferInSum) - (calculatedExhaust + transferOutSum);

  let realACH = 0;
  if (volumeM3 > 0) {
    const dominantFlow = Math.max(calculatedVolume + transferInSum, calculatedExhaust + transferOutSum);
    realACH = dominantFlow / volumeM3;
  }

  return {
    calculatedVolume,
    calculatedExhaust,
    transferInSum,
    transferOutSum,
    netBalance,
    volume: volumeM3,
    realACH: parseFloat(realACH.toFixed(2)),
    targetACH: computedACH,
    thermodynamicError
  };
}
