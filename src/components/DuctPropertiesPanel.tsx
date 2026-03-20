import { useDuctStore } from '../stores/useDuctStore';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { X, Hash, Move, Layers, Ruler } from 'lucide-react';
import type { NodeType } from '../types';

export function DuctPropertiesPanel() {
  const selectedNodeId = useDuctStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDuctStore((s) => s.selectedEdgeId);
  const nodes = useDuctStore((s) => s.nodes);
  const edges = useDuctStore((s) => s.edges);
  const updateNode = useDuctStore((s) => s.updateNode);
  const updateEdge = useDuctStore((s) => s.updateEdge);
  const setSelectedNodeId = useDuctStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useDuctStore((s) => s.setSelectedEdgeId);
  
  const systems = useZoneStore((s) => s.systems);
  const floors = useZoneStore((s) => s.floors);
  const canvasFloors = useCanvasStore((s) => s.floors);

  const activeNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const activeEdge = selectedEdgeId ? edges[selectedEdgeId] : null;

  if (!activeNode && !activeEdge) return null;

  const floor = activeNode ? floors[activeNode.floorId] : (activeEdge ? floors[nodes[activeEdge.sourceNodeId]?.floorId] : null);
  const canvasFloor = activeNode ? canvasFloors[activeNode.floorId] : (activeEdge ? canvasFloors[nodes[activeEdge.sourceNodeId]?.floorId] : null);

  const handleClose = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

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
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Move className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Pozycja i Typ</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Typ węzła</label>
                  <select
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    value={activeNode.type}
                    onChange={(e) => updateNode(activeNode.id, { type: e.target.value as NodeType })}
                  >
                    <option value="TERMINAL">Zakończenie (Terminal)</option>
                    <option value="BRANCH">Rozgałęzienie (Branch)</option>
                    <option value="SILENCER">Tłumik</option>
                    <option value="DAMPER">Przepustnica</option>
                    <option value="FAN">Wentylator</option>
                    <option value="ROOM_CONNECTION">Podłączenie Pomieszczenia</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rzędna Z [m]</label>
                  <div className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-500 shadow-sm italic">
                    {floor?.elevation || 0} m
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">X [px]</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-400"
                    value={Math.round(activeNode.x)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Y [px]</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-gray-400"
                    value={Math.round(activeNode.y)}
                  />
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
                    <option key={sys.id} value={sys.id}>{sys.name}</option>
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
    </div>
  );
}
