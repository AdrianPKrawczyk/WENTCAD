import React, { useState, useMemo } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { ROOM_PRESETS } from '../lib/hvacConstants';
import type { ZoneData, ActivityType, CalculationMode } from '../types';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, selectedIds }) => {
  const bulkUpdateZones = useZoneStore((state) => state.bulkUpdateZones);
  const floors = useZoneStore((state) => state.floors);
  const systems = useZoneStore((state) => state.systems);

  // State for form values
  const [formData, setFormData] = useState<Partial<ZoneData>>({
    activityType: 'CUSTOM',
    height: 3,
    calculationMode: 'AUTO_MAX',
    dosePerOccupant: 30,
    isTargetACHManual: false,
    manualTargetACH: 1.5,
    occupants: 1,
    totalHeatGain: 0,
    roomTemp: 24,
    roomRH: 50,
    supplyTemp: 16,
    supplyRH: 80,
    maxAllowedDbA: 35,
    systemSupplyId: '',
    systemExhaustId: '',
    floorId: '',
  });

  // State for "Zmień" checkboxes
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Set<keyof ZoneData>>(new Set());

  const toggleField = (field: keyof ZoneData) => {
    const next = new Set(fieldsToUpdate);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setFieldsToUpdate(next);
  };

  const supplySystems = useMemo(() => systems.filter(s => s.type === 'SUPPLY'), [systems]);
  const exhaustSystems = useMemo(() => systems.filter(s => s.type === 'EXHAUST'), [systems]);

  const handleApply = () => {
    const updates: Partial<ZoneData> = {};
    fieldsToUpdate.forEach(field => {
      (updates as any)[field] = (formData as any)[field];
    });

    // Special logic: if activityType is updated, also update ACH/dB unless manual flags are off
    // Actually, following user instructions: update them if preset exists.
    if (fieldsToUpdate.has('activityType')) {
      const preset = ROOM_PRESETS[formData.activityType as ActivityType];
      if (preset) {
        // We'll update the values but only if the user didn't EXPLICITLY check manual fields in the bulk edit
        if (!fieldsToUpdate.has('targetACH') && !fieldsToUpdate.has('isTargetACHManual')) {
           updates.targetACH = preset.ach;
        }
        if (!fieldsToUpdate.has('maxAllowedDbA') && !fieldsToUpdate.has('isMaxDbAManual')) {
           updates.maxAllowedDbA = preset.maxDbA;
        }
      }
    }

    bulkUpdateZones(selectedIds, updates);
    onClose();
  };

  if (!isOpen) return null;

  const renderField = (label: string, field: keyof ZoneData, input: React.ReactNode) => (
    <div className="flex items-center gap-3 mb-2">
      <input 
        type="checkbox" 
        checked={fieldsToUpdate.has(field)} 
        onChange={() => toggleField(field)}
        className="w-4 h-4 text-blue-600 rounded"
      />
      <div className={`flex-1 flex flex-col ${!fieldsToUpdate.has(field) ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        {input}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white">Edycja grupowa</h2>
            <p className="text-sm text-slate-400">Zaznaczono: <span className="text-blue-400 font-bold">{selectedIds.length}</span> pomieszczeń</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-900/50">
          
          {/* Section: Ogólne */}
          <section>
            <h3 className="text-sm font-bold text-blue-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Sekcja Ogólna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderField('Typ pomieszczenia', 'activityType', (
                <select 
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.activityType}
                  onChange={e => setFormData({...formData, activityType: e.target.value as ActivityType})}
                >
                  {Object.keys(ROOM_PRESETS).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              ))}
              {renderField('Wysokość [m]', 'height', (
                <input 
                  type="number" step="0.1"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})}
                />
              ))}
              {renderField('Tryb obliczeń', 'calculationMode', (
                <select 
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.calculationMode}
                  onChange={e => setFormData({...formData, calculationMode: e.target.value as CalculationMode})}
                >
                  <option value="AUTO_MAX">Auto (Max Higieniczny/Krotność)</option>
                  <option value="MANUAL">Manualny</option>
                  <option value="HYGIENIC_ONLY">Tylko higieniczny</option>
                  <option value="ACH_ONLY">Tylko krotność</option>
                  <option value="THERMAL_ONLY">Tylko zyski ciepła</option>
                </select>
              ))}
            </div>
          </section>

          {/* Section: Bilans */}
          <section>
            <h3 className="text-sm font-bold text-emerald-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Sekcja Bilansu (Powietrze)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderField('Osoby', 'occupants', (
                <input 
                  type="number" step="1"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.occupants}
                  onChange={e => setFormData({...formData, occupants: parseInt(e.target.value)})}
                />
              ))}
              {renderField('Dawka [m³/h/os]', 'dosePerOccupant', (
                <input 
                  type="number" step="5"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.dosePerOccupant}
                  onChange={e => setFormData({...formData, dosePerOccupant: parseFloat(e.target.value)})}
                />
              ))}
              {renderField('Krotność (Manual)', 'manualTargetACH', (
                <input 
                  type="number" step="0.1"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.manualTargetACH || 0}
                  onChange={e => setFormData({...formData, manualTargetACH: parseFloat(e.target.value)})}
                />
              ))}
               {renderField('Manual ACH Toggle', 'isTargetACHManual', (
                <div className="flex items-center gap-2 text-white text-sm py-2">
                  <input 
                    type="checkbox" 
                    checked={formData.isTargetACHManual}
                    onChange={e => setFormData({...formData, isTargetACHManual: e.target.checked})}
                  />
                  <span>Wymuś manualną krotność</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Termodynamika */}
          <section>
            <h3 className="text-sm font-bold text-orange-500 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Sekcja Termodynamiki
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderField('Zyski ciepła [W]', 'totalHeatGain', (
                <input 
                  type="number" step="100"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.totalHeatGain}
                  onChange={e => setFormData({...formData, totalHeatGain: parseFloat(e.target.value)})}
                />
              ))}
              {renderField('Temp. Pom / Naw [°C]', 'roomTemp', (
                <div className="flex gap-2">
                   <input 
                    type="number" step="0.5" placeholder="Pom"
                    className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                    value={formData.roomTemp}
                    onChange={e => setFormData({...formData, roomTemp: parseFloat(e.target.value)})}
                  />
                  <input 
                    type="number" step="0.5" placeholder="Naw"
                    className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                    value={formData.supplyTemp}
                    onChange={e => setFormData({...formData, supplyTemp: parseFloat(e.target.value)})}
                  />
                </div>
              ))}
              {renderField('RH% Pom / Naw [%]', 'roomRH', (
                <div className="flex gap-2">
                   <input 
                    type="number" step="5" placeholder="Pom"
                    className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                    value={formData.roomRH}
                    onChange={e => setFormData({...formData, roomRH: parseFloat(e.target.value)})}
                  />
                  <input 
                    type="number" step="5" placeholder="Naw"
                    className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                    value={formData.supplyRH}
                    onChange={e => setFormData({...formData, supplyRH: parseFloat(e.target.value)})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section: Akustyka i Systemy */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-bold text-purple-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span> Akustyka
              </h3>
              {renderField('Limit dB(A)', 'maxAllowedDbA', (
                <input 
                  type="number" step="1"
                  className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                  value={formData.maxAllowedDbA || 0}
                  onChange={e => setFormData({...formData, maxAllowedDbA: parseFloat(e.target.value)})}
                />
              ))}
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Systemy i Lokacja
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {renderField('System N / W', 'systemSupplyId', (
                  <div className="flex gap-2">
                    <select 
                      className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                      value={formData.systemSupplyId}
                      onChange={e => setFormData({...formData, systemSupplyId: e.target.value})}
                    >
                      <option value="">Brak</option>
                      {supplySystems.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                    <select 
                      className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                      value={formData.systemExhaustId}
                      onChange={e => setFormData({...formData, systemExhaustId: e.target.value})}
                    >
                      <option value="">Brak</option>
                      {exhaustSystems.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                    </select>
                  </div>
                ))}
                {renderField('Kondygnacja', 'floorId', (
                   <select 
                    className="bg-slate-800 border-slate-700 text-white p-2 rounded w-full text-sm"
                    value={formData.floorId}
                    onChange={e => setFormData({...formData, floorId: e.target.value})}
                  >
                    <option value="">Nie zmieniaj</option>
                    {Object.values(floors).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            Anuluj
          </button>
          <button 
            disabled={fieldsToUpdate.size === 0}
            onClick={handleApply}
            className={`px-8 py-2 rounded-lg text-sm font-bold shadow-lg transition-all ${
              fieldsToUpdate.size > 0 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Zastosuj do zaznaczonych
          </button>
        </div>
      </div>
    </div>
  );
};
