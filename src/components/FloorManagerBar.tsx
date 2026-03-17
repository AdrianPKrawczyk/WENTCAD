import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import type { Floor } from '../types';

interface AddFloorModalProps {
  onSave: (name: string, elevation: number, originDescription?: string) => void;
  onClose: () => void;
}

function AddFloorModal({ onSave, onClose }: AddFloorModalProps) {
  const [name, setName] = useState('');
  const [elevation, setElevation] = useState(0);
  const [originDescription, setOriginDescription] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-5 w-80">
        <h3 className="text-base font-bold mb-4 text-gray-800">Dodaj Kondygnację</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nazwa (np. Parter, +1 Piętro)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Parter"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rzędna [m n.p.m.]</label>
            <input
              type="number"
              step="0.01"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Opis Punktu 0,0 (np. Przecięcie A-1)</label>
            <input
              type="text"
              value={originDescription}
              onChange={(e) => setOriginDescription(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Przecięcie osi A i 1"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
            Anuluj
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { onSave(name.trim(), elevation, originDescription.trim()); onClose(); }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
}

export function FloorManagerBar() {
  const floors = useZoneStore((s) => s.floors);
  const zones = useZoneStore((s) => s.zones);
  const activeFloorId = useZoneStore((s) => s.activeFloorId);
  const setActiveFloor = useZoneStore((s) => s.setActiveFloor);
  const addFloor = useZoneStore((s) => s.addFloor);
  const removeFloor = useZoneStore((s) => s.removeFloor);

  const [showAddModal, setShowAddModal] = useState(false);

  const sortedFloors = Object.values(floors).sort((a, b) => a.order - b.order);

  const getFloorStats = (floorId: string | null) => {
    const floorZones = floorId
      ? Object.values(zones).filter((z) => z.floorId === floorId)
      : Object.values(zones);

    const totalSupply = floorZones.reduce((s, z) => s + z.calculatedVolume, 0);
    const totalExhaust = floorZones.reduce((s, z) => s + z.calculatedExhaust, 0);
    const netBalance = totalSupply - totalExhaust;
    return { totalSupply, totalExhaust, netBalance, count: floorZones.length };
  };

  const activeStats = getFloorStats(activeFloorId);
  const allStats = getFloorStats(null);
  const isAllFloors = activeFloorId === '__all__';

  const handleRemoveFloor = (floor: Floor) => {
    const floorZoneCount = Object.values(zones).filter((z) => z.floorId === floor.id).length;
    const msg = floorZoneCount > 0
      ? `Usunięcie kondygnacji "${floor.name}" spowoduje usunięcie ${floorZoneCount} pomieszczeń. Czy kontynuować?`
      : `Czy usunąć kondygnację "${floor.name}"?`;
    if (window.confirm(msg)) {
      removeFloor(floor.id);
    }
  };

  const displayStats = isAllFloors ? allStats : activeStats;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Floor Tabs Row */}
      <div className="flex items-center gap-0 px-2 pt-2 overflow-x-auto">
        {/* "All floors" tab */}
        <button
          onClick={() => setActiveFloor('__all__')}
          className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-t border ${
            isAllFloors
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          } mr-1 transition-colors`}
        >
          🏢 Wszystkie
        </button>

        {/* Per-floor tabs */}
        {sortedFloors.map((floor) => {
          const isActive = activeFloorId === floor.id;
          const stats = getFloorStats(floor.id);
          return (
            <div key={floor.id} className="flex-shrink-0 flex items-center mr-1">
              <button
                onClick={() => setActiveFloor(floor.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t border transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
                title={`Rzędna: ${floor.elevation.toFixed(2)} m | ${stats.count} pomieszczeń`}
              >
                {floor.name}
                <span className={`ml-1 text-[10px] ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                  ({stats.count})
                </span>
              </button>
              {/* Remove floor button - only shown if >1 floor exists */}
              {sortedFloors.length > 1 && (
                <button
                  onClick={() => handleRemoveFloor(floor)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 text-xs px-1"
                  title={`Usuń kondygnację ${floor.name}`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add Floor button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-shrink-0 px-2 py-1.5 text-xs bg-green-50 text-green-700 border border-green-300 rounded-t hover:bg-green-100 transition-colors ml-1"
          title="Dodaj nową kondygnację"
        >
          + Kondygnacja
        </button>
      </div>

      {/* Status bar for active floor */}
      <div className="flex items-center gap-6 px-4 py-1.5 bg-gray-50 text-xs border-t border-gray-200">
        <span className="font-semibold text-gray-600">
          {isAllFloors ? '🏢 Cały Budynek' : `📐 ${floors[activeFloorId]?.name ?? ''}`}
          <span className="text-gray-400 font-normal ml-2">({displayStats.count} pom.)</span>
        </span>
        <span className="flex items-center gap-1 text-blue-700 font-medium">
          <span>↑ Nawiew:</span>
          <span className="font-bold">{displayStats.totalSupply.toLocaleString()}</span>
          <span className="text-gray-400 font-normal">m³/h</span>
        </span>
        <span className="flex items-center gap-1 text-red-700 font-medium">
          <span>↓ Wywiew:</span>
          <span className="font-bold">{displayStats.totalExhaust.toLocaleString()}</span>
          <span className="text-gray-400 font-normal">m³/h</span>
        </span>
        <span className={`flex items-center gap-1 font-medium ${displayStats.netBalance > 0 ? 'text-blue-600' : displayStats.netBalance < 0 ? 'text-yellow-600' : 'text-green-600'}`}>
          <span>⇌ Bilans:</span>
          <span className="font-bold">{displayStats.netBalance > 0 ? '+' : ''}{displayStats.netBalance.toLocaleString()}</span>
          <span className="text-gray-400 font-normal">m³/h</span>
        </span>
        {!isAllFloors && floors[activeFloorId] && (
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-gray-500 font-semibold">
                Rzędna: {floors[activeFloorId].elevation.toFixed(2)} m
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 italic">
                <span>Punkt 0,0:</span>
                <input
                  type="text"
                  value={floors[activeFloorId].originDescription || ""}
                  onChange={(e) => useZoneStore.getState().updateFloor(activeFloorId, { originDescription: e.target.value })}
                  placeholder="Brak opisu punktu bazowego"
                  className="bg-transparent border-none p-0 focus:ring-0 text-gray-500 hover:text-gray-700 w-48 text-right"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddFloorModal
          onSave={(name, elevation, originDescription) => addFloor({ name, elevation, originDescription } as any)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
