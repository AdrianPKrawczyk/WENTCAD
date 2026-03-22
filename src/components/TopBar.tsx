import React from 'react';
import { useStore } from 'zustand';
import { 
  Settings2, 
  Clock, 
  User, 
  Eye, 
  EyeOff, 
  Download,
  Upload,
  Undo2,
  Redo2,
  FolderSync,
  Map
} from 'lucide-react';
import { useUIStore } from '../stores/useUIStore';
import { useZoneStore } from '../stores/useZoneStore';
import { useDuctStore } from '../stores/useDuctStore';
import { useProjectStore } from '../stores/useProjectStore';
import { exportCurrentProjectData, downloadProjectFile } from '../lib/projectTransfer';
import { ProjectImportModal } from './ProjectImportModal';
import { importProjectService } from '../lib/importProjectService';
import { WATTManagerModal } from './WATTManagerModal';
import { Database, Zap } from 'lucide-react';

const STAGE_NAMES: Record<number, string> = {
  1: 'Krok 1 (Bilans)',
  2: 'Krok 2 (Podkłady)',
  3: 'Krok 3 (Instalacje)',
  4: 'Krok 4 (Aksonometria)',
  5: 'Krok 5 (Akustyka)',
  6: 'Krok 6 (Zestawienia)',
  7: 'Krok 7 (Eksport)',
};

interface TopBarProps {
  onOpenVersionHistory: () => void;
  isVersionPanelOpen: boolean;
}

export function TopBar({ onOpenVersionHistory, isVersionPanelOpen }: TopBarProps) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const currentStage = useUIStore((s) => s.currentStage);
  
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isWattModalOpen, setIsWattModalOpen] = React.useState(false);
  
  // Temporal store for Undo/Redo
  const zoneTemporalStore = useZoneStore.temporal;
  const ductTemporalStore = useDuctStore.temporal;
  
  const isDuctStage = currentStage === 3;
  const activeTemporalStore = isDuctStage ? ductTemporalStore : zoneTemporalStore;
  
  const { undo, redo } = activeTemporalStore.getState();
  
  // Use useStore to subscribe to the temporal sub-store
  const undoCount = useStore(activeTemporalStore, (state: any) => state.pastStates.length);
  const redoCount = useStore(activeTemporalStore, (state: any) => state.futureStates.length);
  
  const showZonesOnCanvas = useZoneStore((s) => s.showZonesOnCanvas);
  const toggleShowZonesOnCanvas = useZoneStore((s) => s.toggleShowZonesOnCanvas);
  const isZoneFilterPanelOpen = useZoneStore((s) => s.isZoneFilterPanelOpen);
  const setZoneFilterPanelOpen = useZoneStore((s) => s.setZoneFilterPanelOpen);

  const isFloorSwitcherVisible = useUIStore((s) => s.isFloorSwitcherVisible);
  const setIsFloorSwitcherVisible = useUIStore((s) => s.setIsFloorSwitcherVisible);
  
  const analyzeAllZones = useZoneStore((s) => s.analyzeAllZones);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <div 
          className="flex flex-col cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
          onClick={() => setActiveProject(null)}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold leading-tight">WENTCAD</h1>
            {activeProject && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                {STAGE_NAMES[currentStage] || `Krok ${currentStage}`}
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">Pulpit Inżyniera</span>
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

          <div className="h-4 w-px bg-gray-200 mx-1"></div>

          <button
            onClick={() => setIsFloorSwitcherVisible(!isFloorSwitcherVisible)}
            title={isFloorSwitcherVisible ? "Ukryj przełącznik kondygnacji" : "Pokaż przełącznik kondygnacji"}
            className={`p-1.5 rounded-md transition-all ${
              isFloorSwitcherVisible 
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Map className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1"></div>

          <button
            onClick={() => setIsWattModalOpen(true)}
            title="Katalog Przegród i Materiałów (WATT)"
            className={`p-1.5 rounded-md transition-all ${
              isWattModalOpen 
                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
            }`}
          >
            <Database className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1"></div>

          <button
            onClick={() => {
               analyzeAllZones();
               toast.success("Przeprowadzono analizę topologiczną całego budynku (WATT).");
            }}
            title="Analizuj model 3D budynku (WATT)"
            className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 group"
          >
            <Zap className="w-5 h-5 group-hover:fill-indigo-600 transition-all" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-all flex items-center gap-2 text-sm font-medium border border-transparent hover:border-slate-300"
          title="Wczytaj i połącz plik projektu (.wentcad)"
        >
          <Upload className="w-5 h-5" />
          Wczytaj
        </button>
        <button 
          onClick={() => {
            const data = exportCurrentProjectData();
            if (data) {
              downloadProjectFile(data);
            }
          }}
          className="p-2 rounded-md hover:bg-indigo-50 text-indigo-600 transition-all flex items-center gap-2 text-sm font-medium border border-transparent hover:border-indigo-200"
          title="Pobierz plik projektu z kopią zapasową (.wentcad)"
        >
          <Download className="w-5 h-5" />
          Zapisz (.wentcad)
        </button>
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

      <ProjectImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentProjectId={activeProject?.id}
        onImport={async (data, options) => {
          try {
            await importProjectService.execute(data, options);
          } catch (e: any) {
             alert('Błąd importu: ' + e.message);
          }
        }}
      />
      <WATTManagerModal
        isOpen={isWattModalOpen}
        onClose={() => setIsWattModalOpen(false)}
      />
    </header>
  );
}
