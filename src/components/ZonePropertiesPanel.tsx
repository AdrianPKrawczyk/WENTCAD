import { useState, useRef, useEffect, useCallback } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { ROOM_PRESETS, ROOM_TYPE_ACH_MAPPING } from '../lib/hvacConstants';
import { toast } from 'sonner';
import { Trash2, ChevronRight, ChevronLeft, Settings2, Wind, ShieldAlert, Layers, Box, Globe, Square, Maximize } from 'lucide-react';
import type { ActivityType, ZoneData, CalculationMode, AcousticAbsorptionIndicator } from '../types';
import type { ZoneBoundary } from '../lib/wattTypes';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

type PanelTab = 'GENERAL' | 'SYSTEMS' | 'WATT';

export function ZonePropertiesPanel() {
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const zones = useZoneStore((state) => state.zones);
  const floors = useZoneStore((state) => state.floors);
  const systems = useZoneStore((state) => state.systems);
  const updateZone = useZoneStore((state) => state.updateZone);
  const updateZoneTopology = useZoneStore((state) => state.updateZoneTopology);
  const buildingFootprint = useZoneStore((state) => state.buildingFootprint);

  const activeZone = selectedZoneId ? zones[selectedZoneId] : null;
  const [activeTab, setActiveTab] = useState<PanelTab>('GENERAL');

  const [newTransferTarget, setNewTransferTarget] = useState('');
  const [newTransferVol, setNewTransferVol] = useState('');

  const [width, setWidth] = useState(320);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDragging = useRef(false);

  const startResize = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const isWide = width >= 450 && !isCollapsed;

  if (!activeZone) {
    return (
      <div 
        style={{ width: isCollapsed ? 48 : width, minWidth: isCollapsed ? 48 : MIN_WIDTH }}
        className="h-full flex flex-col items-center bg-white border-l border-gray-200 shadow-sm relative transition-all duration-300"
      >
        {!isCollapsed && (
          <div
            onPointerDown={startResize}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-300 bg-transparent z-10 transition-colors"
          />
        )}
        <div className="absolute top-4 left-0 -ml-3 z-20">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500"
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        {!isCollapsed ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-sm text-gray-400">
            <p>Wybierz strefę w tabeli, aby wyświetlić szczegóły.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center h-full w-full bg-white relative pt-16">
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-gray-400 font-bold tracking-widest text-xs whitespace-nowrap">
              PANEL WŁAŚCIWOŚCI
            </span>
          </div>
        )}
      </div>
    );
  }

  const handleChange = <K extends keyof ZoneData>(field: K, value: ZoneData[K]) => {
    updateZone(activeZone.id, { [field]: value });
  };

  const { pause, resume } = useZoneStore.temporal.getState();

  const calculatedVolRaw = activeZone.area * activeZone.height;

  const TabButton = ({ tab, icon: Icon, label }: { tab: PanelTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 transition-all relative border-b-2 ${
        activeTab === tab 
          ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30 font-bold' 
          : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${activeTab === tab ? 'animate-in zoom-in-75 duration-300' : ''}`} />
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div 
      style={{ width: isCollapsed ? 48 : width }}
      className="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm relative transition-all duration-300"
    >
      {!isCollapsed && (
        <div
          onPointerDown={startResize}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-400 bg-transparent z-10 transition-colors"
        />
      )}
      
      <div className="absolute top-4 left-0 -ml-3 z-20">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isCollapsed ? (
        <div className="flex flex-col items-center h-full w-full bg-white border-l border-gray-100 relative pt-16">
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-gray-400 font-bold tracking-widest text-xs whitespace-nowrap overflow-hidden">
            {activeZone.nr} • {activeZone.name || 'Właściwości Strefy'}
          </span>
        </div>
      ) : (
        <div className="w-full h-full overflow-hidden relative flex flex-col">
          {/* HEADER */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 className="text-lg font-bold text-gray-800">Właściwości Strefy</h2>
            <p className="text-xs text-gray-500 flex justify-between mt-1">
              <span className="font-mono">ID: {activeZone.id}</span>
              <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold">{activeZone.nr}</span>
            </p>
          </div>

          {/* TABS */}
          <div className="flex border-b border-gray-100 bg-white shrink-0">
            <TabButton tab="GENERAL" icon={Settings2} label="Ogólne" />
            <TabButton tab="SYSTEMS" icon={Wind} label="Instalacje" />
            <TabButton tab="WATT" icon={Layers} label="Topologia" />
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20">
            {activeTab === 'GENERAL' && (
              <div className={`${isWide ? 'grid grid-cols-2 gap-4' : 'space-y-6'}`}>
                {/* SEKCJA: GEOMETRIA */}
                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Dane Podstawowe</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nazwa</label>
                      <input 
                        type="text" 
                        className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                        onFocus={() => pause()}
                        onBlur={() => resume()}
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
                          const preset = ROOM_PRESETS[newType];
                          const hasManualOverrides = activeZone.isTargetACHManual || activeZone.isMaxDbAManual;
                          
                          handleChange('activityType', newType);
                          
                          if (preset) {
                            if (hasManualOverrides) {
                              const ok = window.confirm(
                                `Zmieniono typ na "${newType}".\nCzy zaktualizować domyślne wartości?\n` +
                                `Krotność: ${preset.ach} [1/h], Limit hałasu: ${preset.maxDbA} [dB(A)]\n` +
                                `(Manualne nadpisania zostaną wyłączone)`
                              );
                              if (ok) {
                                handleChange('targetACH', preset.ach);
                                handleChange('isTargetACHManual', false);
                                handleChange('maxAllowedDbA', preset.maxDbA);
                                handleChange('isMaxDbAManual', false);
                                handleChange('manualMaxAllowedDbA', null);
                              }
                            } else {
                              handleChange('targetACH', preset.ach);
                              handleChange('maxAllowedDbA', preset.maxDbA);
                            }
                          }
                        }}
                      >
                        {Object.keys(ROOM_TYPE_ACH_MAPPING).map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">📐 Kondygnacja</label>
                      <select 
                        className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800"
                        value={activeZone.floorId || ''}
                        onChange={(e) => handleChange('floorId', e.target.value)}
                      >
                        {Object.values(floors).sort((a, b) => a.order - b.order).map((floor) => (
                          <option key={floor.id} value={floor.id}>{floor.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 bg-gray-50/50 p-2 rounded-md border border-gray-100">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Pow. Obliczeniowa (Finalna)</label>
                        </div>
                        <input 
                          type="text" 
                          disabled
                          className="w-full text-sm border-b border-indigo-200 py-1 bg-indigo-50/30 text-indigo-900 font-bold focus:outline-none cursor-not-allowed"
                          value={`${(activeZone.area || 0).toFixed(2)} m²`}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Pow. Manualna</label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={activeZone.isAreaManual} 
                              onChange={(e) => handleChange('isAreaManual', e.target.checked)}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-600 tracking-wider font-bold">MANUAL</span>
                          </label>
                        </div>
                        <input 
                          type="number" 
                          step="0.01"
                          disabled={!activeZone.isAreaManual}
                          className={`w-full text-sm border-b py-1 focus:outline-none ${activeZone.isAreaManual ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 bg-transparent text-gray-400'}`}
                          value={activeZone.manualArea}
                          onChange={(e) => handleChange('manualArea', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div>
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
                </section>

                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Akustyka</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maks. poziom hałasu [dB(A)]</label>
                      <input 
                        type="number" 
                        className={`w-full text-sm border-b py-1 ${activeZone.isMaxDbAManual ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                        value={activeZone.isMaxDbAManual ? (activeZone.manualMaxAllowedDbA ?? activeZone.maxAllowedDbA) : activeZone.maxAllowedDbA}
                        onChange={(e) => {
                          handleChange('manualMaxAllowedDbA', Number(e.target.value));
                          handleChange('isMaxDbAManual', true);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Chłonność akustyczna</label>
                      <select 
                        className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
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
              </div>
            )}

            {activeTab === 'SYSTEMS' && (
              <div className="space-y-6">
                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Bilans Powietrza</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nawiew (System)</label>
                        <select 
                          className="w-full text-sm border-b border-gray-300 py-1 bg-transparent"
                          value={activeZone.systemSupplyId || 'Brak'}
                          onChange={(e) => handleChange('systemSupplyId', e.target.value === 'Brak' ? '' : e.target.value)}
                        >
                          <option value="Brak">Brak</option>
                          {systems.filter(s => s.type === 'SUPPLY').map(s => (
                            <option key={s.id} value={s.id}>{s.id}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Wywiew (System)</label>
                        <select 
                          className="w-full text-sm border-b border-gray-300 py-1 bg-transparent"
                          value={activeZone.systemExhaustId || 'Brak'}
                          onChange={(e) => handleChange('systemExhaustId', e.target.value === 'Brak' ? '' : e.target.value)}
                        >
                          <option value="Brak">Brak</option>
                          {systems.filter(s => s.type === 'EXHAUST').map(s => (
                            <option key={s.id} value={s.id}>{s.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-900 rounded-lg p-4 text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-indigo-300 uppercase tracking-widest font-bold">Wynik Analizy</span>
                        <Wind className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-indigo-300 uppercase">Nawiew</p>
                          <p className="text-xl font-black">{activeZone.calculatedVolume} <span className="text-[10px] font-normal italic">m³/h</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] text-indigo-300 uppercase">Wywiew</p>
                          <p className="text-xl font-black">{activeZone.calculatedExhaust} <span className="text-[10px] font-normal italic">m³/h</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Transfery</h3>
                  {/* ... Transfer UI from original file ... */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 mb-1 block uppercase">Dopływ (+): {activeZone.transferInSum} m³/h</span>
                      {activeZone.transferIn.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Brak dopływów</span>
                      ) : (
                        <div className="space-y-1">
                          {activeZone.transferIn.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-blue-50/50 px-2 py-1.5 rounded border border-blue-100 text-xs">
                              <span className="text-blue-900 font-medium">[{zones[t.roomId]?.nr || '?'}] {zones[t.roomId]?.name}</span>
                              <span className="font-bold text-blue-700">+{t.volume}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Odpływ (-): {activeZone.transferOutSum} m³/h</span>
                      {activeZone.transferOut.length === 0 ? (
                        <span className="text-xs text-gray-400 italic block mb-2">Brak odpływów</span>
                      ) : (
                        <div className="space-y-1 mb-2">
                          {activeZone.transferOut.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-red-50/50 px-2 py-1.5 rounded border border-red-100 text-xs">
                              <span className="text-red-900 font-medium">[{zones[t.roomId]?.nr || '?'}] {zones[t.roomId]?.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-red-700">-{t.volume}</span>
                                <button onClick={() => {
                                  const n = [...activeZone.transferOut]; n.splice(idx, 1); handleChange('transferOut', n);
                                }} className="text-red-300 hover:text-red-600">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="bg-gray-50 p-2 rounded border border-gray-200">
                        <select className="w-full text-xs p-1 mb-2 border rounded" value={newTransferTarget} onChange={e => setNewTransferTarget(e.target.value)}>
                          <option value="">Wybierz strefę...</option>
                          {Object.values(zones).filter(z => z.id !== activeZone.id).map(z => <option key={z.id} value={z.id}>[{z.nr}] {z.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <input type="number" placeholder="m³/h" className="w-20 text-xs p-1 border rounded" value={newTransferVol} onChange={e => setNewTransferVol(e.target.value)} />
                          <button onClick={() => {
                            if (newTransferTarget && newTransferVol) {
                              handleChange('transferOut', [...activeZone.transferOut, { roomId: newTransferTarget, volume: Number(newTransferVol) }]);
                              setNewTransferTarget(''); setNewTransferVol('');
                            }
                          }} className="flex-1 bg-indigo-600 text-white text-[10px] font-bold py-1 rounded">DODAJ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'WATT' && (
              <div className="space-y-6">
                <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Layers className="w-5 h-5" />
                      <div>
                        <h3 className="font-bold text-sm">Analiza Topologiczna (WATT)</h3>
                        <p className="text-[10px] text-indigo-500 uppercase tracking-tighter">WENTCAD Architecture & Thermal Topology</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateZoneTopology(activeZone.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      ANALIZUJ
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/60 p-2 rounded-lg border border-indigo-100">
                      <p className="text-[9px] text-indigo-400 uppercase font-bold">Obrys Budynku</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {buildingFootprint && buildingFootprint.length > 0 ? (
                          <><Check className="w-3 h-3 text-green-600" /><span className="text-xs font-bold text-slate-700">Wczytany</span></>
                        ) : (
                          <><ShieldAlert className="w-3 h-3 text-amber-500" /><span className="text-xs font-medium text-slate-400 italic">Brak danych</span></>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg border border-indigo-100">
                      <p className="text-[9px] text-indigo-400 uppercase font-bold">Obrys Strefy</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {activeZone.geometryArea ? (
                          <><Check className="w-3 h-3 text-green-600" /><span className="text-xs font-bold text-slate-700">{activeZone.geometryArea.toFixed(2)} m²</span></>
                        ) : (
                          <><ShieldAlert className="w-3 h-3 text-red-500" /><span className="text-xs font-medium text-slate-400 italic">Brak obrysu</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  {!activeZone.boundaries || activeZone.boundaries.length === 0 ? (
                    <div className="text-center py-8 bg-white/40 rounded-lg border border-dashed border-indigo-200">
                      <Maximize className="w-8 h-8 text-indigo-200 mx-auto mb-2" />
                      <p className="text-xs text-indigo-400 font-medium">Brak wyliczonej topologii.<br/>Kliknij przycisk Analizuj powyżej.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-3 h-3" /> Wykryte Przegrody ({activeZone.boundaries.length})
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-indigo-100 bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-indigo-50/50 text-indigo-700 font-bold uppercase tracking-tighter">
                            <tr>
                              <th className="p-2 border-b border-indigo-100">Typ</th>
                              <th className="p-2 border-b border-indigo-100">L [m]</th>
                              <th className="p-2 border-b border-indigo-100">Azymut</th>
                              <th className="p-2 border-b border-indigo-100">d [cm]</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {activeZone.boundaries.map((b, idx) => (
                              <tr key={idx} className={`hover:bg-indigo-50/30 transition-colors ${b.type === 'EXTERIOR' ? 'bg-orange-50/20' : ''}`}>
                                <td className="p-2 font-medium flex items-center gap-1.5">
                                  {b.type === 'EXTERIOR' ? <Globe className="w-3 h-3 text-orange-500" /> : <Square className="w-3 h-3 text-slate-400" />}
                                  {b.type === 'EXTERIOR' ? 'Zewn.' : 'Wewn.'}
                                </td>
                                <td className="p-2 font-mono">{b.geometry.lengthNet.toFixed(2)}</td>
                                <td className="p-2 font-mono">{Math.round(b.geometry.azimuth)}°</td>
                                <td className="p-2 font-mono text-indigo-600 font-bold">{Math.round(b.geometry.thickness * 100)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 italic bg-white p-2 rounded border border-slate-100 leading-relaxed">
                        <b>Wskazówka:</b> System automatycznie wyliczył azymut oraz grubość przegród na podstawie odległości między poligonami CAD.
                      </p>
                    </div>
                  )}

                  {/* Horizontal Boundaries Section */}
                  {activeZone.horizontalBoundaries && activeZone.horizontalBoundaries.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Przegrody Poziome ({activeZone.horizontalBoundaries.length})
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-indigo-100 bg-white">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-indigo-50/50 text-indigo-700 font-bold uppercase tracking-tighter">
                            <tr>
                              <th className="p-2 border-b border-indigo-100">Typ Przegrody</th>
                              <th className="p-2 border-b border-indigo-100 text-right">Pow. [m²]</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {activeZone.horizontalBoundaries.map((hb, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="p-2 font-medium flex items-center gap-1.5">
                                  {hb.type === 'ROOF' && <span className="w-2 h-2 rounded-full bg-orange-400" />}
                                  {hb.type === 'FLOOR_GROUND' && <span className="w-2 h-2 rounded-full bg-green-600" />}
                                  {hb.type === 'CEILING_INTERIOR' && <span className="w-2 h-2 rounded-full bg-slate-300" />}
                                  {hb.type === 'FLOOR_EXTERIOR' && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                                  {hb.type}
                                </td>
                                <td className="p-2 font-mono text-right font-bold">{hb.area.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
);
