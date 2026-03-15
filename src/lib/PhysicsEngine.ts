import psychrolib from 'psychrolib';
import type { ZoneData } from '../types';

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
export function calculateZoneAirBalance(zone: ZoneData): { calculatedVolume: number; realACH: number } {
  // 1. Zapotrzebowanie higieniczne
  const vHig = zone.occupants * zone.dosePerOccupant;

  // 2. Krotność wymian
  const volume = zone.area * zone.height;
  const vKrotnosc = zone.targetACH * volume;

  // 3. Normatywne
  const vNorm = zone.normativeVolume;

  // 4. Termodynamiczne (Chłodzenie)
  let vTerm = 0;
  if (zone.totalHeatGain > 0 && zone.supplyTemp < zone.roomTemp) {
    const hp = calculateEnthalpy(zone.roomTemp, zone.roomRH);
    const hn = calculateEnthalpy(zone.supplyTemp, zone.supplyRH);
    
    const enthalpyDiff = hp - hn;
    if (enthalpyDiff > 0) {
      // V_term = Q_total * 3.6 / (1.2 * (h_p - h_n))
      vTerm = (zone.totalHeatGain * 3.6) / (AIR_DENSITY * enthalpyDiff);
    }
  }

  // Wydatek końcowy - Maximum
  const calculatedVolume = Math.max(vHig, vKrotnosc, vNorm, vTerm);

  // Rzeczywista krotność wymian
  // Handle edge case division by zero
  let realACH = 0;
  if (volume > 0) {
    realACH = calculatedVolume / volume;
  }

  return {
    calculatedVolume: Math.ceil(calculatedVolume), // Wartość zaokrąglona w górę dla wygody inżynierskiej, chociaż można zostawić float
    realACH: parseFloat(realACH.toFixed(2))
  };
}
