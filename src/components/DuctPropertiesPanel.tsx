import { useState } from 'react';
import { useDuctStore } from '../stores/useDuctStore';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Hash, Layers, Ruler, Volume2, Activity, AlertTriangle } from 'lucide-react';
import { OrphanedShaftModal } from './OrphanedShaftModal';
import type { ComponentCategory, ComponentType } from '../types';

const COMPONENT_LABELS: Record<ComponentType, string> = {
  AHU: 'Centrala wentylacyjna (AHU)',
  FAN: 'Wentylator',
  HEAT_RECOVERY: 'Rekuperator',
  ANEMOSTAT: 'Anemostat',
  GRILLE: 'Kratka wentylacyjna',
  DIFFUSER: 'Dyfuzor',
  LOUVRE: 'Wentylacja ścienna',
  AIR_VALVE: 'Zawór powietrzny',
  DAMPER: 'Przepustnica',
  FIRE_DAMPER: 'Klapa przeciwpożarowa',
  SILENCER: 'Tłumik',
  HEATER: 'Nagrzewnica',
  COOLER: 'Chłodnica',
  FILTER_BOX: 'Skrzynka filtracyjna',
  TEE: 'Trójnik',
  CROSS: 'Czwórnik',
  WYE: 'Rozgałęzienie Y',
  SHAFT_UP: 'Pion wentylacyjny ↑',
  SHAFT_DOWN: 'Pion wentylacyjny ↓',
  SHAFT_THROUGH: 'Pion wentylacyjny ↕',
  VIRTUAL_ROOT: 'Węzeł wirtualny (sumowanie)',
};

const CATEGORY_COLORS: Record<ComponentCategory, string> = {
  EQUIPMENT: 'bg-blue-100 text-blue-700 border-blue-200',
  TERMINAL: 'bg-green-100 text-green-700 border-green-200',
  INLINE: 'bg-orange-100 text-orange-700 border-orange-200',
  JUNCTION: 'bg-gray-100 text-gray-700 border-gray-200',
  SHAFT: 'bg-purple-100 text-purple-700 border-purple-200',
  VIRTUAL_ROOT: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function DuctPropertiesPanel() {
  const selectedNodeId = useDuctStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDuctStore((s) => s.selectedEdgeId);
  const nodes = useDuctStore((s) => s.nodes);
  const edges = useDuctStore((s) => s.edges);
  const updateNode = useDuctStore((s) => s.updateNode);
  const updateEdge = useDuctStore((s) => s.updateEdge);
  const setSelectedNodeId = useDuctStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useDuctStore((s) => s.setSelectedEdgeId);
  const getTerminalsInZone = useDuctStore((s) => s.getTerminalsInZone);
  const getOrphanedShaftNodes = useDuctStore((s) => s.getOrphanedShaftNodes);
  const syncShaftToFloors = useDuctStore((s) => s.syncShaftToFloors);
  
  const systems = useZoneStore((s) => s.systems);
  const floors = useZoneStore((s) => s.floors);
  const zones = useZoneStore((s) => s.zones);

  const [showOrphanedModal, setShowOrphanedModal] = useState(false);

  const activeNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const activeEdge = selectedEdgeId ? edges[selectedEdgeId] : null;

  if (!activeNode && !activeEdge) return null;

  const floor = activeNode ? floors[activeNode.floorId] : (activeEdge ? floors[nodes[activeEdge.targetNodeId]?.floorId] : null);

  // Get orphaned SHAFT nodes for current shaft
  const orphanedNodes = activeNode?.componentCategory === 'SHAFT' && activeNode.shaftId
    ? getOrphanedShaftNodes(activeNode.shaftId, activeNode.shaftRange)
    : [];
  
  const handleClose = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };
  
  const activeZone = activeNode?.zoneId ? zones[activeNode.zoneId] : null;

  return (
    <div className="absolute left-4 top-20 bottom-20 w-80 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl flex flex-col z-20 animate-in slide-in-from-left-4 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {activeNode ? 'Właściwości Węzła' : 'Właściwości Odcinka'}
            </h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Inspektor HVAC</p>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* ID Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Identyfikator</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 break-all">
            <code className="text-[10px] font-mono text-gray-600">
              {activeNode?.id || activeEdge?.id}
            </code>
          </div>
        </section>

        {/* Node Specific */}
        {activeNode && (
          <>
            {/* Component Type Badge */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Typ Komponentu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${CATEGORY_COLORS[activeNode.componentCategory] || ''}`}>
                  {activeNode.componentCategory}
                </span>
                <span className="text-xs text-gray-600 font-medium">
                  {COMPONENT_LABELS[activeNode.componentType] || activeNode.componentType}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">System</label>
                  <select
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    value={activeNode.systemId}
                    onChange={(e) => updateNode(activeNode.id, { systemId: e.target.value })}
                  >
                    <option value="">-- brak --</option>
                    {systems.map(sys => (
                      <option key={sys.id} value={sys.id}>{sys.id}: {sys.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kondygnacja</label>
                  <div className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-600 shadow-sm">
                    {floor?.name || 'Nieznana'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">X [px]</label>
                  <div className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-500">
                    {Math.round(activeNode.x)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Y [px]</label>
                  <div className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-500">
                    {Math.round(activeNode.y)}
                  </div>
                </div>
              </div>
            </section>

            {/* EQUIPMENT Section - AHU/FAN parameters */}
            {activeNode.componentCategory === 'EQUIPMENT' && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Parametry Urządzenia</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Wydajność [m³/h]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={activeNode.ratedFlow || ''}
                      onChange={(e) => updateNode(activeNode.id, { ratedFlow: Number(e.target.value) || 0 })}
                      placeholder="np. 5000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ciśnienie [Pa]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={activeNode.ratedPressure || ''}
                      onChange={(e) => updateNode(activeNode.id, { ratedPressure: Number(e.target.value) || 0 })}
                      placeholder="np. 500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Szer. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={activeNode.widthCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { widthCm: Number(e.target.value) || undefined })}
                      placeholder="np. 100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Wys. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={activeNode.heightCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { heightCm: Number(e.target.value) || undefined })}
                      placeholder="np. 80"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dł. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={activeNode.lengthCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { lengthCm: Number(e.target.value) || undefined })}
                      placeholder="np. 200"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* TERMINAL Section - Zone and Flow */}
            {activeNode.componentCategory === 'TERMINAL' && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Podłączenie do Strefy</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Strefa</label>
                  <select
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
                    value={activeNode.zoneId || ''}
                    onChange={(e) => updateNode(activeNode.id, { zoneId: e.target.value || undefined })}
                  >
                    <option value="">-- brak --</option>
                    {Object.values(zones).filter(z => z.floorId === activeNode.floorId).map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.nr} - {zone.name}</option>
                    ))}
                  </select>
                </div>

                {activeZone && (
                  <>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600 font-medium">Wyliczony wydatek:</span>
                        <span className="text-green-700 font-bold">{Math.round(activeZone.calculatedVolume)} m³/h</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600 font-medium">Terminali w strefie:</span>
                        <span className="text-green-700 font-bold">
                          {getTerminalsInZone(activeZone.id, activeNode.systemId).length + 1}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ułamek przepływu [%]</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                        value={Math.round((activeNode.flowFraction || 1) * 100)}
                        onChange={(e) => updateNode(activeNode.id, { flowFraction: (Number(e.target.value) || 0) / 100 })}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 text-green-600 mt-3">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Wymiary Terminala</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Szer. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                      value={activeNode.terminalWidthCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { terminalWidthCm: Number(e.target.value) || undefined })}
                      placeholder="np. 30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Wys. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                      value={activeNode.terminalHeightCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { terminalHeightCm: Number(e.target.value) || undefined })}
                      placeholder="np. 15"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Śr. [cm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                      value={activeNode.terminalDiameterCm || ''}
                      onChange={(e) => updateNode(activeNode.id, { terminalDiameterCm: Number(e.target.value) || undefined })}
                      placeholder="np. 20"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* INLINE Section - Dimensions */}
            {activeNode.componentCategory === 'INLINE' && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-orange-600">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Wymiary Armatury</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Szerokość [mm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={activeNode.width || ''}
                      onChange={(e) => updateNode(activeNode.id, { width: Number(e.target.value) || undefined })}
                      placeholder="np. 400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Wysokość [mm]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={activeNode.height || ''}
                      onChange={(e) => updateNode(activeNode.id, { height: Number(e.target.value) || undefined })}
                      placeholder="np. 200"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SHAFT Section */}
            {activeNode.componentCategory === 'SHAFT' && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pion Wentylacyjny</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <div className="text-xs text-purple-700">
                    {activeNode.componentType === 'SHAFT_UP' 
                      ? '↑ Kierunek przepływu: DO GÓRY' 
                      : activeNode.componentType === 'SHAFT_DOWN'
                      ? '↓ Kierunek przepływu: W DÓŁ'
                      : '↕ Kierunek przepływu: PRZELOTOWY'}
                  </div>
                  <div className="text-[10px] text-purple-500 mt-1">
                    Piony łączą instalację między kondygnacjami
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Identyfikator Pionu</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={activeNode.shaftId || ''}
                      onChange={(e) => updateNode(activeNode.id, { shaftId: e.target.value || undefined })}
                      placeholder="np. P1"
                    />
                    <button
                      onClick={() => {
                        const existingShafts = Object.values(useDuctStore.getState().nodes)
                          .filter(n => n.componentCategory === 'SHAFT' && n.shaftAutoNumber)
                          .map(n => n.shaftAutoNumber || 0);
                        const nextNum = existingShafts.length > 0 ? Math.max(...existingShafts) + 1 : 1;
                        updateNode(activeNode.id, { shaftId: `P${nextNum}`, shaftAutoNumber: nextNum });
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-purple-600">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Zakres Kondygnacji</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Od Kondygnacji</label>
                    <select
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={activeNode.shaftRange?.fromFloorId || ''}
                      onChange={(e) => {
                        const newRange = { 
                          fromFloorId: e.target.value, 
                          toFloorId: activeNode.shaftRange?.toFloorId || e.target.value 
                        };
                        updateNode(activeNode.id, { shaftRange: newRange });
                        syncShaftToFloors(activeNode.id);
                        if (orphanedNodes.length > 0) {
                          setShowOrphanedModal(true);
                        }
                      }}
                    >
                      <option value="">-- wybierz --</option>
                      {Object.values(floors).sort((a, b) => a.order - b.order).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Do Kondygnacji</label>
                    <select
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={activeNode.shaftRange?.toFloorId || ''}
                      onChange={(e) => {
                        const newRange = { 
                          fromFloorId: activeNode.shaftRange?.fromFloorId || '', 
                          toFloorId: e.target.value 
                        };
                        updateNode(activeNode.id, { shaftRange: newRange });
                        syncShaftToFloors(activeNode.id);
                        if (orphanedNodes.length > 0) {
                          setShowOrphanedModal(true);
                        }
                      }}
                    >
                      <option value="">-- wybierz --</option>
                      {Object.values(floors).sort((a, b) => a.order - b.order).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-purple-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Przesunięcie na Innych Kondygnacjach</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Przes. X [px]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={activeNode.shaftShiftX || 0}
                      onChange={(e) => updateNode(activeNode.id, { shaftShiftX: Number(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Przes. Y [px]</label>
                    <input
                      type="number"
                      className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={activeNode.shaftShiftY || 0}
                      onChange={(e) => updateNode(activeNode.id, { shaftShiftY: Number(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {orphanedNodes.length > 0 && (
                  <button
                    onClick={() => setShowOrphanedModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Zarządzaj osieroconymi ({orphanedNodes.length})</span>
                  </button>
                )}
              </section>
            )}

            {/* VIRTUAL_ROOT Section */}
            {activeNode.componentCategory === 'VIRTUAL_ROOT' && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Węzeł Wirtualny</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <div className="text-xs text-amber-700">
                    Ten węzeł służy do sumowania wydatków z fragmentów sieci wentylacyjnej.
                  </div>
                  <div className="text-[10px] text-amber-500 mt-1">
                    Użyj go do podsumowania przepływów bez fizycznego urządzenia.
                  </div>
                </div>
              </section>
            )}

            {/* Acoustic Section (placeholder for Krok 6) */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Akustyka</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <div className="text-xs text-gray-500 italic">
                  Brak danych Lw - zostanie uzupełnione w Kroku 6
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {(activeNode.soundPowerLevel || []).join(', ') || '0, 0, 0, 0, 0, 0, 0, 0'} dB
                </div>
              </div>
            </section>
          </>
        )}

        {/* Edge Specific */}
        {activeEdge && (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Ruler className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Parametry Odcinka</span>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">System HVAC</label>
                <select
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                  value={activeEdge.systemId}
                  onChange={(e) => updateEdge(activeEdge.id, { systemId: e.target.value })}
                >
                  {systems.map(sys => (
                    <option key={sys.id} value={sys.id}>{sys.id}: {sys.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Długość [m]</label>
                  <div className="w-full text-xs font-bold bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-2 text-indigo-700 shadow-sm">
                    {activeEdge.length.toFixed(2)} m
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kształt</label>
                  <select
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    value={activeEdge.shape}
                    onChange={(e) => updateEdge(activeEdge.id, { shape: e.target.value as any })}
                  >
                    <option value="CIRCULAR">Okrągły</option>
                    <option value="RECTANGULAR">Prostokątny</option>
                  </select>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 text-[10px] text-gray-400 italic">
        * Zmiany są automatycznie zapisywane i objęte historią (Ctrl+Z).
      </div>

      {showOrphanedModal && activeNode && orphanedNodes.length > 0 && (
        <OrphanedShaftModal
          shaftId={activeNode.shaftId || ''}
          orphanedNodes={orphanedNodes}
          onClose={() => setShowOrphanedModal(false)}
        />
      )}
    </div>
  );
}
