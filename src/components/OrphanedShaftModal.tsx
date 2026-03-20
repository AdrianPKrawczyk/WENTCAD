import { useState } from 'react';
import { useDuctStore } from '../stores/useDuctStore';
import { useZoneStore } from '../stores/useZoneStore';
import { AlertTriangle, Trash2, Plus, ArrowRight, X } from 'lucide-react';
import type { DuctNode } from '../types';

interface OrphanedShaftModalProps {
  shaftId: string;
  orphanedNodes: DuctNode[];
  onClose: () => void;
}

export function OrphanedShaftModal({ shaftId, orphanedNodes, onClose }: OrphanedShaftModalProps) {
  const floors = useZoneStore((s) => s.floors);
  const removeOrphanedShaftNodes = useDuctStore((s) => s.removeOrphanedShaftNodes);
  const reassignShaftNodes = useDuctStore((s) => s.reassignShaftNodes);
  const nodes = useDuctStore((s) => s.nodes);

  const [selectedOption, setSelectedOption] = useState<'delete' | 'keep' | 'new' | 'transfer'>('keep');
  const [targetShaftId, setTargetShaftId] = useState<string>('');
  const [extendTargetRange, setExtendTargetRange] = useState(false);
  const [newShaftName, setNewShaftName] = useState('');

  // Get all existing shafts for the transfer option
  const allShafts = Object.values(nodes).filter(
    n => n.componentCategory === 'SHAFT' && n.shaftId !== shaftId && n.shaftId
  );
  const uniqueShaftIds = [...new Set(allShafts.map(n => n.shaftId))];

  // Get floor names for orphaned nodes
  const getFloorName = (floorId: string) => {
    return floors[floorId]?.name || floorId;
  };

  const handleApply = () => {
    const nodeIds = orphanedNodes.map(n => n.id);

    switch (selectedOption) {
      case 'delete':
        removeOrphanedShaftNodes(shaftId, nodeIds);
        break;
      case 'keep':
        // Do nothing, just close
        break;
      case 'new':
        const generatedShaftId = newShaftName.trim() || undefined;
        reassignShaftNodes(nodeIds, generatedShaftId, false);
        break;
      case 'transfer':
        reassignShaftNodes(nodeIds, targetShaftId || undefined, extendTargetRange);
        break;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-amber-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-white shadow-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Osierocone węzły SHAFT</h3>
              <p className="text-[10px] text-gray-500 font-medium">
                Pion {shaftId} • {orphanedNodes.length} osieroconych elementów
              </p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Warning info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-2">Znaleziono osierocone węzły pionu:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  {orphanedNodes.slice(0, 5).map(node => (
                    <li key={node.id}>
                      {getFloorName(node.floorId)} 
                      <span className="text-amber-500 ml-1">(x: {Math.round(node.x)}, y: {Math.round(node.y)})</span>
                    </li>
                  ))}
                  {orphanedNodes.length > 5 && (
                    <li className="text-amber-600 italic">
                      ...i {orphanedNodes.length - 5} więcej
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Wybierz akcję
            </label>

            {/* Delete option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'delete' 
                ? 'border-red-400 bg-red-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="orphan-action"
                checked={selectedOption === 'delete'}
                onChange={() => setSelectedOption('delete')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-gray-800">Usuń osierocone węzły</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Węzły SHAFT i połączenia pionowe zostaną trwale usunięte
                </p>
              </div>
            </label>

            {/* Keep option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'keep' 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="orphan-action"
                checked={selectedOption === 'keep'}
                onChange={() => setSelectedOption('keep')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-800">Pozostaw osierocone</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Elementy pozostaną na rysunku. Możesz je później ręcznie usunąć lub przenieść
                </p>
              </div>
            </label>

            {/* Create new shaft option */}
            <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'new' 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="orphan-action"
                checked={selectedOption === 'new'}
                onChange={() => setSelectedOption('new')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-800">Utwórz nowy pion</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Przypisz osierocone elementy do nowego pionu wentylacyjnego
                </p>
                {selectedOption === 'new' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={newShaftName}
                      onChange={(e) => setNewShaftName(e.target.value)}
                      placeholder="np. P2 (lub zostaw puste dla automatycznego)"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </label>

            {/* Transfer to existing option */}
            {uniqueShaftIds.length > 0 && (
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedOption === 'transfer' 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="orphan-action"
                  checked={selectedOption === 'transfer'}
                  onChange={() => setSelectedOption('transfer')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-gray-800">Przenieś do istniejącego pionu</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dołącz osierocone elementy do istniejącego pionu
                  </p>
                  {selectedOption === 'transfer' && (
                    <div className="mt-3 space-y-3">
                      <select
                        value={targetShaftId}
                        onChange={(e) => setTargetShaftId(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- wybierz pion --</option>
                        {uniqueShaftIds.map(sId => (
                          <option key={sId} value={sId}>{sId}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extendTargetRange}
                          onChange={(e) => setExtendTargetRange(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Rozszerz zakres docelowego pionu</span>
                      </label>
                    </div>
                  )}
                </div>
              </label>
            )}
          </div>
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
            onClick={handleApply}
            disabled={selectedOption === 'transfer' && !targetShaftId}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {selectedOption === 'delete' && 'Usuń'}
            {selectedOption === 'keep' && 'Zamknij'}
            {selectedOption === 'new' && 'Utwórz nowy pion'}
            {selectedOption === 'transfer' && 'Przenieś'}
          </button>
        </div>
      </div>
    </div>
  );
}
