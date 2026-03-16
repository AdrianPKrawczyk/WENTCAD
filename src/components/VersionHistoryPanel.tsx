import { useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useZoneStore } from '../stores/useZoneStore';

export function VersionHistoryPanel() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const versions = useProjectStore((s) => s.versions);
  const saveSnapshot = useProjectStore((s) => s.saveSnapshot);
  const restoreSnapshot = useProjectStore((s) => s.restoreSnapshot);
  const loadWorkspaceState = useZoneStore((s) => s.loadState);

  const zones = useZoneStore((s) => s.zones);
  const floors = useZoneStore((s) => s.floors);
  const systems = useZoneStore((s) => s.systems);

  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateSnapshot = async () => {
    if (!newSnapshotName.trim()) return;
    setIsSaving(true);
    await saveSnapshot(newSnapshotName.trim(), { zones, floors, systems });
    setNewSnapshotName('');
    setIsSaving(false);
  };

  const handleRestore = async (version: any) => {
    const ok = window.confirm(
      `Czy na pewno chcesz przywrócić wersję "${version.name}"?\nNiezapisane zmiany w obecnej sesji zostaną utracone.`
    );
    if (ok) {
      await restoreSnapshot(version);
      loadWorkspaceState(version.state_data);
    }
  };

  if (!activeProject) return null;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-80 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historia Wersji
        </h2>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="Nazwa migawki..."
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
          <button 
            disabled={!newSnapshotName.trim() || isSaving}
            onClick={handleCreateSnapshot}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Zapisywanie...' : 'Utwórz Migawkę'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs italic">
            Brak zapisanych wersji.
          </div>
        ) : (
          versions.map((version) => (
            <div 
              key={version.id}
              className="p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group relative"
            >
              <h3 className="text-xs font-bold text-gray-800 mb-1">{version.name}</h3>
              <div className="text-[10px] text-gray-500">
                {new Date(version.created_at).toLocaleString()}
              </div>
              <button 
                onClick={() => handleRestore(version)}
                className="mt-2 text-[10px] text-indigo-600 font-bold hover:text-indigo-800 hidden group-hover:block transition-all"
              >
                Przywróć tę wersję
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 italic">
        Snapshoty pozwalają wrócić do dowolnego punktu w historii projektu.
      </div>
    </div>
  );
}
