import { useMemo } from 'react';
import { X, Link } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { calculatePolygonArea } from '../lib/geometryUtils';

interface LinkOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlineId: string;
}

export function LinkOutlineModal({ isOpen, onClose, outlineId }: LinkOutlineModalProps) {
  const zones = useZoneStore((s) => s.zones);
  const activeFloorId = useZoneStore((s) => s.activeFloorId);
  const canvasFloors = useCanvasStore((s) => s.floors);
  const updateFloorState = useCanvasStore((s) => s.updateFloorState);
  const setSelectedDxfOutlineId = useZoneStore((s) => s.setSelectedDxfOutlineId);
  const updateZone = useZoneStore((s) => s.updateZone);

  // Filtrujemy tylko te pomieszczenia, które nie mają poligonu na ŻADNEJ kondygnacji
  // ORAZ należą do aktualnie wybranej kondygnacji
  const unassignedZones = useMemo(() => {
    const allLinkedZoneIds = new Set(
      Object.values(canvasFloors).flatMap((f) => (f.polygons || []).map((p) => p.zoneId))
    );
    return Object.values(zones)
      .filter((z) => !allLinkedZoneIds.has(z.id) && z.floorId === activeFloorId)
      .sort((a, b) => a.nr.localeCompare(b.nr, undefined, { numeric: true }));
  }, [zones, canvasFloors, activeFloorId]);

  if (!isOpen) return null;

  const handleLink = (zoneId: string) => {
    const activeCanvasFloor = canvasFloors[activeFloorId];
    if (!activeCanvasFloor) return;

    // 1. Znajdź obrys
    const outline = (activeCanvasFloor.dxfOutlines || []).find((o) => o.id === outlineId);
    if (!outline) return;

    // 2. Utwórz nowy poligon
    const newPoly = { id: crypto.randomUUID(), zoneId, points: outline.points };

    // 3. Usuń stary obrys z szuflady
    const filteredOutlines = (activeCanvasFloor.dxfOutlines || []).filter((o) => o.id !== outlineId);

    // 4. Aktualizuj stan rzutu
    updateFloorState(activeFloorId, {
      dxfOutlines: filteredOutlines,
      polygons: [...activeCanvasFloor.polygons, newPoly],
    });

    // 5. Aktualizuj dane strefy (Powierzchnia)
    const scaleFactor = activeCanvasFloor.scaleFactor || 1;
    const areaSqM = calculatePolygonArea(outline.points) * (scaleFactor ** 2);
    updateZone(zoneId, {
        geometryArea: areaSqM,
        isAreaManual: false
    });

    setSelectedDxfOutlineId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-600" />
            Przyłącz do pomieszczenia
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 hover:scrollbar-thumb-slate-300 scrollbar-thin scrollbar-thumb-slate-200">
          {unassignedZones.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-4">📋</span>
              <p className="text-slate-500 text-sm font-medium">Brak wolnych pomieszczeń</p>
              <p className="text-xs text-slate-400 mt-1">Wszystkie wiersze z tabeli mają już przypisane obrysy.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Nieprzypisane w tabeli:</p>
              {unassignedZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleLink(zone.id)}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md hover:translate-x-1 transition-all text-left group"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm leading-tight">{zone.nr}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity">KLIKNIJ</span>
                    <Link className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95"
            >
                Anuluj
            </button>
        </div>
      </div>
    </div>
  );
}
