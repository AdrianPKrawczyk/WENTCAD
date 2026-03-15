import { useState, useEffect } from 'react';
import type { ZoneData, ActivityType, CalculationMode } from '../types';
import { ROOM_TYPE_ACH_MAPPING, DEFAULT_ACTIVITY_TYPE } from '../lib/hvacConstants';

interface RoomWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: ZoneData) => void;
}

export function RoomWizardModal({ isOpen, onClose, onSave }: RoomWizardModalProps) {
  const [activityType, setActivityType] = useState<ActivityType>(DEFAULT_ACTIVITY_TYPE);
  const [nr, setNr] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState(15);
  const [height, setHeight] = useState(3);
  
  // Specific options
  const [occupants, setOccupants] = useState(2);
  const [dosePerOccupant, setDosePerOccupant] = useState(30);
  
  const [toilets, setToilets] = useState(1);
  const [urinals, setUrinals] = useState(0);
  const [showers, setShowers] = useState(0);
  const [kitchenExhaust, setKitchenExhaust] = useState(200);

  // ACH logic
  const [achInput, setAchInput] = useState<number>(ROOM_TYPE_ACH_MAPPING[DEFAULT_ACTIVITY_TYPE]);
  const [isTargetACHManual, setIsTargetACHManual] = useState(false);

  // Zmiana typu pomieszczenia
  useEffect(() => {
    if (!isTargetACHManual) {
      setAchInput(ROOM_TYPE_ACH_MAPPING[activityType] || 0);
    }
    // Auto-wypełnianie nazwy na podstawie typu jeśli jest pusta lub była równa poprzedniemu typowi
    if (!name || Object.keys(ROOM_TYPE_ACH_MAPPING).includes(name)) {
      setName(activityType === 'CUSTOM' ? 'Pomieszczenie' : activityType);
    }
  }, [activityType]);

  const handleAchChange = (val: number) => {
    setAchInput(val);
    const defaultAch = ROOM_TYPE_ACH_MAPPING[activityType] || 0;
    if (val !== defaultAch) {
      setIsTargetACHManual(true);
    } else {
      setIsTargetACHManual(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    let calculationMode: CalculationMode = 'AUTO_MAX';
    let normativeVolume = 0;
    let normativeExhaust = 0;

    // Jeżeli wybrany typ sugeruje pomieszczenie czysto wyciągowe (kuchnia, łazienka)
    if (activityType === 'Gastronomia: Kuchnia') {
      calculationMode = 'AUTO_MAX'; // Zwykle krotności lub normatyw dla nawiewu
      normativeExhaust = kitchenExhaust;
    } else if (activityType === 'Natryski' || activityType === 'Umywalnia' || activityType === 'Gastronomia: Zmywalnia' || activityType.includes('Szatnia')) {
       // Sanitary / Washing usually requires exhaust. 
       // For simple wizard purposes, we fallback to manual mapping if needed, but defaults in UI:
       if (toilets > 0 || urinals > 0 || showers > 0) {
           normativeExhaust = (toilets * 50) + (urinals * 50) + (showers * 100);
       }
    }

    const newZone: ZoneData = {
      id: `zone-${Date.now()}`,
      nr: nr || `P-XX`,
      name: name || `Pomieszczenie`,
      activityType,
      calculationMode,
      systemSupplyId: 'NW1',
      systemExhaustId: 'WW1',
      area,
      height,
      isAreaLinkedToGeometry: false,
      occupants: occupants,
      dosePerOccupant,
      isTargetACHManual,
      manualTargetACH: isTargetACHManual ? achInput : null,
      targetACH: achInput, // calculated inside PhysicsEngine natively as well
      normativeVolume,
      normativeExhaust,
      totalHeatGain: 0,
      roomTemp: 24,
      roomRH: 50,
      supplyTemp: 16,
      supplyRH: 80,
      acousticAbsorption: 'MEDIUM',
      maxAllowedDbA: 35,
      transferIn: [],
      transferOut: [],
      calculatedVolume: 0,
      calculatedExhaust: 0,
      transferInSum: 0,
      transferOutSum: 0,
      netBalance: 0,
      realACH: 0
    };

    onSave(newZone);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kreator Pomieszczenia</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rodzaj Pomieszczenia</label>
            <select 
              value={activityType} 
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-blue-50 focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.keys(ROOM_TYPE_ACH_MAPPING).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Domyślna krotność z dyrektywy: {ROOM_TYPE_ACH_MAPPING[activityType]} [1/h]</p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Numer</label>
              <input 
                type="text" 
                value={nr} 
                onChange={(e) => setNr(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Np. P-01"
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-medium text-gray-700">Nazwa Pomieszczenia</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Np. Biuro"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Powierzchnia [m²]</label>
              <input 
                type="number" 
                min="0" step="0.1"
                value={area} 
                onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Wysokość [m]</label>
              <input 
                type="number" 
                min="0" step="0.1"
                value={height} 
                onChange={(e) => setHeight(Math.max(0, Number(e.target.value)))}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Ustawienia Nawiewu (Bilans Higieniczny/Krotności)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Liczba osób</label>
                <input 
                  type="number" 
                  min="0"
                  value={occupants} 
                  onChange={(e) => setOccupants(Math.max(0, Number(e.target.value)))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dawka [m³/h/os]</label>
                <input 
                  type="number" 
                  min="0"
                  value={dosePerOccupant} 
                  onChange={(e) => setDosePerOccupant(Math.max(0, Number(e.target.value)))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Krotność zadana [1/h]</label>
                <input 
                  type="number" 
                  min="0" step="0.1"
                  value={achInput} 
                  onChange={(e) => handleAchChange(Number(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
                {isTargetACHManual && <span className="absolute right-2 top-8 text-xs bg-yellow-100 text-yellow-800 px-1 rounded font-bold">Manual</span>}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Ustawienia Wyciągu Sanitarnego/Kuchennego</h3>
            
            {activityType !== 'Gastronomia: Kuchnia' && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Misce ustępowe (Toalety)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={toilets} 
                    onChange={(e) => setToilets(Math.max(0, Number(e.target.value)))}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">50 m³/h szt.</p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Pisuary</label>
                  <input 
                    type="number" 
                    min="0"
                    value={urinals} 
                    onChange={(e) => setUrinals(Math.max(0, Number(e.target.value)))}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">50 m³/h szt.</p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Natryski</label>
                  <input 
                    type="number" 
                    min="0"
                    value={showers} 
                    onChange={(e) => setShowers(Math.max(0, Number(e.target.value)))}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">100 m³/h szt.</p>
                </div>
              </div>
            )}

            {activityType === 'Gastronomia: Kuchnia' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Stały wyciąg z okapu [m³/h]</label>
                <input 
                  type="number" 
                  min="0"
                  value={kitchenExhaust} 
                  onChange={(e) => setKitchenExhaust(Math.max(0, Number(e.target.value)))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            Zapisz Pomieszczenie
          </button>
        </div>
      </div>
    </div>
  );
}
