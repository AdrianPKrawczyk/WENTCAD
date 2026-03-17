import { useStore } from 'zustand';
import { Undo2, Redo2, FolderSync, Clock, User, Eye, EyeOff, Settings2 } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';
import { useProjectStore } from '../stores/useProjectStore';

interface TopBarProps {
  onOpenVersionHistory: () => void;
  isVersionPanelOpen: boolean;
}

export function TopBar({ onOpenVersionHistory, isVersionPanelOpen }: TopBarProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  
  // Temporal store for Undo/Redo
  const temporalStore = useZoneStore.temporal;
  const { undo, redo } = temporalStore.getState();
  
  // Use useStore to subscribe to the temporal sub-store
  const undoCount = useStore(temporalStore, (state: any) => state.pastStates.length);
  const redoCount = useStore(temporalStore, (state: any) => state.futureStates.length);
  
  const showZonesOnCanvas = useZoneStore((s) => s.showZonesOnCanvas);
  const toggleShowZonesOnCanvas = useZoneStore((s) => s.toggleShowZonesOnCanvas);
  const isZoneFilterPanelOpen = useZoneStore((s) => s.isZoneFilterPanelOpen);
  const setZoneFilterPanelOpen = useZoneStore((s) => s.setZoneFilterPanelOpen);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <div 
          className="flex flex-col cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
          onClick={() => setActiveProject(null)}
        >
          <h1 className="text-sm font-bold leading-tight">WENTCAD</h1>
          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Pulpit Inżyniera</span>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* Project Info & Switcher */}
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
          <FolderSync className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-900">{activeProject?.name || 'Brak Projektu'}</span>
          <button 
            onClick={() => setActiveProject(null)}
            className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider ml-2"
          >
            Zmień Projekt
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* UNDO / REDO BUTTONS */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => undo()}
            disabled={undoCount === 0}
            title="Cofnij (Ctrl+Z)"
            className={`p-1.5 rounded-md transition-all ${
              undoCount > 0 
                ? 'text-gray-700 hover:bg-gray-100 active:scale-95' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => redo()}
            disabled={redoCount === 0}
            title="Ponów (Ctrl+Y)"
            className={`p-1.5 rounded-md transition-all ${
              redoCount > 0 
                ? 'text-gray-700 hover:bg-gray-100 active:scale-95' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        {/* CANVAS VIEW TOOLS */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => toggleShowZonesOnCanvas()}
            title={showZonesOnCanvas ? "Ukryj strefy na rzucie" : "Pokaż strefy na rzucie"}
            className={`p-1.5 rounded-md transition-all ${
              showZonesOnCanvas 
                ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {showZonesOnCanvas ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setZoneFilterPanelOpen(!isZoneFilterPanelOpen)}
            title="Filtrowanie stref i systemów"
            className={`p-1.5 rounded-md transition-all ${
              isZoneFilterPanelOpen 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={onOpenVersionHistory}
          className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${
            isVersionPanelOpen 
              ? 'bg-indigo-100 text-indigo-700 font-bold' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          Wehikuł Czasu
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex flex-col items-end">
           <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Zalogowany jako</div>
           <div className="flex items-center gap-1.5">
             <span className="text-xs font-bold text-gray-700">Inżynier HVAC</span>
             <User className="w-3 h-3 text-gray-400" />
           </div>
        </div>
      </div>
    </header>
  );
}
