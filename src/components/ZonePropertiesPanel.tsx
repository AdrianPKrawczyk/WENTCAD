import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { ROOM_TYPE_ACH_MAPPING } from '../lib/hvacConstants';
import type { ActivityType, ZoneData, CalculationMode, AcousticAbsorptionIndicator } from '../types';

export function ZonePropertiesPanel() {
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const zones = useZoneStore((state) => state.zones);
  const updateZone = useZoneStore((state) => state.updateZone);

  const activeZone = selectedZoneId ? zones[selectedZoneId] : null;

  const [newTransferTarget, setNewTransferTarget] = useState('');
  const [newTransferVol, setNewTransferVol] = useState('');

  if (!activeZone) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-6 text-center text-sm">
        <p>Wybierz strefę w tabeli, aby wyświetlić szczegóły.</p>
      </div>
    );
  }

  const handleChange = <K extends keyof ZoneData>(field: K, value: ZoneData[K]) => {
    updateZone(activeZone.id, { [field]: value });
  };

  const calculatedVolRaw = activeZone.area * activeZone.height;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm w-80 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Właściwości Strefy</h2>
        <p className="text-xs text-gray-500 flex justify-between mt-1">
          <span className="font-mono">ID: {activeZone.id}</span>
          <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold">{activeZone.nr}</span>
        </p>
      </div>

      <div className="p-4 space-y-6 pb-20">
        
        {/* SEKCJA: GEOMETRIA */}
        <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Geometria</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nazwa</label>
              <input 
                type="text" 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                value={activeZone.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rodzaj Pomieszczenia</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                value={activeZone.activityType}
                onChange={(e) => {
                  const newType = e.target.value as ActivityType;
                  handleChange('activityType', newType);
                  if (!activeZone.isTargetACHManual) {
                    handleChange('targetACH', ROOM_TYPE_ACH_MAPPING[newType]);
                  }
                }}
              >
                {Object.keys(ROOM_TYPE_ACH_MAPPING).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Powierzchnia [m²]</label>
                <input 
                  type="number" 
                  min="0" step="0.1"
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.area}
                  onChange={(e) => handleChange('area', Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Wysokość [m]</label>
                <input 
                  type="number" 
                  min="0" step="0.1"
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.height}
                  onChange={(e) => handleChange('height', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={activeZone.manualVolume !== null && activeZone.manualVolume !== undefined} 
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange('manualVolume', calculatedVolRaw);
                      } else {
                        handleChange('manualVolume', null);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 font-medium">Ręczna Kubatura</span>
                </label>
              </div>
              <div className="text-xs text-gray-500 text-right">
                Calc: {calculatedVolRaw.toFixed(1)} m³
              </div>
            </div>
            
            {(activeZone.manualVolume !== null && activeZone.manualVolume !== undefined) && (
              <div className="mt-2 pl-6">
                 <input 
                  type="number" 
                  min="0" step="0.1"
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-yellow-50 text-yellow-800 px-2 rounded font-bold"
                  value={activeZone.manualVolume}
                  onChange={(e) => handleChange('manualVolume', Number(e.target.value))}
                  placeholder="Podaj objętość w m³"
                />
              </div>
            )}
          </div>
        </section>

        {/* SEKCJA: DANE BILANSOWE */}
        <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Dane Bilansowe</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tryb obliczeń</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                value={activeZone.calculationMode}
                onChange={(e) => handleChange('calculationMode', e.target.value as CalculationMode)}
              >
                <option value="AUTO_MAX">AUTO_MAX</option>
                <option value="MANUAL">MANUAL</option>
                <option value="HYGIENIC_ONLY">HYGIENIC_ONLY</option>
                <option value="ACH_ONLY">ACH_ONLY</option>
                <option value="THERMAL_ONLY">THERMAL_ONLY</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Liczba osób</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.occupants}
                  onChange={(e) => handleChange('occupants', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dawka na osobę [m³/h/os]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.dosePerOccupant}
                  onChange={(e) => handleChange('dosePerOccupant', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
               <div className="flex justify-between items-center mb-1">
                 <label className="block text-xs text-gray-500 font-medium">Krotność zadana [1/h]</label>
                 <label className="flex items-center space-x-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={activeZone.isTargetACHManual} 
                      onChange={(e) => {
                        const isManual = e.target.checked;
                        handleChange('isTargetACHManual', isManual);
                        if (isManual && activeZone.manualTargetACH === null) {
                           handleChange('manualTargetACH', activeZone.targetACH);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-[10px] text-gray-600 tracking-wider font-bold">MANUAL</span>
                  </label>
               </div>
               
               <div className="flex relative">
                 <input 
                    type="number" 
                    step="0.1"
                    className={`w-full text-sm border-b py-1 focus:outline-none ${activeZone.isTargetACHManual ? 'border-gray-500 bg-yellow-50 font-bold' : 'border-gray-300 bg-gray-50 text-gray-500'}`}
                    value={activeZone.isTargetACHManual ? (activeZone.manualTargetACH ?? 0) : activeZone.targetACH}
                    onChange={(e) => {
                      if (activeZone.isTargetACHManual) {
                        handleChange('manualTargetACH', Number(e.target.value));
                      }
                    }}
                    disabled={!activeZone.isTargetACHManual}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wydatek norm. nawiew [m³/h]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.normativeVolume}
                  onChange={(e) => handleChange('normativeVolume', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stały wydatek wywiew [m³/h]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-red-500 focus:outline-none py-1 bg-transparent border-red-200"
                  value={activeZone.normativeExhaust || 0}
                  onChange={(e) => handleChange('normativeExhaust', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEKCJA: TERMODYNAMIKA */}
        <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Termodynamika</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Temp. pow. [°C]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.roomTemp}
                  onChange={(e) => handleChange('roomTemp', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wilgotność względna [%]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.roomRH}
                  onChange={(e) => handleChange('roomRH', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Temp. nawiewu [°C]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent border-blue-200"
                  value={activeZone.supplyTemp}
                  onChange={(e) => handleChange('supplyTemp', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wilg. nawiewu [%]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.supplyRH}
                  onChange={(e) => handleChange('supplyRH', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zyski ciepła (Jawne + Utajone) [W]</label>
              <input 
                type="number" 
                className="w-full text-sm border-b border-gray-300 focus:border-red-500 focus:outline-none py-1 bg-red-50"
                value={activeZone.totalHeatGain}
                onChange={(e) => handleChange('totalHeatGain', Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* SEKCJA: AKUSTYKA */}
        <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Akustyka</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maks. poziom hałasu [dB(A)]</label>
              <input 
                type="number" 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                value={activeZone.maxAllowedDbA}
                onChange={(e) => handleChange('maxAllowedDbA', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chłonność akustyczna</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                value={activeZone.acousticAbsorption}
                onChange={(e) => handleChange('acousticAbsorption', e.target.value as AcousticAbsorptionIndicator)}
              >
                <option value="HARD">Twarda (HARD)</option>
                <option value="MEDIUM">Średnia (MEDIUM)</option>
                <option value="SOFT">Miękka (SOFT)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SEKCJA: SYSTEMY I TRANSFERY */}
        <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Systemy i Transfery</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">System N (Nawiew)</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                value={activeZone.systemSupplyId || 'Brak'}
                onChange={(e) => handleChange('systemSupplyId', e.target.value === 'Brak' ? '' : e.target.value)}
              >
                <option value="Brak">Brak</option>
                <option value="NW1">NW1</option>
                <option value="NW2">NW2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">System W (Wywiew)</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                value={activeZone.systemExhaustId || 'Brak'}
                onChange={(e) => handleChange('systemExhaustId', e.target.value === 'Brak' ? '' : e.target.value)}
              >
                <option value="Brak">Brak</option>
                <option value="WW1">WW1</option>
                <option value="WW2">WW2</option>
              </select>
            </div>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <span className="text-xs font-medium text-blue-600 mb-1 block">Dopływ transferem: {activeZone.transferInSum} m³/h</span>
              {activeZone.transferIn.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Brak transferów do strefy</span>
              ) : (
                <ul className="text-xs space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                  {activeZone.transferIn.map((t, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                      <span className="text-gray-600 truncate mr-2" title={zones[t.roomId]?.name || t.roomId}>
                        Z: [{zones[t.roomId]?.nr || '?'}] {zones[t.roomId]?.name || t.roomId}
                      </span>
                      <span className="font-bold text-blue-700 whitespace-nowrap">+{t.volume}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-red-600 mb-1 block">Odpływ transferem: {activeZone.transferOutSum} m³/h</span>
              {activeZone.transferOut.length === 0 ? (
                <span className="text-xs text-gray-400 italic block mb-2">Brak transferów ze strefy</span>
              ) : (
                <ul className="text-xs space-y-1 bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                  {activeZone.transferOut.map((t, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                      <span className="text-gray-600 truncate mr-2" title={zones[t.roomId]?.name || t.roomId}>
                        Do: [{zones[t.roomId]?.nr || '?'}] {zones[t.roomId]?.name || t.roomId}
                      </span>
                      <div className="flex items-center space-x-2">
                         <span className="font-bold text-red-700 whitespace-nowrap">-{t.volume}</span>
                         <button 
                             onClick={() => {
                                const newArr = [...activeZone.transferOut];
                                newArr.splice(idx, 1);
                                handleChange('transferOut', newArr);
                             }} 
                             className="text-gray-400 hover:text-red-500 font-bold"
                             title="Usuń transfer"
                         >
                            ✕
                         </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                 <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-wide">Dodaj Odpływ</h4>
                 <select 
                    className="w-full text-xs border border-gray-300 rounded p-1 mb-2 bg-white"
                    value={newTransferTarget}
                    onChange={(e) => setNewTransferTarget(e.target.value)}
                 >
                    <option value="" disabled>Wybierz strefę docelową...</option>
                    {Object.values(zones).filter(z => z.id !== activeZone.id).map(z => (
                       <option key={z.id} value={z.id}>[{z.nr}] {z.name}</option>
                    ))}
                 </select>
                 <div className="flex space-x-2">
                    <input 
                       type="number" 
                       min="0"
                       placeholder="m³/h" 
                       value={newTransferVol}
                       onChange={(e) => setNewTransferVol(e.target.value)}
                       className="w-20 text-xs border border-gray-300 rounded p-1 bg-white"
                    />
                    <button 
                       onClick={() => {
                          if (newTransferTarget && newTransferVol && Number(newTransferVol) > 0) {
                             const newTransfer = { roomId: newTransferTarget, volume: Number(newTransferVol) };
                             handleChange('transferOut', [...activeZone.transferOut, newTransfer]);
                             setNewTransferTarget('');
                             setNewTransferVol('');
                          }
                       }}
                       disabled={!newTransferTarget || !newTransferVol || Number(newTransferVol) <= 0}
                       className="flex-1 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 text-xs font-bold py-1 px-2 rounded transition-colors"
                    >
                       + Dodaj
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* WYNIKI OBLICZEŃ SILNIKA FIZYCZNEGO */}
        <section className="bg-gray-800 rounded border border-gray-700 p-3 shadow-md text-white mt-4">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Wyniki (Silnik Obliczeniowy)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-300">Nawiew</span>
              <span className="text-lg font-bold text-blue-400">{activeZone.calculatedVolume} <span className="text-xs font-normal">m³/h</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-300">Wywiew</span>
              <span className="text-lg font-bold text-red-400">{activeZone.calculatedExhaust} <span className="text-xs font-normal">m³/h</span></span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-xs text-gray-400">Bilans netto</span>
              <span className={`text-sm font-bold ${activeZone.netBalance > 0 ? 'text-blue-300' : activeZone.netBalance < 0 ? 'text-yellow-300' : 'text-green-300'}`}>
                {activeZone.netBalance > 0 ? '+' : ''}{activeZone.netBalance} <span className="text-xs font-normal">m³/h</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Krotność rzeczywista</span>
              <span className="text-sm font-bold text-gray-300">
                {activeZone.realACH.toFixed(2)} <span className="text-xs font-normal">1/h</span>
              </span>
            </div>
          </div>
        </section>

        {activeZone.thermodynamicError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-100 text-xs">
            ⚠️ <b>Błąd termodynamiki:</b> Powietrze nawiewane wprowadza więcej ciepła utajonego niż może usunąć ciepła jawnego. Entalpia układu rośnie. Chłodzenie niemożliwe.
          </div>
        )}
      </div>
    </div>
  );
}
