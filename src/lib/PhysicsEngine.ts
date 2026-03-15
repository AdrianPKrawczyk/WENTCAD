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

/**
 * Oblicza ostateczny bilans powietrza dla strefy (Air Balance)
 * Implementuje Zasadę Maximum oraz TDD z docs/05-hvac-formulas.md
 */
export function calculateZoneAirBalance(zone: ZoneData) {
  // 1. Zapotrzebowanie higieniczne
  const vHig = zone.occupants * zone.dosePerOccupant;

  // 2. Krotność wymian (Wyznaczenie docelowej krotności z uwzględnieniem flagi Manual)
  const computedACH = zone.isTargetACHManual 
    ? (zone.manualTargetACH ?? 0) 
    : (ROOM_TYPE_ACH_MAPPING[zone.activityType] ?? ROOM_TYPE_ACH_MAPPING[DEFAULT_ACTIVITY_TYPE]);

  const volume = (zone.manualVolume !== null && zone.manualVolume !== undefined && zone.manualVolume > 0) 
    ? zone.manualVolume 
    : (zone.area * zone.height);
    
  const vKrotnosc = computedACH * volume;

  // 3. Normatywne
  const vNorm = zone.normativeVolume || 0;

  // 4. Termodynamiczne (Chłodzenie)
  let vTerm = 0;
  let thermodynamicError = false;
  if (zone.totalHeatGain > 0 && zone.supplyTemp < zone.roomTemp) {
    const hp = calculateEnthalpy(zone.roomTemp, zone.roomRH);
    const hn = calculateEnthalpy(zone.supplyTemp, zone.supplyRH);
    
    const enthalpyDiff = hp - hn;
    if (enthalpyDiff > 0) {
      // V_term = Q_total * 3.6 / (1.2 * (h_p - h_n))
      vTerm = (zone.totalHeatGain * 3.6) / (AIR_DENSITY * enthalpyDiff);
    } else {
      // Entalpia nawiewu jest wyższa (lub równa) entalpii w pomieszczeniu mimo niższej temperatury.
      // Powietrze nawiewane wprowadza więcej ciepła utajonego (wilgoci) niż odbiera ciepła jawnego.
      // Chłodzenie całkowite jest niemożliwe.
      thermodynamicError = true;
    }
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
    case 'MANUAL':
      calculatedVolumeRaw = vNorm;
      break;
    case 'AUTO_MAX':
    default:
      calculatedVolumeRaw = Math.max(vHig, vKrotnosc, vNorm, vTerm);
      break;
  }

  const calculatedVolume = Math.ceil(calculatedVolumeRaw);
  
  // Transfery (potrzebne do auto-bilansowania wyciągu)
  const transferInSum = zone.transferIn ? zone.transferIn.reduce((sum, t) => sum + t.volume, 0) : 0;
  const transferOutSum = zone.transferOut ? zone.transferOut.reduce((sum, t) => sum + t.volume, 0) : 0;

  // Wyciąg (Exhaust)
  // Jeśli użytkownik zdefiniował jawnie wydatek wyciągowy normatywny (>0), używamy go.
  // W przeciwnym razie, jeśli strefa ma przypisany system wyciągowy, automatycznie bilansujemy pomieszczenie do 0.
  let calculatedExhaustRaw = zone.normativeExhaust || 0;
  
  if (calculatedExhaustRaw === 0 && zone.systemExhaustId && zone.systemExhaustId !== 'Brak') {
    calculatedExhaustRaw = Math.max(0, calculatedVolume + transferInSum - transferOutSum);
  }
  
  const calculatedExhaust = Math.ceil(calculatedExhaustRaw);

  // Net Balance
  const netBalance = (calculatedVolume + transferInSum) - (calculatedExhaust + transferOutSum);

  // Rzeczywista krotność wymian (największa z dostarczonego lub wyciąganego dla krotności)
  let realACH = 0;
  if (volume > 0) {
    const dominantFlow = Math.max(calculatedVolume + transferInSum, calculatedExhaust + transferOutSum);
    realACH = dominantFlow / volume;
  }

  return {
    calculatedVolume,
    calculatedExhaust,
    transferInSum,
    transferOutSum,
    netBalance,
    realACH: parseFloat(realACH.toFixed(2)),
    targetACH: computedACH,
    thermodynamicError
  };
}
