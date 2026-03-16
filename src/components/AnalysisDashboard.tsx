import React, { useState, useMemo } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { 
  ChevronUp, 
  ChevronDown, 
  LayoutDashboard, 
  Save, 
  Trash2, 
  Copy, 
  AlertCircle,
  Hash,
  Wind,
  Layers,
  Activity
} from 'lucide-react';
import type { AnalysisPreset } from '../types';

export const AnalysisDashboard: React.FC = () => {
  const { 
    zones, 
    floors, 
    systems, 
    analysisPresets, 
    saveAnalysisPreset, 
    removeAnalysisPreset 
  } = useZoneStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFloorIds, setSelectedFloorIds] = useState<Set<string>>(new Set());
  const [selectedSystemIds, setSelectedSystemIds] = useState<Set<string>>(new Set());
  const [scenarioName, setScenarioName] = useState('');

  // Get active zones based on filters
  const activeZones = useMemo(() => {
    return Object.values(zones).filter(zone => {
      const matchesFloor = selectedFloorIds.size === 0 || selectedFloorIds.has(zone.floorId);
      
      const hasSupplyMatch = zone.systemSupplyId && selectedSystemIds.has(zone.systemSupplyId);
      const hasExhaustMatch = zone.systemExhaustId && selectedSystemIds.has(zone.systemExhaustId);
      
      const matchesSystem = selectedSystemIds.size === 0 || hasSupplyMatch || hasExhaustMatch;
      
      return matchesFloor && matchesSystem;
    });
  }, [zones, selectedFloorIds, selectedSystemIds]);

  // Calculations
  const metrics = useMemo(() => {
    let totalN = 0;
    let totalW = 0;
    let transferIn = 0;
    let transferOut = 0;

    activeZones.forEach(z => {
      // If we filtered by system, we only want to sum values for those systems
      // However, usually "Dashboard" means "Show me everything in the filtered strefy"
      // or "Show me only these systems". 
      // Directive 1: "Sumowanie wszystkich nawiewników/wywiewników przypisanych do konkretnego systemId"
      
      if (selectedSystemIds.size === 0) {
        totalN += z.calculatedVolume;
        totalW += z.calculatedExhaust;
      } else {
        if (z.systemSupplyId && selectedSystemIds.has(z.systemSupplyId)) {
          totalN += z.calculatedVolume;
        }
        if (z.systemExhaustId && selectedSystemIds.has(z.systemExhaustId)) {
          totalW += z.calculatedExhaust;
        }
      }
      
      transferIn += z.transferInSum;
      transferOut += z.transferOutSum;
    });

    const net = totalN - totalW;
    const absDiff = Math.abs(net);
    const totalFlow = totalN + totalW;
    const imbalancePercent = totalFlow > 0 ? (absDiff / (totalFlow / 2)) * 100 : 0;

    return { totalN, totalW, net, transferIn, transferOut, imbalancePercent };
  }, [activeZones, selectedSystemIds]);

  // Scenario management
  const handleSaveScenario = () => {
    if (!scenarioName) return;
    const preset: AnalysisPreset = {
      id: `preset-${Date.now()}`,
      name: scenarioName,
      floorIds: Array.from(selectedFloorIds),
      systemIds: Array.from(selectedSystemIds)
    };
    saveAnalysisPreset(preset);
    setScenarioName('');
  };

  const loadScenario = (preset: AnalysisPreset) => {
    setSelectedFloorIds(new Set(preset.floorIds));
    setSelectedSystemIds(new Set(preset.systemIds));
  };

  const copyReport = () => {
    const report = `
RAPORT BILANSU SYSTEMOWEGO (WENTCAD)
-----------------------------------
Filtry Systemy: ${selectedSystemIds.size === 0 ? 'Wszystkie' : Array.from(selectedSystemIds).join(', ')}
Filtry Kondygnacje: ${selectedFloorIds.size === 0 ? 'Wszystkie' : Array.from(selectedFloorIds).map(id => floors[id]?.name).join(', ')}

WYNIKI AGREGACJI:
- Całkowity Nawiew (N): ${metrics.totalN.toFixed(0)} m³/h
- Całkowity Wyciąg (W): ${metrics.totalW.toFixed(0)} m³/h
- Bilans Grupy: ${metrics.net > 0 ? '+' : ''}${metrics.net.toFixed(0)} m³/h
- Stan: ${metrics.net > 0 ? 'NADCIŚNIENIE' : metrics.net < 0 ? 'PODCIŚNIENIE' : 'ZBILANSOWANO'}
- Niezbilansowanie: ${metrics.imbalancePercent.toFixed(1)}%

Pomieszczenia w analizie: ${activeZones.length}
Data generowania: ${new Date().toLocaleString('pl-PL')}
    `.trim();

    navigator.clipboard.writeText(report);
    alert('Raport skopiowany do schowka!');
  };

  const toggleFloor = (id: string) => {
    const next = new Set(selectedFloorIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFloorIds(next);
  };

  const toggleSystem = (id: string) => {
    const next = new Set(selectedSystemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSystemIds(next);
  };

  return (
    <div className={`relative w-full bg-slate-900 border-t border-slate-700 shadow-2xl transition-all duration-300 z-30 flex flex-col shrink-0 ${isExpanded ? 'h-[450px]' : 'h-14'}`}>
      
      {/* Mini Bar / Header */}
      <div 
        className="h-14 flex items-center justify-between px-6 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <h2 className="font-bold text-slate-100 uppercase tracking-widest text-sm">Dashboard Analityczny</h2>
          <div className="h-4 w-[1px] bg-slate-700 mx-2" />
          
          <div className="flex items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Σ Nawiew:</span>
              <span className="text-blue-400 font-mono text-base">{metrics.totalN.toFixed(0)} m³/h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Σ Wywiew:</span>
              <span className="text-red-400 font-mono text-base">{metrics.totalW.toFixed(0)} m³/h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Bilans Grupy:</span>
              <span className={`font-mono text-base ${metrics.net > 0 ? 'text-amber-400' : metrics.net < 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                {metrics.net > 0 ? '+' : ''}{metrics.net.toFixed(0)} m³/h
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {metrics.imbalancePercent > 5 && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold border border-red-500/20">
              <AlertCircle size={12} />
              NIEZBILANSOWANE ({metrics.imbalancePercent.toFixed(1)}%)
            </div>
          )}
          {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronUp size={20} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="flex-1 flex overflow-hidden bg-slate-900/50">
          
          {/* Side Selectors */}
          <div className="w-80 border-r border-slate-800 p-6 overflow-y-auto space-y-6">
            
            {/* Scenariusze */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Wybierz Scenariusz</label>
              <select 
                className="w-full bg-slate-800 border-slate-700 text-slate-200 text-sm p-2 rounded-md mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                onChange={(e) => {
                  const p = analysisPresets.find(ap => ap.id === e.target.value);
                  if (p) loadScenario(p);
                }}
                value=""
              >
                <option value="">-- Domyślne / Własne --</option>
                {analysisPresets.map(ap => (
                  <option key={ap.id} value={ap.id}>{ap.name}</option>
                ))}
              </select>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Nazwa scenariusza..."
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-300 p-2 rounded-md outline-none focus:border-blue-500"
                  value={scenarioName}
                  onChange={e => setScenarioName(e.target.value)}
                />
                <button 
                  onClick={handleSaveScenario}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md transition-colors disabled:opacity-50"
                  disabled={!scenarioName}
                  title="Zapisz obecne filtry jako scenariusz"
                >
                  <Save size={16} />
                </button>
              </div>
              
              {analysisPresets.length > 0 && (
                <div className="flex items-center justify-between px-1 py-2 border-t border-slate-800 mt-2">
                  <span className="text-[9px] text-slate-600 uppercase font-bold">Zarządzaj zapisami</span>
                  <div className="flex gap-2">
                    {analysisPresets.map(ap => (
                      <button 
                        key={`del-${ap.id}`}
                        onClick={() => {
                          if (confirm(`Czy usunąć scenariusz "${ap.name}"?`)) {
                            removeAnalysisPreset(ap.id);
                          }
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title={`Usuń ${ap.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Systemy Multiselect */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex justify-between">
                Systemy <span>({selectedSystemIds.size || 'Wszystkie'})</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {systems.map(sys => (
                  <button
                    key={sys.id}
                    onClick={() => toggleSystem(sys.id)}
                    className={`text-[10px] p-2 rounded-md border transition-all truncate text-left flex items-center gap-2 ${
                      selectedSystemIds.has(sys.id) 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <Wind size={10} />
                    {sys.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Kondygnacje Multiselect */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex justify-between">
                Kondygnacje <span>({selectedFloorIds.size || 'Wszystkie'})</span>
              </label>
              <div className="space-y-1">
                {Object.values(floors).sort((a,b) => b.order - a.order).map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => toggleFloor(floor.id)}
                    className={`w-full text-left text-[11px] p-2 rounded-md border transition-all flex items-center justify-between ${
                      selectedFloorIds.has(floor.id) 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={10} />
                      {floor.name}
                    </div>
                    <span className="text-[9px] opacity-50">{floor.elevation.toFixed(1)}m</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedFloorIds(new Set());
                setSelectedSystemIds(new Set());
              }}
              className="w-full text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors pt-2 border-t border-slate-800"
            >
              WYCZYŚĆ FILTRY
            </button>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-slate-950/20">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suma Nawiewów</span>
                  <Wind size={16} className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-mono font-bold text-slate-100">{metrics.totalN.toFixed(0)} <span className="text-xs font-normal text-slate-500">m³/h</span></div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suma Wyciągów</span>
                  <Wind size={16} className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity rotate-180" />
                </div>
                <div className="text-3xl font-mono font-bold text-slate-100">{metrics.totalW.toFixed(0)} <span className="text-xs font-normal text-slate-500">m³/h</span></div>
              </div>

              <div className={`bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden group border-b-2 ${metrics.net > 0 ? 'border-b-amber-500' : metrics.net < 0 ? 'border-b-purple-500' : 'border-b-emerald-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bilans Grupy</span>
                  <Activity size={16} className={`opacity-50 group-hover:opacity-100 transition-opacity ${metrics.net > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                </div>
                <div className={`text-3xl font-mono font-bold ${metrics.net > 0 ? 'text-amber-400' : metrics.net < 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                  {metrics.net > 0 ? '+' : ''}{metrics.net.toFixed(0)} <span className="text-xs font-normal text-slate-500">m³/h</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transfery (Wew)</span>
                  <Hash size={16} className="text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-mono font-bold text-slate-300">{metrics.transferIn.toFixed(0)}</div>
                  <span className="text-xs text-slate-600">IN /</span>
                  <div className="text-xl font-mono font-bold text-slate-300">{metrics.transferOut.toFixed(0)}</div>
                  <span className="text-xs text-slate-600">OUT</span>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-auto flex justify-between items-center border-t border-slate-800 pt-6">
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Pomieszczenia: {activeZones.length}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${metrics.imbalancePercent <= 5 ? 'bg-emerald-500' : 'bg-red-500'}`} /> Różnica: {metrics.imbalancePercent.toFixed(1)}%
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={copyReport}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded-md text-xs font-bold transition-all border border-slate-700"
                >
                  <Copy size={14} />
                  KOPIUJ RAPORT
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
