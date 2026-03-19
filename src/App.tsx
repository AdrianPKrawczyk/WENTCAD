import { useState, useEffect, useCallback, useRef } from 'react';
import './styles/patterns.css';
import { useZoneStore } from './stores/useZoneStore';
import { useProjectStore } from './stores/useProjectStore';
import { AirBalanceTable } from './components/AirBalanceTable';
import { ZonePropertiesPanel } from './components/ZonePropertiesPanel';
import { StatusBar } from './components/StatusBar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { VersionHistoryPanel } from './components/VersionHistoryPanel';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ExportDashboard } from './components/ExportDashboard';
import { TopBar } from './components/TopBar';
import { Workspace2D } from './components/Workspace2D';
import { useUIStore } from './stores/useUIStore';
import { 
  Calculator, 
  Layers, 
  GitBranch, 
  Box, 
  Volume2, 
  List, 
  Download,
  Table2, 
  Square, 
  PanelLeft, 
  PanelTop,
  PanelRight
} from 'lucide-react';
import { Toaster } from 'sonner';
import { customDebounce } from './lib/utils';

function App() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const updateProjectState = useProjectStore((s) => s.updateProjectState);
  
  const zones = useZoneStore((s) => s.zones);
  const floors = useZoneStore((s) => s.floors);
  const systems = useZoneStore((s) => s.systems);
  const analysisPresets = useZoneStore((s) => s.analysisPresets);
  const stylePresets = useZoneStore((s) => s.stylePresets);
  const isSystemColoringEnabled = useZoneStore((s) => s.isSystemColoringEnabled);
  const columnState = useZoneStore((s) => s.columnState);
  const activeProjectIdInZoneStore = useZoneStore((s) => s.activeProjectId);
  const loadWorkspaceState = useZoneStore((s) => s.loadState);

  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [splitPercent, setSplitPercent] = useState(55);
  // Stage management
  const { currentStage, setCurrentStage, viewMode, setViewMode } = useUIStore();
  
  const isDragging = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = (viewMode === 'split-vertical' || viewMode === 'split-vertical-reversed') ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [viewMode]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      
      if (currentStage === 2) {
        if (viewMode === 'split-horizontal') {
          const relativeY = e.clientY - rect.top;
          const newPercent = Math.max(10, Math.min(90, (relativeY / rect.height) * 100));
          setSplitPercent(newPercent);
        } else if (viewMode === 'split-vertical' || viewMode === 'split-vertical-reversed') {
          const relativeX = e.clientX - rect.left;
          const newPercent = Math.max(10, Math.min(90, (relativeX / rect.width) * 100));
          setSplitPercent(newPercent);
        }
      }
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // RESTORATION LOGIC (F5 Fix)
  useEffect(() => {
    if (activeProject && activeProjectIdInZoneStore !== activeProject.id) {
      console.log('Restoring project state from activeProject persistence...');
      loadWorkspaceState(activeProject.id, activeProject.state_data);
    }
  }, [activeProject, activeProjectIdInZoneStore, loadWorkspaceState]);

  // SILENT SYNC LOGIC
  const debouncedSync = useCallback(
    customDebounce((projectId: string, state: any) => {
      if (projectId) {
        updateProjectState(projectId, state);
      }
    }, 3000),
    [updateProjectState]
  );

  useEffect(() => {
    if (activeProject) {
      const stateToSync = { 
        zones, 
        floors, 
        systems, 
        analysisPresets, 
        stylePresets, 
        isSystemColoringEnabled,
        columnState
      };
      debouncedSync(activeProject.id, stateToSync);
    }
  }, [zones, floors, systems, analysisPresets, stylePresets, isSystemColoringEnabled, columnState, activeProject, debouncedSync]);

  // KEYBOARD SHORTCUTS LOGIC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            useZoneStore.temporal.getState().redo();
          } else {
            useZoneStore.temporal.getState().undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          useZoneStore.temporal.getState().redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If no project is selected, show Dashboard
  if (!activeProject) {
    return <ProjectDashboard />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      <TopBar 
        onOpenVersionHistory={() => setIsVersionPanelOpen(!isVersionPanelOpen)} 
        isVersionPanelOpen={isVersionPanelOpen} 
      />

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEWY SIDEBAR: Router Etapów */}
        <aside className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4 space-y-2 shadow-sm z-20 shrink-0">
          {[
            { id: 1, name: 'Bilans', icon: Calculator, color: 'text-blue-600' },
            { id: 2, name: 'Podkłady', icon: Layers, color: 'text-indigo-600' },
            { id: 3, name: 'Instalacje', icon: GitBranch, color: 'text-orange-600' },
            { id: 4, name: 'Aksonometria', icon: Box, color: 'text-purple-600' },
            { id: 5, name: 'Akustyka', icon: Volume2, color: 'text-red-600' },
            { id: 6, name: 'Zestawienia', icon: List, color: 'text-green-600' },
            { id: 7, name: 'Eksport', icon: Download, color: 'text-slate-600' },
          ].map((stage) => (
            <button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id)}
              title={stage.name}
              className={`p-2.5 rounded-xl transition-all relative group ${
                currentStage === stage.id
                  ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              <stage.icon className={`w-5 h-5 ${currentStage === stage.id ? stage.color : ''}`} />
              {currentStage === stage.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
              
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900/95 backdrop-blur shadow-2xl text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 translate-x-[-4px] group-hover:translate-x-0 whitespace-nowrap z-[100]">
                {stage.name}
              </div>
            </button>
          ))}
        </aside>

        {/* SECONDARY SIDEBAR: Stage Tools */}
        {currentStage === 2 && (
          <aside className="w-12 bg-white/50 backdrop-blur-sm border-r border-gray-100 flex flex-col items-center py-4 space-y-3 z-10 shrink-0 animate-in slide-in-from-left-4 duration-300">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Widok</div>
            <button
              onClick={() => setViewMode('table')}
              title="Tylko Tabela"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:bg-white hover:text-gray-600'
              }`}
            >
              <Table2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              title="Tylko Rysunek"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'canvas' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:bg-white hover:text-gray-600'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('split-vertical');
                setSplitPercent(50);
              }}
              title="Podział Pionowy"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'split-vertical' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:bg-white hover:text-gray-600'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('split-horizontal');
                setSplitPercent(50);
              }}
              title="Podział Poziomy"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'split-horizontal' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:bg-white hover:text-gray-600'
              }`}
            >
              <PanelTop className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('split-vertical-reversed');
                setSplitPercent(50);
              }}
              title="Podział Pionowy (Tabela po prawej)"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'split-vertical-reversed' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:bg-white hover:text-gray-600'
              }`}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </aside>
        )}

        {/* CENTRUM: Dynamiczny Router Etapów */}
        <main ref={workspaceRef} className={`flex-1 flex min-w-0 overflow-hidden relative ${
          currentStage === 2 
            ? (viewMode === 'split-vertical' ? 'flex-row' : viewMode === 'split-vertical-reversed' ? 'flex-row-reverse' : 'flex-col') 
            : 'flex-col'
        }`}>
          {currentStage === 1 && (
            <div className="flex-1 overflow-hidden">
              <AirBalanceTable />
            </div>
          )}

          {currentStage === 2 && (
            <>
              {/* TABELA */}
              {(viewMode === 'table' || viewMode.startsWith('split')) && (
                <div 
                  className="overflow-hidden flex-shrink-0" 
                  style={{ 
                    height: viewMode === 'split-horizontal' ? `${splitPercent}%` : viewMode === 'table' ? '100%' : 'auto',
                    width: (viewMode === 'split-vertical' || viewMode === 'split-vertical-reversed') ? `${viewMode === 'split-vertical' ? splitPercent : 100 - splitPercent}%` : 'auto',
                    flex: (viewMode === 'split-vertical' || viewMode === 'split-vertical-reversed') ? 'none' : (viewMode === 'table' ? '1' : 'none')
                  }}
                >
                  <AirBalanceTable />
                </div>
              )}

              {/* DIVIDER */}
              {viewMode.startsWith('split') && (
                <div
                  onMouseDown={handleDividerMouseDown}
                  className={`bg-gray-200 hover:bg-indigo-300 active:bg-indigo-400 flex items-center justify-center shrink-0 transition-colors z-10 group ${
                    viewMode === 'split-horizontal' ? 'h-2 w-full cursor-row-resize' : 'w-2 h-full cursor-col-resize'
                  }`}
                  title="Przeciągnij, aby zmienić podział ekranu"
                >
                  <div className={`bg-gray-400 group-hover:bg-indigo-500 transition-colors rounded-full ${
                    viewMode === 'split-horizontal' ? 'w-16 h-0.5' : 'h-16 w-0.5'
                  }`} />
                </div>
              )}

              {/* CANVAS */}
              {(viewMode === 'canvas' || viewMode.startsWith('split')) && (
                <div 
                  className="overflow-hidden flex-1 min-h-0 min-w-0" 
                  style={{ 
                    height: viewMode === 'split-horizontal' ? `${100 - splitPercent}%` : viewMode === 'canvas' ? '100%' : 'auto',
                    width: (viewMode === 'split-vertical' || viewMode === 'split-vertical-reversed') ? `${viewMode === 'split-vertical' ? 100 - splitPercent : splitPercent}%` : 'auto'
                  }}
                >
                  <Workspace2D />
                </div>
              )}
            </>
          )}

          {currentStage === 7 && (
            <div className="flex-1 overflow-hidden">
              <ExportDashboard />
            </div>
          )}

          {currentStage > 2 && currentStage !== 7 && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <Box className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-bold">Moduł w przygotowaniu...</h2>
              <p className="text-sm">Ten etap projektu będzie dostępny wkrótce.</p>
            </div>
          )}
        </main>

        {/* PRAWY SIDEBAR: Inspektor */}
        <ZonePropertiesPanel />

        {/* TIME MACHINE PANEL (OVERLAY/DRAWER) */}
        {isVersionPanelOpen && (
          <div className="fixed inset-y-0 right-0 z-30 flex">
             <VersionHistoryPanel />
             <button 
                onClick={() => setIsVersionPanelOpen(false)}
                className="absolute top-4 -left-10 bg-white p-2 rounded-l-md border border-r-0 border-gray-200 shadow-md text-gray-400 hover:text-gray-600"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
        )}

      </div>

      {/* PANEL ANALIZY */}
      <AnalysisDashboard />

      {/* PASEK STANU */}
      <StatusBar />

      {/* POWIADOMIENIA */}
      <Toaster position="top-center" richColors />
      
    </div>
  )
}

export default App


