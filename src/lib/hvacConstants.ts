import type { ActivityType } from '../types';

export interface RoomPreset {
  ach: number;       // [1/h] - Target Air Change Rate
  maxDbA: number;    // [dB(A)] - Maximum allowed noise level
}

/**
 * Single source of truth for room type presets.
 * Source: docs/06-krotnosci_wymian.md
 */
export const ROOM_PRESETS: Record<ActivityType, RoomPreset> = {
  'Akumulatornia':                            { ach: 6.0,  maxDbA: 50 },
  'Apteka: Izba recepturowa':                 { ach: 2.0,  maxDbA: 40 },
  'Apteka: Izba homeopatyczna':               { ach: 2.0,  maxDbA: 40 },
  'Apteka: Zmywalnia':                        { ach: 2.0,  maxDbA: 45 },
  'Apteka: Pozostałe':                        { ach: 1.5,  maxDbA: 40 },
  'Archiwum':                                 { ach: 3.0,  maxDbA: 45 },
  'Garaż zamknięty (<10 stan.)':              { ach: 1.5,  maxDbA: 55 },
  'Gastronomia: Kuchnia':                     { ach: 22.5, maxDbA: 50 },
  'Gastronomia: Obieralnia':                  { ach: 5.0,  maxDbA: 50 },
  'Gastronomia: Zmywalnia':                   { ach: 10.0, maxDbA: 50 },
  'Gastronomia: Przygotowalnia':              { ach: 6.0,  maxDbA: 50 },
  'Gastronomia: Rozdzielnia kelnerska':       { ach: 9.0,  maxDbA: 45 },
  'Gastronomia: Magazyn produktów suchych':   { ach: 2.5,  maxDbA: 50 },
  'Gastronomia: Magazyn napojów':             { ach: 2.5,  maxDbA: 50 },
  'Gastronomia: Magazyn bielizny czystej':    { ach: 1.5,  maxDbA: 45 },
  'Jadalnia':                                 { ach: 2.0,  maxDbA: 45 },
  'Komunikacja / Korytarz':                   { ach: 1.5,  maxDbA: 45 },
  'Laboratorium chemiczne':                   { ach: 11.0, maxDbA: 45 },
  'Magazyn oleju opałowego':                  { ach: 3.0,  maxDbA: 50 },
  'Komora malowania / natryskowa':            { ach: 10.0, maxDbA: 55 },
  'Natryski':                                 { ach: 5.0,  maxDbA: 45 },
  'Palarnia':                                 { ach: 10.0, maxDbA: 45 },
  'Służba zdrowia: Gabinet lekarski':         { ach: 2.0,  maxDbA: 35 },
  'Służba zdrowia: Gabinet zabiegowy':        { ach: 3.5,  maxDbA: 40 },
  'Służba zdrowia: Zabiegowy (znieczulenie)': { ach: 10.0, maxDbA: 40 },
  'Służba zdrowia: Sterylizatornia':          { ach: 5.0,  maxDbA: 45 },
  'Służba zdrowia: Gabinet RTG':              { ach: 1.5,  maxDbA: 40 },
  'Pomieszczenie socjalne':                   { ach: 2.0,  maxDbA: 45 },
  'Szatnia okryć wierzchnich':               { ach: 2.0,  maxDbA: 45 },
  'Szatnia personelu (pozostałe)':            { ach: 4.0,  maxDbA: 45 },
  'Umywalnia':                                { ach: 2.0,  maxDbA: 45 },
  'CUSTOM':                                   { ach: 1.5,  maxDbA: 35 },
};

/** Backwards-compatible map of ACH values only */
export const ROOM_TYPE_ACH_MAPPING: Record<ActivityType, number> = Object.fromEntries(
  Object.entries(ROOM_PRESETS).map(([k, v]) => [k, v.ach])
) as Record<ActivityType, number>;

export const DEFAULT_ACTIVITY_TYPE: ActivityType = 'CUSTOM';
