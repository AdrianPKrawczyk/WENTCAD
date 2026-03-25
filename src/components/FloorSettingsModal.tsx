import { useState, useEffect } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { useDuctStore } from '../stores/useDuctStore';
import { Pencil, Trash2, X, Ruler } from 'lucide-react';

interface FloorSettingsModalProps {
  floorId: string;
  onClose: () => void;
}

export function FloorSettingsModal({ floorId, onClose }: FloorSettingsModalProps) {
  const floors = useZoneStore((s) => s.floors);
  const zones = useZoneStore((s) => s.zones);
  const updateFloor = useZoneStore((s) => s.updateFloor);
  const removeFloor = useZoneStore((s) => s.removeFloor);
  const setActiveFloor = useZoneStore((s) => s.setActiveFloor);
  const ductNodes = useDuctStore((s) => s.nodes);

  const floor = floors[floorId];

  const [name, setName] = useState(floor?.name || '');
  const [elevation, setElevation] = useState(floor?.elevation || 0);
  const [originDescription, setOriginDescription] = useState(floor?.originDescription || '');
  const [hTotal, setHTotal] = useState(floor?.heightTotal || 3.5);
  const [hNet, setHNet] = useState(floor?.heightNet || 3.0);
  const [hHvac, setHHvac] = useState(floor?.heightSuspended || 2.7);
  const [maxWallThickness, setMaxWallThickness] = useState(floor?.maxWallThickness || 1.2);

  useEffect(() => {
    if (floor) {
      setName(floor.name);
      setElevation(floor.elevation);
      setOriginDescription(floor.originDescription || '');
      setHTotal(floor.heightTotal || 3.5);
      setHNet(floor.heightNet || 3.0);
      setHHvac(floor.heightSuspended || 2.7);
      setMaxWallThickness(floor.maxWallThickness || 1.2);
    }
  }, [floor]);

  if (!floor) return null;

  const floorZones = Object.values(zones).filter((z) => z.floorId === floorId);
  const floorNodes = Object.values(ductNodes).filter((n) => n.floorId === floorId);

  const handleSave = () => {
    if (!name.trim()) return;
    updateFloor(floorId, {
      name: name.trim(),
      elevation,
      originDescription: originDescription.trim(),
      heightTotal: hTotal,
      heightNet: hNet,
      heightSuspended: hHvac,
      maxWallThickness: maxWallThickness
    });
    onClose();
  };

  const handleDelete = () => {
    const hasRooms = floorZones.length > 0;
    const hasNodes = floorNodes.length > 0;
    
    let msg = `Czy na pewno chcesz usunąć kondygnację "${floor.name}"?`;
    if (hasRooms) {
      msg += `\n\nZostanie usunięte ${floorZones.length} pomieszczeń.`;
    }
    if (hasNodes) {
      msg += `\nZostaną usunięte elementy instalacji (${floorNodes.length} węzłów).`;
    }
    msg += '\n\nTej operacji nie można cofnąć.';

    if (window.confirm(msg)) {
      setActiveFloor(Object.keys(floors).find((id) => id !== floorId) || '');
      removeFloor(floorId);
      onClose();
    }
  };

  const sortedFloors = Object.values(floors).sort((a, b) => a.order - b.order);
  const canMoveUp = floor.order > 0;
  const canMoveDown = floor.order < sortedFloors.length - 1;

  const handleMoveUp = () => {
    const idx = sortedFloors.findIndex((f) => f.id === floorId);
    if (idx > 0) {
      const prevFloor = sortedFloors[idx - 1];
      updateFloor(floorId, { order: prevFloor.order });
      updateFloor(prevFloor.id, { order: floor.order });
    }
  };

  const handleMoveDown = () => {
    const idx = sortedFloors.findIndex((f) => f.id === floorId);
    if (idx < sortedFloors.length - 1) {
      const nextFloor = sortedFloors[idx + 1];
      updateFloor(floorId, { order: nextFloor.order });
      updateFloor(nextFloor.id, { order: floor.order });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Ustawienia Kondygnacji</h3>
              <p className="text-[10px] text-gray-500 font-medium">Edycja właściwości piętra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
              Nazwa kondygnacji
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="np. Parter, +1 Piętro"
              autoFocus
            />
          </div>

          {/* Elevation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
              Rzędna poziomu podłogi [m]
            </label>
            <input
              type="number"
              step="0.01"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
            <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
              <Ruler className="w-3 h-3" /> Parametry Wysokościowe (WATT)
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 ml-1">
                   <span>H Brutto (Kondygnacja)</span>
                   <span className="text-indigo-600">Od podłogi do podłogi</span>
                </div>
                <input
                  type="number" step="0.01" value={hTotal}
                  onChange={(e) => setHTotal(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 ml-1">
                   <span>H Netto (Strop)</span>
                   <span className="text-indigo-600">Do spodu stropu</span>
                </div>
                <input
                  type="number" step="0.01" value={hNet}
                  onChange={(e) => setHNet(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 ml-1">
                   <span>H HVAC (Sufit podwieszany)</span>
                   <span className="text-indigo-600">Kubatura obliczeniowa</span>
                </div>
                <input
                  type="number" step="0.01" value={hHvac}
                  onChange={(e) => setHHvac(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 ml-1">
                   <span>Max. Grubość Ściany (Cap)</span>
                   <span className="text-indigo-600">Filtr szachtów</span>
                </div>
                <input
                  type="number" step="0.05" value={maxWallThickness}
                  onChange={(e) => setMaxWallThickness(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Origin Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
              Opis punktu 0,0
            </label>
            <input
              type="text"
              value={originDescription}
              onChange={(e) => setOriginDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="np. Przecięcie osi A i 1"
            />
          </div>

          {/* Order / Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">
              Pozycja w hierarchii
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMoveUp}
                disabled={!canMoveUp}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Przesuń w górę"
              >
                ↑
              </button>
              <span className="flex-1 text-center text-sm text-gray-600 bg-gray-50 rounded-lg py-2 border border-gray-200">
                Poziom {floor.order + 1} z {sortedFloors.length}
              </span>
              <button
                onClick={handleMoveDown}
                disabled={!canMoveDown}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Przesuń w dół"
              >
                ↓
              </button>
            </div>
          </div>

          {/* Stats */}
          {(floorZones.length > 0 || floorNodes.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Zawartość kondygnacji
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Pomieszczenia:</span>
                <span className="font-bold text-gray-800">{floorZones.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Elementy instalacji:</span>
                <span className="font-bold text-gray-800">{floorNodes.length}</span>
              </div>
            </div>
          )}

          {/* Delete Section */}
          {Object.keys(floors).length > 1 && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Usuń kondygnację
                {(floorZones.length > 0 || floorNodes.length > 0) && (
                  <span className="text-xs font-normal text-red-400 ml-1">
                    ({floorZones.length + floorNodes.length} elementów)
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
}
