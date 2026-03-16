import { useState, useEffect, useCallback } from 'react';
import './styles/patterns.css';
import { useZoneStore } from './stores/useZoneStore';
import { useProjectStore } from './stores/useProjectStore';
import { AirBalanceTable } from './components/AirBalanceTable';
import { ZonePropertiesPanel } from './components/ZonePropertiesPanel';
import { StatusBar } from './components/StatusBar';
import { ProjectDashboard } from './components/ProjectDashboard';
import { VersionHistoryPanel } from './components/VersionHistoryPanel';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { customDebounce } from './lib/utils';

function App() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const updateProjectState = useProjectStore((s) => s.updateProjectState);
  
  const zones = useZoneStore((s) => s.zones);
  const floors = useZoneStore((s) => s.floors);
  const systems = useZoneStore((s) => s.systems);
  const analysisPresets = useZoneStore((s) => s.analysisPresets);
  const stylePresets = useZoneStore((s) => s.stylePresets);
  const isSystemColoringEnabled = useZoneStore((s) => s.isSystemColoringEnabled);
  const columnState = useZoneStore((s) => s.columnState);
  const activeProjectIdInZoneStore = useZoneStore((s) => s.activeProjectId);
  const loadWorkspaceState = useZoneStore((s) => s.loadState); // Renamed for clarity

  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);

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
      if (projectId) { // Ensure projectId is valid before syncing
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

  // If no project is selected, show Dashboard
  if (!activeProject) {
    return <ProjectDashboard />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* TOPBAR / HEADER */}
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
             <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
             </svg>
             <span className="text-sm font-bold text-blue-900">{activeProject.name}</span>
             <button 
                onClick={() => setActiveProject(null)}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider ml-2"
             >
               Zmień Projekt
             </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
            className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${isVersionPanelOpen ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wehikuł Czasu
          </button>

          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex flex-col items-end">
             <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Zalogowany jako</div>
             <div className="text-xs font-bold text-gray-700">Inżynier HVAC</div>
          </div>
        </div>
      </header>

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

        {/* CENTRUM: Tabele Bilansowe */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden relative">
          <AirBalanceTable />
        </main>

        {/* PRAWY SIDEBAR: Inspektor */}
        <ZonePropertiesPanel />

        {/* TIME MACHINE PANEL (OVERLAY/DRAWER) */}
        {isVersionPanelOpen && (
          <div className="fixed inset-y-0 right-0 z-30 flex">
             {/* Backdrop logic can go here if needed */}
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

