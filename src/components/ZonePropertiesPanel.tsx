import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { ROOM_PRESETS, ROOM_TYPE_ACH_MAPPING } from '../lib/hvacConstants';
import { toast } from 'sonner';
import { 
  ChevronRight, ChevronLeft, Settings2, Wind, 
  ShieldAlert, Layers, Box, Globe, Square, Maximize, Check,
  Edit2, X
} from 'lucide-react';
import type { ActivityType, ZoneData, AcousticAbsorptionIndicator } from '../types';
import { getCompassDirection } from '../lib/geometryHelpers';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

type PanelTab = 'GENERAL' | 'SYSTEMS' | 'WATT';

export function ZonePropertiesPanel() {
  // Pull everything needed from ZoneStore
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const zones = useZoneStore((state) => state.zones);
  const floors = useZoneStore((state) => state.floors);
  const systems = useZoneStore((state) => state.systems);
  const updateZone = useZoneStore((state) => state.updateZone);
  const updateZoneTopology = useZoneStore((state) => state.updateZoneTopology);
  const analyzeAllZones = useZoneStore((state) => state.analyzeAllZones);
  const northAzimuth = useZoneStore((state) => state.northAzimuth);
  const setNorthAzimuth = useZoneStore((state) => state.setNorthAzimuth);
  const buildingFootprint = useZoneStore((state) => state.buildingFootprint);
  const wallTypes = useZoneStore((state) => state.wallTypes);
  const windowStyles = useZoneStore((state) => state.windowStyles);
  const addWindowStyle = useZoneStore((state) => state.addWindowStyle);
  const updateWindowStyle = useZoneStore((state) => state.updateWindowStyle);
  const selectedBoundaryId = useZoneStore((state) => state.selectedBoundaryId);
  const setSelectedBoundaryId = useZoneStore((state) => state.setSelectedBoundaryId);
  const selectedHorizontalBoundaryId = useZoneStore((state) => state.selectedHorizontalBoundaryId);
  const setSelectedHorizontalBoundaryId = useZoneStore((state) => state.setSelectedHorizontalBoundaryId);

  const activeZone = selectedZoneId ? zones[selectedZoneId] : null;
  const [activeTab, setActiveTab] = useState<PanelTab>('GENERAL');

  // Auto-switch to WATT tab if a boundary is selected
  useEffect(() => {
    if (selectedBoundaryId || selectedHorizontalBoundaryId) {
      setActiveTab('WATT');
    }
  }, [selectedBoundaryId, selectedHorizontalBoundaryId]);

  const [newTransferTarget, setNewTransferTarget] = useState('');
  const [newTransferVol, setNewTransferVol] = useState('');
  
  const [editingWindowStyleId, setEditingWindowStyleId] = useState<string | null>(null);

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

  const handleChange = <K extends keyof ZoneData>(field: K, value: ZoneData[K]) => {
    if (activeZone) {
      updateZone(activeZone.id, { [field]: value });
    }
  };

  const { pause, resume } = useZoneStore.temporal.getState();

  // const calculatedVolRaw = useMemo(() => {
  //   if (!activeZone) return 0;
  //   return activeZone.area * activeZone.height;
  // }, [activeZone]);

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
              <div className="flex flex-col gap-6">
                <div className={`${isWide ? 'grid grid-cols-2 gap-4 items-start' : 'space-y-6'}`}>
                  <div className="space-y-6">
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

                    <div className="space-y-3 bg-amber-50/30 p-2 rounded-md border border-amber-100/50">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">Kubatura Obliczeniowa (Finalna)</label>
                        </div>
                        <input 
                          type="text" 
                          disabled
                          className="w-full text-sm border-b border-orange-200 py-1 bg-orange-50/30 text-orange-900 font-bold focus:outline-none cursor-not-allowed"
                          value={`${(activeZone.volume || 0).toFixed(2)} m³`}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Kubatura Manualna</label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={activeZone.isVolumeManual} 
                              onChange={(e) => handleChange('isVolumeManual', e.target.checked)}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-gray-600 tracking-wider font-bold">MANUAL</span>
                          </label>
                        </div>
                        <input 
                          type="number" 
                          step="0.01"
                          disabled={!activeZone.isVolumeManual}
                          className={`w-full text-sm border-b py-1 focus:outline-none ${activeZone.isVolumeManual ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 bg-transparent text-gray-400'}`}
                          value={activeZone.manualVolume}
                          onChange={(e) => handleChange('manualVolume', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SEKCJA: AKUSTYKA */}
                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Akustyka</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs text-gray-500">Maks. poziom hałasu [dB(A)]</label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={activeZone.isMaxDbAManual} 
                            onChange={(e) => handleChange('isMaxDbAManual', e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3 h-3"
                          />
                          <span className="text-[10px] text-gray-600 tracking-wider font-bold uppercase">Manual</span>
                        </label>
                      </div>
                      <input 
                        type="number" 
                        disabled={!activeZone.isMaxDbAManual}
                        className={`w-full text-sm border-b py-1 focus:outline-none ${activeZone.isMaxDbAManual ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 bg-transparent text-gray-400'}`}
                        value={activeZone.isMaxDbAManual ? (activeZone.manualMaxAllowedDbA ?? activeZone.maxAllowedDbA) : activeZone.maxAllowedDbA}
                        onChange={(e) => handleChange('manualMaxAllowedDbA', Number(e.target.value))}
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

              <div className="space-y-6">
                {/* SEKCJA: PARAMETRY POWIETRZA (V_HIG) */}
                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Metoda Obliczeń i Cele</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tryb Obliczeń</label>
                      <select 
                        className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent text-gray-800 font-bold"
                        value={activeZone.calculationMode}
                        onChange={(e) => handleChange('calculationMode', e.target.value as any)}
                      >
                        <option value="AUTO_MAX">AUTOMATYCZNY (MAX)</option>
                        <option value="MANUAL">RĘCZNY (NADPROŻE)</option>
                        <option value="HYGIENIC_ONLY">WYŁĄCZNIE HIGIENICZNY</option>
                        <option value="ACH_ONLY">WYŁĄCZNIE KROTNOŚCI</option>
                        <option value="THERMAL_ONLY">WYŁĄCZNIE TERMICZNY</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">Liczba Osób</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.occupants}
                          onChange={(e) => handleChange('occupants', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">m³/h / osobę</label>
                        <input 
                          type="number" 
                          min="0"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.dosePerOccupant}
                          onChange={(e) => handleChange('dosePerOccupant', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Krotność Wymian [1/h]</label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={activeZone.isTargetACHManual} 
                            onChange={(e) => handleChange('isTargetACHManual', e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-3 h-3"
                          />
                          <span className="text-[10px] text-gray-600 tracking-wider font-bold">MANUAL</span>
                        </label>
                      </div>
                      <input 
                        type="number" 
                        step="0.1"
                        disabled={!activeZone.isTargetACHManual}
                        className={`w-full text-sm border-b py-1 focus:outline-none ${activeZone.isTargetACHManual ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 bg-transparent text-gray-400 italic'}`}
                        value={activeZone.isTargetACHManual ? (activeZone.manualTargetACH ?? activeZone.targetACH) : activeZone.targetACH}
                        onChange={(e) => handleChange('manualTargetACH', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </section>

                {/* SEKCJA: TERMODYNAMIKA (V_TERM) */}
                <section className="bg-white rounded border border-gray-100 p-3 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Termodynamika</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">Temp. Pomieszczenia [°C]</label>
                        <input 
                          type="number" step="0.5"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.roomTemp}
                          onChange={(e) => handleChange('roomTemp', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">Wilgotność [%]</label>
                        <input 
                          type="number" step="1" max="100" min="0"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.roomRH}
                          onChange={(e) => handleChange('roomRH', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">Temp. Nawiewu [°C]</label>
                        <input 
                          type="number" step="0.5"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.supplyTemp}
                          onChange={(e) => handleChange('supplyTemp', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase">Wilgotność Naw. [%]</label>
                        <input 
                          type="number" step="1" max="100" min="0"
                          className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                          value={activeZone.supplyRH}
                          onChange={(e) => handleChange('supplyRH', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1 uppercase">Zyski Ciepła Jawne + Utajone [W]</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="flex-1 text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent font-bold text-orange-700"
                          value={activeZone.totalHeatGain}
                          onChange={(e) => handleChange('totalHeatGain', Number(e.target.value))}
                        />
                        <span className="text-[10px] text-gray-400 font-bold">WATTY</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
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
                <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Ustawienia Projektu (WATT)</h3>
                      <button
                        onClick={() => {
                           analyzeAllZones();
                           toast.success("Zakończono analizę całego budynku.");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all"
                      >
                        Analizuj Wszystko
                      </button>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Orientacja Północy [°]</label>
                         <input 
                           type="number" value={northAzimuth} 
                           onChange={e => setNorthAzimuth(Number(e.target.value))}
                           className="w-16 border-b border-gray-200 text-right text-xs font-bold focus:border-indigo-500 outline-none"
                         />
                      </div>
                      <p className="text-[9px] text-gray-400 italic">0° = Góra rysunku, 90° = Prawo, 180° = Dół...</p>
                   </div>
                </section>

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
                      onClick={() => {
                        updateZoneTopology(activeZone.id);
                        toast.success("Zakończono analizę topologiczną strefy.");
                      }}
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
                        {buildingFootprint && buildingFootprint.outer && buildingFootprint.outer.length > 0 ? (
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

                  {!((activeZone.boundaries && activeZone.boundaries.length > 0) || (activeZone.horizontalBoundaries && activeZone.horizontalBoundaries.length > 0)) ? (
                    <div className="text-center py-8 bg-white/40 rounded-lg border border-dashed border-indigo-200">
                      <Maximize className="w-8 h-8 text-indigo-200 mx-auto mb-2" />
                      <p className="text-xs text-indigo-400 font-medium">Brak wyliczonej topologii.<br/>Kliknij przycisk Analizuj powyżej.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-3 h-3" /> Zestawienie Przegród (OZC Style)
                      </h4>
                      
                      <div className="overflow-x-auto rounded-lg border border-indigo-100 bg-white shadow-sm">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead className="bg-slate-800 text-slate-200 font-bold uppercase tracking-tighter">
                            <tr className="divide-x divide-slate-700">
                              <th className="p-1 px-2 w-8 text-center shrink-0">Lp.</th>
                              <th className="p-1 px-2 w-10 text-center">3D</th>
                              <th className="p-1 px-2 min-w-[120px]">Przegroda / Konstrukcja</th>
                              <th className="p-1 px-2 w-12 text-center text-[9px]">Orient.</th>
                              <th className="p-1 px-2 w-12 text-center text-[9px]">H [m]</th>
                              <th className="p-1 px-2 w-12 text-center text-[9px]">W/L [m]</th>
                              <th className="p-1 px-2 w-16 text-right text-[9px]">A [m²]</th>
                              <th className="p-1 px-2 w-16 text-right text-[9px]">Aobl [m²]</th>
                              <th className="p-1 px-2 w-16 text-right text-[9px]">U [W/m²K]</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {/* VERTICAL BOUNDARIES (WALLS) */}
                            {activeZone.boundaries?.map((b, bIdx) => {
                              const isSelected = b.id === selectedBoundaryId;
                              const currentFloor = floors[activeZone.floorId];
                              const wallHeight = b.type === 'EXTERIOR' ? (currentFloor?.heightTotal || 3.0) : (currentFloor?.heightNet || 2.7);
                              const grossArea = b.geometry.lengthNet * wallHeight;
                              const openingsArea = b.openings.reduce((sum, op) => sum + (op.width * op.height), 0);
                              const netArea = grossArea - openingsArea;

                              return (
                                <React.Fragment key={`wall-${b.id}`}>
                                  {/* WALL ROW */}
                                  <tr 
                                    onClick={() => setSelectedBoundaryId(isSelected ? null : b.id)}
                                    className={`divide-x divide-gray-50 cursor-pointer transition-colors group ${
                                      isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <td className="p-1 px-2 text-center font-bold text-gray-400">{bIdx + 1}</td>
                                    <td className="p-1 text-center">
                                      {b.type === 'EXTERIOR' ? <Globe className="w-3 h-3 text-orange-500 mx-auto" /> : <Square className="w-3 h-3 text-slate-400 mx-auto" />}
                                    </td>
                                    <td className="p-1 px-2">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 truncate max-w-[160px]">
                                          {b.type === 'EXTERIOR' ? 'ŚCIANA ZEWN.' : 'ŚCIANA WEWN.'}
                                        </span>
                                        <select 
                                          value={b.relatedWallTypeId || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                             const nextBoundaries = [...activeZone.boundaries!];
                                             nextBoundaries[bIdx] = { ...b, relatedWallTypeId: e.target.value };
                                             updateZone(activeZone.id, { boundaries: nextBoundaries });
                                          }}
                                          className="w-full text-[9px] bg-transparent border-none text-indigo-600 font-medium focus:ring-0 p-0 hover:underline"
                                        >
                                           <option value="">Wybierz konstrukcję...</option>
                                           {Object.values(wallTypes).filter(wt => wt.isExternal === (b.type === 'EXTERIOR')).map(wt => (
                                              <option key={wt.id} value={wt.id}>{wt.name}</option>
                                           ))}
                                        </select>
                                      </div>
                                    </td>
                                    <td className="p-1 text-center font-bold text-slate-600">
                                      {getCompassDirection(b.geometry.azimuth)}
                                    </td>
                                    <td className="p-1 text-center text-gray-500">{wallHeight.toFixed(2)}</td>
                                    <td className="p-1 text-center text-gray-500 font-mono">{b.geometry.lengthNet.toFixed(2)}</td>
                                    <td className="p-1 text-right text-slate-400 font-mono">{grossArea.toFixed(2)}</td>
                                    <td className="p-1 text-right text-indigo-700 font-black font-mono">{netArea.toFixed( netArea < 0 ? 0 : 2)}</td>
                                    <td className="p-1 text-right text-indigo-600 font-bold">1.25</td> {/* To be calculated from U-ref */}
                                  </tr>

                                  {/* OPENINGS ROWS (Sub-rows) */}
                                  {b.openings.map((op, opIdx) => {
                                    const style = op.windowStyleId ? windowStyles[op.windowStyleId] : null;
                                    const isEditing = editingWindowStyleId === op.windowStyleId && op.windowStyleId;

                                    return (
                                    <React.Fragment key={`op-${op.id}`}>
                                    <tr className={`divide-x divide-gray-50 transition-all ${isEditing ? 'bg-indigo-50/50' : 'bg-sky-50/30'}`}>
                                      <td className="p-1 text-center text-[8px] text-gray-300 italic">{bIdx + 1}.{opIdx + 1}</td>
                                      <td className="p-1 text-center opacity-40">
                                        <div className="w-2 h-2 border border-sky-400 bg-sky-100 mx-auto rounded-sm" />
                                      </td>
                                      <td className="p-1 px-2 pl-4">
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 border-l border-b border-gray-400 rounded-bl" />
                                            <select 
                                              value={op.windowStyleId || ''}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'NEW') {
                                                  const id = `ws-${Date.now()}`;
                                                  addWindowStyle({ id, name: `Okna Typ ${Object.keys(windowStyles).length + 1}`, overallUValue: 1.1, solarHeatGainCoefficient: 0.5 });
                                                  const nextB = [...activeZone.boundaries!];
                                                  nextB[bIdx].openings[opIdx].windowStyleId = id;
                                                  updateZone(activeZone.id, { boundaries: nextB });
                                                  setEditingWindowStyleId(id);
                                                } else {
                                                  const nextB = [...activeZone.boundaries!];
                                                  nextB[bIdx].openings[opIdx].windowStyleId = val || undefined;
                                                  updateZone(activeZone.id, { boundaries: nextB });
                                                }
                                              }}
                                              className="bg-transparent border-none text-[9px] font-bold text-sky-800 p-0 focus:ring-0 w-full"
                                            >
                                              <option value="">Wybierz styl okna...</option>
                                              <option value="NEW" className="text-indigo-600 font-bold">+ NOWY TYP OKNA</option>
                                              {Object.values(windowStyles).map(ws => (
                                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                                              ))}
                                            </select>
                                            {op.windowStyleId && (
                                              <button 
                                                onClick={() => setEditingWindowStyleId(isEditing ? null : op.windowStyleId!)}
                                                className={`p-0.5 rounded ${isEditing ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-100'}`}
                                              >
                                                <Edit2 className="w-2.5 h-2.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-1 text-center text-sky-600 font-bold opacity-50">
                                        {getCompassDirection(b.geometry.azimuth)}
                                      </td>
                                      <td className="p-1 text-center text-sky-700">{op.height.toFixed(2)}</td>
                                      <td className="p-1 text-center text-sky-700">{op.width.toFixed(2)}</td>
                                      <td className="p-1 text-right text-sky-800 font-bold">{(op.width * op.height).toFixed(2)}</td>
                                      <td className="p-1 text-right text-gray-300">-</td>
                                      <td className="p-1 text-right text-sky-600 font-bold">
                                        {style ? style.overallUValue.toFixed(2) : '-'}
                                      </td>
                                    </tr>
                                    
                                    {isEditing && (
                                      <tr className="bg-white border-t border-b border-indigo-200 shadow-inner">
                                        <td colSpan={3} className="p-2 border-r-0">
                                          <div className="flex flex-col gap-2 p-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Edycja Typu Okna</span>
                                              <button onClick={() => setEditingWindowStyleId(null)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-[8px] text-gray-400 mb-0.5 uppercase">Nazwa Typu</label>
                                                <input 
                                                  type="text" 
                                                  className="w-full text-[9px] border-b border-gray-200 focus:border-indigo-500 outline-none py-0.5"
                                                  value={style?.name || ''}
                                                  onChange={(e) => updateWindowStyle(style!.id, { name: e.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[8px] text-gray-400 mb-0.5 uppercase">U [W/m²K]</label>
                                                <input 
                                                  type="number" step="0.01"
                                                  className="w-full text-[9px] border-b border-gray-200 focus:border-indigo-500 outline-none py-0.5 font-bold"
                                                  value={style?.overallUValue}
                                                  onChange={(e) => updateWindowStyle(style!.id, { overallUValue: parseFloat(e.target.value) || 0 })}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[8px] text-gray-400 mb-0.5 uppercase">Wsp. g (solarny)</label>
                                                <input 
                                                  type="number" step="0.01" max="1" min="0"
                                                  className="w-full text-[9px] border-b border-gray-200 focus:border-indigo-500 outline-none py-0.5"
                                                  value={style?.solarHeatGainCoefficient}
                                                  onChange={(e) => updateWindowStyle(style!.id, { solarHeatGainCoefficient: parseFloat(e.target.value) || 0 })}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td colSpan={6} className="bg-indigo-50/20" />
                                      </tr>
                                    )}
                                    </React.Fragment>
                                  );})}
                                </React.Fragment>
                              );
                            })}

                            {/* HORIZONTAL BOUNDARIES (ROOF, FLOOR) */}
                            {activeZone.horizontalBoundaries?.map((hb, hIdx) => {
                              const isSelected = hb.id === selectedHorizontalBoundaryId;
                              return (
                                <tr 
                                  key={`hb-${hb.id}`}
                                  onClick={() => setSelectedHorizontalBoundaryId(isSelected ? null : hb.id)}
                                  className={`divide-x divide-gray-50 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <td className="p-1 px-2 text-center font-bold text-gray-400">{ (activeZone.boundaries?.length || 0) + hIdx + 1}</td>
                                  <td className="p-1 text-center">
                                    {hb.type === 'ROOF' ? <Box className="w-3 h-3 text-amber-500 mx-auto" /> : <Layers className="w-3 h-3 text-green-600 mx-auto" />}
                                  </td>
                                  <td className="p-1 px-2">
                                     <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 truncate max-w-[160px]">
                                          {hb.type === 'ROOF' ? 'DACH' : (hb.type === 'FLOOR_GROUND' ? 'PODŁOGA NA GRUNCIE' : hb.type)}
                                        </span>
                                        <select 
                                          value={hb.uValueRef || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                             const nextH = [...activeZone.horizontalBoundaries!];
                                             nextH[hIdx] = { ...hb, uValueRef: e.target.value };
                                             updateZone(activeZone.id, { horizontalBoundaries: nextH });
                                          }}
                                          className="w-full text-[9px] bg-transparent border-none text-indigo-600 font-medium focus:ring-0 p-0 hover:underline"
                                        >
                                           <option value="">Wybierz...</option>
                                           {Object.values(wallTypes).map(wt => (
                                              <option key={wt.id} value={wt.id}>{wt.name}</option>
                                           ))}
                                        </select>
                                     </div>
                                  </td>
                                  <td className="p-1 text-center font-bold text-slate-300">-</td>
                                  <td className="p-1 text-center text-gray-300">-</td>
                                  <td className="p-1 text-center text-gray-300">-</td>
                                  <td className="p-1 text-right text-slate-400 font-mono">{hb.area.toFixed(2)}</td>
                                  <td className="p-1 text-right text-indigo-700 font-black font-mono">{hb.area.toFixed(2)}</td>
                                  <td className="p-1 text-right text-indigo-600 font-bold">0.30</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                         <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-1">Uwagi do zestawienia</h5>
                         <p className="text-[9px] text-amber-700 leading-relaxed italic">
                           Aobl (powierzchnia obliczeniowa) jest wyliczana automatycznie poprzez odjęcie powierzchni okien i drzwi od powierzchni brutto przegrody. 
                           Kierunki świata są ustalane na podstawie azymutu ściany względem północy projektu.
                         </p>
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
