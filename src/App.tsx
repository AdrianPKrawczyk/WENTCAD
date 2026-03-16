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
  // Split-screen state: percentage of height allocated to the table (top)
  const [splitPercent, setSplitPercent] = useState(55);
  const isDragging = useRef(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const newPercent = Math.max(20, Math.min(80, (relativeY / rect.height) * 100));
      setSplitPercent(newPercent);
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
        </aside>

        {/* CENTRUM: Split-Screen (Tabela + Canvas 2D) */}
        <main ref={workspaceRef} className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* GÓRNA SEKCJA: Tabela Bilansu */}
          <div className="overflow-hidden flex-shrink-0" style={{ height: `${splitPercent}%` }}>
            <AirBalanceTable />
          </div>

          {/* DIVIDER: Drag Handle */}
          <div
            onMouseDown={handleDividerMouseDown}
            className="h-2 bg-gray-200 hover:bg-indigo-300 active:bg-indigo-400 cursor-row-resize flex items-center justify-center shrink-0 transition-colors z-10 group"
            title="Przeciągnij, aby zmienić podział ekranu"
          >
            <div className="w-16 h-0.5 rounded-full bg-gray-400 group-hover:bg-indigo-500 transition-colors" />
          </div>

          {/* DOLNA SEKCJA: Przestrzeń Robocza 2D */}
          <div className="overflow-hidden flex-1 min-h-0" style={{ height: `${100 - splitPercent}%` }}>
            <Workspace2D />
          </div>

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
      
    </div>
  )
}

export default App


