import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { X, Upload, Check, AlertTriangle, Building2, Layers } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';
import type { ZoneData } from '../types';
import { toast } from 'sonner';

interface ThermodynamicUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateRow {
  zoneId: string;
  nr: string;
  name: string;
  floorName: string;
  currentValues: Partial<ZoneData>;
  newValues: Partial<ZoneData>;
  isSelected: boolean;
  isMatched: boolean;
}

const THERMO_FIELDS = [
  { label: 'Temp. Lato [°C]', field: 'roomTempSummer' },
  { label: 'Wilg. Lato [%]', field: 'roomRHSummer' },
  { label: 'Nawiew Temp. Lato [°C]', field: 'supplyTempSummer' },
  { label: 'Nawiew Wilg. Lato [%]', field: 'supplyRHSummer' },
  { label: 'Temp. Zima [°C]', field: 'roomTempWinter' },
  { label: 'Wilg. Zima [%]', field: 'roomRHWinter' },
  { label: 'Nawiew Temp. Zima [°C]', field: 'supplyTempWinter' },
  { label: 'Nawiew Wilg. Zima [%]', field: 'supplyRHWinter' },
  { label: 'Strata Ciepła [W]', field: 'manualHeatLoss' },
  { label: 'Zyski Jawne [W]', field: 'manualSensibleGain' },
  { label: 'Zyski Wilgoci [g/s]', field: 'manualMoistureGain' },
];

export function ThermodynamicUpdateModal({ isOpen, onClose }: ThermodynamicUpdateModalProps) {
  const [step, setStep] = useState<'FILE_SELECT' | 'MAPPING' | 'PREVIEW'>('FILE_SELECT');
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    nr: '',
    name: '',
  });
  const [updateRows, setUpdateRows] = useState<UpdateRow[]>([]);
  const [useWholeBuilding, setUseWholeBuilding] = useState(true);

  const zones = useZoneStore(s => s.zones);
  const floors = useZoneStore(s => s.floors);
  const activeFloorId = useZoneStore(s => s.activeFloorId);
  const bulkUpdateZonesDiff = useZoneStore(s => s.bulkUpdateZonesDiff);

  // Auto-mapping for basic and thermo fields
  useEffect(() => {
    if (headers.length > 0) {
      const newMapping: Record<string, string> = {
        nr: headers.find(h => h.toLowerCase().includes('nr') || h.toLowerCase().includes('numer')) || '',
        name: headers.find(h => h.toLowerCase().includes('nazwa') || h.toLowerCase().includes('name') || h.toLowerCase().includes('pomieszczenie')) || '',
      };

      THERMO_FIELDS.forEach(tf => {
        // Basic heuristics
        if (tf.field === 'roomTempSummer') newMapping[tf.field] = headers.find(h => (h.toLowerCase().includes('lato') || h.toLowerCase().includes('summer')) && (h.toLowerCase().includes('temp') || h.toLowerCase().includes('pokoj'))) || '';
        if (tf.field === 'roomTempWinter') newMapping[tf.field] = headers.find(h => (h.toLowerCase().includes('zima') || h.toLowerCase().includes('winter')) && (h.toLowerCase().includes('temp') || h.toLowerCase().includes('pokoj'))) || '';
        if (tf.field === 'manualHeatLoss') newMapping[tf.field] = headers.find(h => h.toLowerCase().includes('strata')) || '';
        // Fallback for others
        if (!newMapping[tf.field]) {
           newMapping[tf.field] = headers.find(h => h.toLowerCase().includes(tf.label.toLowerCase().split(' ')[0])) || '';
        }
      });
      setMapping(newMapping);
    }
  }, [headers]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0 && typeof results.data[0] === 'object' && results.data[0] !== null) {
          setCsvRawData(results.data);
          setHeaders(Object.keys(results.data[0]));
          setStep('MAPPING');
        }
      }
    });
  };

  const handleGeneratePreview = () => {
    const relevantZones = Object.values(zones).filter(z => 
      useWholeBuilding || z.floorId === activeFloorId
    );

    const rows: UpdateRow[] = [];
    const parseValue = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : undefined;

    csvRawData.forEach(csvRow => {
      // Find matching zone
      let matchedZone: ZoneData | undefined;
      const csvNr = mapping.nr ? csvRow[mapping.nr] : '';
      const csvName = mapping.name ? csvRow[mapping.name] : '';

      if (csvNr) {
        matchedZone = relevantZones.find(z => z.nr === csvNr);
      }
      if (!matchedZone && csvName) {
        matchedZone = relevantZones.find(z => z.name === csvName);
      }

      if (matchedZone) {
        const currentVals: Partial<ZoneData> = {};
        const newVals: Partial<ZoneData> = {};
        let hasChanges = false;

        THERMO_FIELDS.forEach(tf => {
          const csvField = mapping[tf.field];
          if (csvField && csvRow[csvField] !== undefined) {
            const newVal = parseValue(csvRow[csvField]);
            const currentVal = (matchedZone as any)[tf.field];
            
            if (newVal !== undefined && newVal !== currentVal) {
              (currentVals as any)[tf.field] = currentVal;
              (newVals as any)[tf.field] = newVal;
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          rows.push({
            zoneId: matchedZone.id,
            nr: matchedZone.nr,
            name: matchedZone.name,
            floorName: floors[matchedZone.floorId]?.name || 'Nieznany',
            currentValues: currentVals,
            newValues: newVals,
            isSelected: true,
            isMatched: true
          });
        }
      }
    });

    setUpdateRows(rows);
    setStep('PREVIEW');
  };

  const handleApply = () => {
    const selectedRows = updateRows.filter(r => r.isSelected);
    if (selectedRows.length === 0) {
      toast.error('Brak wybranych pozycji do aktualizacji.');
      return;
    }

    const updates: Record<string, Partial<ZoneData>> = {};
    selectedRows.forEach(row => {
      const zoneUpdates: Partial<ZoneData> = { ...row.newValues };
      
      // Auto-set manual flags if gains/losses were updated
      if (row.newValues.manualHeatLoss !== undefined) zoneUpdates.isHeatLossManual = true;
      if (row.newValues.manualSensibleGain !== undefined) zoneUpdates.isSensibleGainManual = true;
      if (row.newValues.manualMoistureGain !== undefined) zoneUpdates.isMoistureGainManual = true;

      updates[row.zoneId] = zoneUpdates;
    });

    bulkUpdateZonesDiff(updates);
    toast.success(`Zaktualizowano ${selectedRows.length} pomieszczeń.`);
    onClose();
    // Reset wizard
    setStep('FILE_SELECT');
    setUpdateRows([]);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-600" />
              Aktualizacja Danych Termomodernizacji (CSV)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Seryjna aktualizacja parametrów istniejących pomieszczeń.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'FILE_SELECT' && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-700">Wybierz plik CSV</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Plik powinien zawierać kolumnę z numerem (Nr) lub nazwą pomieszczenia oraz parametry, które chcesz zaktualizować.
                </p>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setUseWholeBuilding(true)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${useWholeBuilding ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <Building2 className={`w-8 h-8 mb-2 ${useWholeBuilding ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${useWholeBuilding ? 'text-indigo-900' : 'text-slate-600'}`}>Cały budynek</span>
                  <span className="text-[10px] text-slate-500">Przeszukaj wszystkie kondygnacje</span>
                </button>

                <button 
                  onClick={() => setUseWholeBuilding(false)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${!useWholeBuilding ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                >
                  <Layers className={`w-8 h-8 mb-2 ${!useWholeBuilding ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${!useWholeBuilding ? 'text-indigo-900' : 'text-slate-600'}`}>Aktualna kondygnacja</span>
                  <span className="text-[10px] text-slate-500">{floors[activeFloorId]?.name || 'Parter'}</span>
                </button>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="update-csv-upload"
              />
              <label 
                htmlFor="update-csv-upload"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-100"
              >
                Załaduj Plik
              </label>
            </div>
          )}

          {step === 'MAPPING' && (
            <div className="p-6 flex flex-col h-full">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-800 leading-normal">
                  <b>Dopasowanie:</b> Upewnij się, że kolumna identyfikująca (Numer lub Nazwa) jest poprawnie przypisana.
                  Parametry termodynamiczne, które zostawisz "Pomiń", nie zostaną zmienione.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
                    Identyfikacja Pomieszczenia
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="w-1/3 text-xs font-bold text-slate-600">Numer (Nr)</label>
                      <select 
                        value={mapping.nr}
                        onChange={(e) => setMapping(prev => ({ ...prev, nr: e.target.value }))}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- Pomiń --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-1/3 text-xs font-bold text-slate-600">Nazwa Pokoju</label>
                      <select 
                        value={mapping.name}
                        onChange={(e) => setMapping(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- Pomiń --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
                    Parametry do Aktualizacji
                  </h4>
                  <div className="space-y-2">
                    {THERMO_FIELDS.map(tf => (
                      <div key={tf.field} className="flex items-center gap-4 group">
                        <label className="w-1/2 text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">{tf.label}</label>
                        <select 
                          value={mapping[tf.field] || ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [tf.field]: e.target.value }))}
                          className="w-1/2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:bg-white focus:border-indigo-400 outline-none transition-all"
                        >
                          <option value="">-- Pomiń --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button 
                  onClick={() => setStep('FILE_SELECT')}
                  className="px-6 py-2 text-slate-500 hover:text-slate-700 font-bold transition-all"
                >
                  Wstecz
                </button>
                <button 
                  onClick={handleGeneratePreview}
                  className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Generuj Porównanie
                </button>
              </div>
            </div>
          )}

          {step === 'PREVIEW' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-slate-600">
                  Znaleziono <span className="text-indigo-600">{updateRows.length}</span> pomieszczeń z różnicami w danych.
                </span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setUpdateRows(prev => prev.map(r => ({ ...r, isSelected: true })))}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Zaznacz wszystkie
                  </button>
                  <button 
                    onClick={() => setUpdateRows(prev => prev.map(r => ({ ...r, isSelected: false })))}
                    className="text-[10px] font-bold text-slate-400 hover:underline"
                  >
                    Odznacz wszystkie
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50/30">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-100">
                      <th className="w-[50px] p-3"></th>
                      <th className="w-[80px] p-3 text-[10px] font-bold text-slate-400 uppercase">Nr</th>
                      <th className="w-[150px] p-3 text-[10px] font-bold text-slate-400 uppercase">Nazwa</th>
                      <th className="w-[100px] p-3 text-[10px] font-bold text-slate-400 uppercase">Kondygnacja</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Wykryte Zmiany</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateRows.map((row, idx) => (
                      <tr 
                        key={row.zoneId}
                        className={`border-b border-slate-50 group hover:bg-white transition-colors ${!row.isSelected ? 'opacity-50' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => {
                              const newRows = [...updateRows];
                              newRows[idx].isSelected = !newRows[idx].isSelected;
                              setUpdateRows(newRows);
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${row.isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 font-bold text-slate-700 text-xs">{row.nr}</td>
                        <td className="p-3 text-slate-600 text-xs truncate">{row.name}</td>
                        <td className="p-3">
                           <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">{row.floorName}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                             {Object.entries(row.newValues).map(([field, newVal]) => {
                               const fieldLabel = THERMO_FIELDS.find(tf => tf.field === field)?.label || field;
                               const currentVal = (row.currentValues as any)[field];
                               return (
                                 <div key={field} className="flex flex-col bg-white border border-indigo-100 rounded p-1.5 shadow-sm min-w-[120px]">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase">{fieldLabel}</span>
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 line-through">
                                        {typeof currentVal === 'object' ? JSON.stringify(currentVal) : String(currentVal)}
                                      </span>
                                      <span className="text-[10px] text-indigo-700 font-bold">
                                        → {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                                      </span>
                                   </div>
                                 </div>
                               );
                             })}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {updateRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <span className="text-4xl block mb-4">✨</span>
                          <p className="text-slate-500 font-medium">Brak różnic w danych</p>
                          <p className="text-xs text-slate-400 mt-1">Wszystkie pomieszczenia mają już aktualne parametry.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-between shrink-0">
                <button 
                  onClick={() => setStep('MAPPING')}
                  className="px-6 py-2 text-slate-500 hover:text-slate-700 font-bold transition-all"
                >
                  Powrót do mapowania
                </button>
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-slate-400 italic">
                    {updateRows.filter(r => r.isSelected).length} wybranych pozycji
                  </span>
                  <button 
                    onClick={handleApply}
                    disabled={updateRows.filter(r => r.isSelected).length === 0}
                    className="px-10 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Zastosuj Zmiany
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
