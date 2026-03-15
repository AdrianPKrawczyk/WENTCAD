import type { ActivityType } from '../types';

export const ROOM_TYPE_ACH_MAPPING: Record<ActivityType, number> = {
  'Akumulatornia': 6.0,
  'Apteka: Izba recepturowa': 2.0,
  'Apteka: Izba homeopatyczna': 2.0,
  'Apteka: Zmywalnia': 2.0,
  'Apteka: Pozostałe': 1.5,
  'Archiwum': 3.0,
  'Garaż zamknięty (<10 stan.)': 1.5,
  'Gastronomia: Kuchnia': 22.5,
  'Gastronomia: Obieralnia': 5.0,
  'Gastronomia: Zmywalnia': 10.0,
  'Gastronomia: Przygotowalnia': 6.0,
  'Gastronomia: Rozdzielnia kelnerska': 9.0,
  'Gastronomia: Magazyn produktów suchych': 2.5,
  'Gastronomia: Magazyn napojów': 2.5,
  'Gastronomia: Magazyn bielizny czystej': 1.5,
  'Jadalnia': 2.0,
  'Komunikacja / Korytarz': 1.5,
  'Laboratorium chemiczne': 11.0,
  'Magazyn oleju opałowego': 3.0,
  'Komora malowania / natryskowa': 10.0,
  'Natryski': 5.0,
  'Palarnia': 10.0,
  'Służba zdrowia: Gabinet lekarski': 2.0,
  'Służba zdrowia: Gabinet zabiegowy': 3.5,
  'Służba zdrowia: Zabiegowy (znieczulenie)': 10.0,
  'Służba zdrowia: Sterylizatornia': 5.0,
  'Służba zdrowia: Gabinet RTG': 1.5,
  'Pomieszczenie socjalne': 2.0,
  'Szatnia okryć wierzchnich': 2.0,
  'Szatnia personelu (pozostałe)': 4.0,
  'Umywalnia': 2.0,
  'CUSTOM': 1.5, // Domyślna wartość w przypadku braku typu
};

export const DEFAULT_ACTIVITY_TYPE: ActivityType = 'CUSTOM';
