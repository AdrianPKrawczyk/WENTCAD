import { useState } from 'react';
import type { ZoneData, ActivityType, CalculationMode } from '../types';

interface RoomWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zone: ZoneData) => void;
}

type TemplateType = 'OFFICE' | 'BATHROOM' | 'KITCHEN';

export function RoomWizardModal({ isOpen, onClose, onSave }: RoomWizardModalProps) {
  const [template, setTemplate] = useState<TemplateType>('OFFICE');
  const [nr, setNr] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState(15);
  const [height, setHeight] = useState(3);
  
  // Specific options
  const [occupants, setOccupants] = useState(2);
  const [toilets, setToilets] = useState(1);
  const [urinals, setUrinals] = useState(0);
  const [showers, setShowers] = useState(0);
  const [kitchenExhaust, setKitchenExhaust] = useState(200);

  if (!isOpen) return null;

  const handleSave = () => {
    let activityType: ActivityType = 'OFFICE';
    let calculationMode: CalculationMode = 'AUTO_MAX';
    let normativeVolume = 0;
    let normativeExhaust = 0;
    let dosePerOccupant = 30;

    if (template === 'OFFICE') {
      activityType = 'OFFICE';
      calculationMode = 'AUTO_MAX';
      dosePerOccupant = 30;
    } else if (template === 'BATHROOM') {
      activityType = 'TOILET';
      calculationMode = 'MANUAL';
      // 50 m3/h per toilet/urinal, 100 m3/h per shower
      normativeExhaust = (toilets * 50) + (urinals * 50) + (showers * 100);
      normativeVolume = 0; // Usually negative balance (wyciąg)
    } else if (template === 'KITCHEN') {
      activityType = 'KITCHEN';
      calculationMode = 'MANUAL';
      normativeExhaust = kitchenExhaust;
      normativeVolume = 0;
    }

    const newZone: ZoneData = {
      id: `zone-${Date.now()}`,
      nr: nr || `P-XX`,
      name: name || `Nowe ${template}`,
      activityType,
      calculationMode,
      systemSupplyId: 'NW1',
      systemExhaustId: 'WW1',
      area,
      height,
      isAreaLinkedToGeometry: false,
      occupants: template === 'OFFICE' ? occupants : 0,
      dosePerOccupant,
      targetACH: 0,
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
      <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl">
        <h2 className="text-xl font-bold mb-4">Kreator Pomieszczenia</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Szablon</label>
            <select 
              value={template} 
              onChange={(e) => setTemplate(e.target.value as TemplateType)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="OFFICE">Biuro (Zapotrzebowanie Higieniczne)</option>
              <option value="BATHROOM">Łazienka (Toalety/Pisuary)</option>
              <option value="KITCHEN">Kuchnia (Stały Wyciąg)</option>
            </select>
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

          {template === 'OFFICE' && (
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
          )}

          {template === 'BATHROOM' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Toalety</label>
                <input 
                  type="number" 
                  min="0"
                  value={toilets} 
                  onChange={(e) => setToilets(Math.max(0, Number(e.target.value)))}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
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
              </div>
            </div>
          )}

          {template === 'KITCHEN' && (
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

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
