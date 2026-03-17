import React from 'react';
import { X, Eye, Trash2 } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';

interface DxfOutlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DxfOutlinesModal: React.FC<DxfOutlinesModalProps> = ({ isOpen, onClose }) => {
  const activeFloorId = useZoneStore(s => s.activeFloorId);
  const floors = useZoneStore(s => s.floors);
  const activeFloor = floors[activeFloorId];
  const updateFloorState = useCanvasStore(s => s.updateFloorState);
  const setSelectedDxfOutlineId = useZoneStore(s => s.setSelectedDxfOutlineId);

  if (!isOpen) return null;

  const outlines = activeFloor?.dxfOutlines || [];

  const handleDelete = (id: string) => {
    const updatedOutlines = outlines.filter(o => o.id !== id);
    updateFloorState(activeFloorId, { dxfOutlines: updatedOutlines });
  };

  const handleShow = (id: string) => {
    setSelectedDxfOutlineId(id);
    onClose();
    // In a real app, we might want to center the camera on this outline here,
    // but for now, selecting it will highlight it and show the action panel in Workspace2D.
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Szuflada Obrysów CAD</h3>
              <p className="text-xs text-slate-500">Lista surowych poligonów zaimportowanych z projektu</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {outlines.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl block mb-4">📭</span>
              <p className="text-sm font-medium text-slate-500">Szuflada jest pusta</p>
              <p className="text-xs text-slate-400 mt-1">Użyj przycisku "Synchronizuj z CAD", aby wczytać dane.</p>
            </div>
          ) : (
            outlines.map((outline) => (
              <div 
                key={outline.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-white transition-all group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Obrys CAD</span>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    Powierzchnia: {outline.area.toFixed(2)} m²
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleShow(outline.id)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Pokaż na rzucie"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold">Pokaż</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(outline.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Usuń na stałe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
