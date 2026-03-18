import { useState, useEffect } from 'react';
import type { ZoneData, ActivityType, CalculationMode } from '../types';
import { ROOM_PRESETS, DEFAULT_ACTIVITY_TYPE } from '../lib/hvacConstants';
import { useZoneStore } from '../stores/useZoneStore';

interface RoomWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: ZoneData) => void;
}

export function RoomWizardModal({ isOpen, onClose, onSave }: RoomWizardModalProps) {
  const floors = useZoneStore((s) => s.floors);
  const activeFloorId = useZoneStore((s) => s.activeFloorId);

  const [activityType, setActivityType] = useState<ActivityType>(DEFAULT_ACTIVITY_TYPE);
  const [floorId, setFloorId] = useState<string>('');
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
  const [achInput, setAchInput] = useState<number>(ROOM_PRESETS[DEFAULT_ACTIVITY_TYPE].ach);
  const [isTargetACHManual, setIsTargetACHManual] = useState(false);

  // Noise limit logic
  const [dbAInput, setDbAInput] = useState<number>(ROOM_PRESETS[DEFAULT_ACTIVITY_TYPE].maxDbA);
  const [isMaxDbAManual, setIsMaxDbAManual] = useState(false);

  // Zmiana typu pomieszczenia
  useEffect(() => {
    const preset = ROOM_PRESETS[activityType];
    if (!isTargetACHManual) {
      setAchInput(preset?.ach ?? 1.5);
    }
    if (!isMaxDbAManual) {
      setDbAInput(preset?.maxDbA ?? 35);
    }
    // Auto-wypełnianie nazwy na podstawie typu jeśli jest pusta lub była równa poprzedniemu typowi
    if (!name || Object.keys(ROOM_PRESETS).includes(name)) {
      setName(activityType === 'CUSTOM' ? 'Pomieszczenie' : activityType);
    }
  }, [activityType]);

  const handleAchChange = (val: number) => {
    setAchInput(val);
    const defaultAch = ROOM_PRESETS[activityType]?.ach ?? 0;
    setIsTargetACHManual(val !== defaultAch);
  };

  const handleDbAChange = (val: number) => {
    setDbAInput(val);
    const defaultDbA = ROOM_PRESETS[activityType]?.maxDbA ?? 35;
    setIsMaxDbAManual(val !== defaultDbA);
  };

  // Set default floorId when modal opens
  useEffect(() => {
    if (isOpen) {
      const sortedFloors = Object.values(floors).sort((a, b) => a.order - b.order);
      const defaultFloor = activeFloorId !== '__all__' ? activeFloorId : sortedFloors[0]?.id ?? '';
      setFloorId(defaultFloor);
    }
  }, [isOpen, activeFloorId]);

  const handleSave = () => {
    let calculationMode: CalculationMode = 'AUTO_MAX';
    const normativeVolume = 0;
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
      systemSupplyId: 'N1',
      systemExhaustId: 'W1',
      area: Math.round(area * 100) / 100,
      manualArea: Math.round(area * 100) / 100,
      height,
      geometryArea: null,
      isAreaManual: true,
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
      maxAllowedDbA: dbAInput,
      isMaxDbAManual,
      manualMaxAllowedDbA: isMaxDbAManual ? dbAInput : null,
      floorId: floorId || Object.keys(floors)[0] || 'floor-parter',
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

  if (!isOpen) return null;
  
  const sortedFloors = Object.values(floors).sort((a, b) => a.order - b.order);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kreator Pomieszczenia</h2>
        
        <div className="space-y-4">
          {/* Floor Picker */}
          <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
            <label className="block text-sm font-medium text-blue-800 mb-1">📐 Kondygnacja</label>
            <select
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              className="block w-full border border-blue-300 rounded-md p-2 text-sm bg-white focus:border-blue-500 focus:ring-blue-500"
            >
              {sortedFloors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name} ({floor.elevation.toFixed(2)} m n.p.m.)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rodzaj Pomieszczenia</label>
            <select 
              value={activityType} 
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-blue-50 focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.keys(ROOM_PRESETS).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Krotność: {ROOM_PRESETS[activityType]?.ach} [1/h], Hałas max.: {ROOM_PRESETS[activityType]?.maxDbA} dB(A)</p>
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
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Max hałas [dB(A)]</label>
                <input 
                  type="number" 
                  min="0" step="1"
                  value={dbAInput} 
                  onChange={(e) => handleDbAChange(Number(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
                {isMaxDbAManual && <span className="absolute right-2 top-8 text-xs bg-yellow-100 text-yellow-800 px-1 rounded font-bold">Manual</span>}
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
