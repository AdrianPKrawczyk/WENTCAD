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
import { TopBar } from './components/TopBar';
import { Workspace2D } from './components/Workspace2D';
import { useUIStore } from './stores/useUIStore';
import { Table2, Square, PanelTop, PanelLeft } from 'lucide-react';
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
  // Split-screen state
  const [splitPercent, setSplitPercent] = useState(55);
  const { viewMode, setViewMode } = useUIStore();
  
  const isDragging = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = viewMode === 'split-vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [viewMode]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      
      if (viewMode === 'split-horizontal') {
        const relativeY = e.clientY - rect.top;
        const newPercent = Math.max(10, Math.min(90, (relativeY / rect.height) * 100));
        setSplitPercent(newPercent);
      } else if (viewMode === 'split-vertical') {
        const relativeX = e.clientX - rect.left;
        const newPercent = Math.max(10, Math.min(90, (relativeX / rect.width) * 100));
        setSplitPercent(newPercent);
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
        
        {/* LEWY SIDEBAR */}
        <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4 shadow-sm z-10 shrink-0">
          <div className="p-2 bg-blue-600 text-white rounded-lg cursor-pointer shadow-md shadow-blue-200" title="Bilans Powietrza">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="w-8 h-px bg-gray-100 my-2" />

          {/* VIEW MODE SELECTORS */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setViewMode('table')}
              title="Tylko Tabela"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Table2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              title="Tylko Rysunek"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'canvas' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('split-vertical');
                setSplitPercent(50);
              }}
              title="Podział Pionowy"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'split-vertical' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setViewMode('split-horizontal');
                setSplitPercent(50);
              }}
              title="Podział Poziomy"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'split-horizontal' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <PanelTop className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* CENTRUM: Dynamiczny Layout */}
        <main ref={workspaceRef} className={`flex-1 flex min-w-0 overflow-hidden relative ${viewMode === 'split-vertical' ? 'flex-row' : 'flex-col'}`}>

          {/* TABELA */}
          {(viewMode === 'table' || viewMode.startsWith('split')) && (
            <div 
              className="overflow-hidden flex-shrink-0" 
              style={{ 
                height: viewMode === 'split-horizontal' ? `${splitPercent}%` : viewMode === 'table' ? '100%' : 'auto',
                width: viewMode === 'split-vertical' ? `${splitPercent}%` : 'auto',
                flex: viewMode === 'split-vertical' ? 'none' : (viewMode === 'table' ? '1' : 'none')
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
                width: viewMode === 'split-vertical' ? `${100 - splitPercent}%` : 'auto'
              }}
            >
              <Workspace2D />
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


