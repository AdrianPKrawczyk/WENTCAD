import { useEffect, useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useZoneStore } from '../stores/useZoneStore';
import type { Project } from '../types';

export function ProjectDashboard() {
  const { projects, isLoading, fetchProjects, createProject, setActiveProject, deleteProject } = useProjectStore();
  const loadWorkspaceState = useZoneStore((s) => s.loadState);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    const project = await createProject(newProjectName.trim());
    if (project) {
      loadWorkspaceState(project.id, project.state_data);
      setActiveProject(project);
    }
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleOpen = (project: Project) => {
    loadWorkspaceState(project.id, project.state_data);
    setActiveProject(project);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-50 overflow-auto">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Projektów</h1>
            <p className="text-slate-400">Zarządzaj swoimi bilansami powietrza w jednym miejscu.</p>
          </div>
          <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
             <div className="text-blue-500 font-bold text-xl">WENTCAD</div>
             <div className="text-[10px] text-blue-400 uppercase tracking-tighter">Professional Edition</div>
          </div>
        </div>

        {/* NOWY PROJEKT BAR */}
        <div className="mb-12">
          <div className="flex gap-3 bg-slate-700/30 p-4 rounded-xl border border-slate-700">
            <input 
              type="text" 
              placeholder="Nazwa nowego projektu..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleCreate}
              disabled={isCreating || !newProjectName.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 min-w-[180px]"
            >
              {isCreating ? 'Tworzenie...' : 'Utwórz Nowy Projekt'}
            </button>
          </div>
          {useProjectStore.getState().error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-3">
               <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <div className="text-xs text-red-400">
                 <p className="font-bold text-red-500 mb-1">Błąd: {useProjectStore.getState().error}</p>
                 {useProjectStore.getState().error?.includes('Anonymous sign-ins are disabled') && (
                   <div className="space-y-1">
                     <p>Wymagana jest konfiguracja Supabase:</p>
                     <ul className="list-disc list-inside ml-2">
                       <li>Przejdź do: <span className="text-blue-400 font-mono">Authentication {'->'} Providers {'->'} Email</span></li>
                       <li>Włącz opcję: <span className="text-white font-bold">Allow anonymous sign-ins</span></li>
                       <li>Zapisz zmiany w Supabase Dashboard.</li>
                     </ul>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* LISTA PROJEKTÓW */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Twoje Projekty ({projects.length})</h2>
            <input 
              type="text" 
              placeholder="Szukaj projektu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 text-white focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          {isLoading && projects.length === 0 ? (
            <div className="py-20 text-center text-slate-500">Pobieranie listy projektów...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-slate-700/10 rounded-xl border border-dashed border-slate-700">
              Nie znaleziono projektów. Utwórz pierwszy!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className="group relative bg-slate-700/20 hover:bg-slate-700/40 border border-slate-700 p-5 rounded-xl transition-all cursor-pointer"
                  onClick={() => handleOpen(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-500 uppercase tracking-widest">
                        <span>Ostatnia zmiana: {new Date(project.updated_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{Object.keys(project.state_data.zones || {}).length} Pomieszczeń</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Czy na pewno usunąć projekt "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-all rounded-lg"
                      title="Usuń projekt"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
