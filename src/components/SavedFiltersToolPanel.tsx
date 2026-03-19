import { useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Star, Save, Trash2, CheckCircle2 } from 'lucide-react';

export const SavedFiltersToolPanel = (props: any) => {
  const { savedColumnProfiles, defaultProfileId, saveColumnProfile, deleteColumnProfile, setDefaultProfile } = useSettingsStore();
  const [newFilterName, setNewFilterName] = useState('');

  const handleSave = () => {
    if (!newFilterName.trim()) return;
    const currentState = props.api.getColumnState();
    saveColumnProfile(newFilterName.trim(), currentState);
    setNewFilterName('');
  };

  const handleApply = (profileState: any) => {
    props.api.applyColumnState({ state: profileState, applyOrder: true });
    // Also save debounced to local project columnState to not lose it if we refresh
    // We can just rely on grid event `onSortChanged` / `onColumnMoved` etc., which triggers save.
    // However applyColumnState normally fires events which trigger our debouncedSaveState anyway.
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
      <div className="p-4 bg-white border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Save className="w-4 h-4 text-indigo-600" />
          Zapisane Szablony
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Zarządzaj widocznością i układem kolumn globalnie dla wszystkich projektów.
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
            placeholder="Nazwa nowego filtru..."
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!newFilterName.trim()}
            className="bg-indigo-600 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Zapisz
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {savedColumnProfiles.length === 0 ? (
          <div className="text-center p-4 text-xs text-slate-400 italic">
            Brak zapisanych szablonów kolumn.
          </div>
        ) : (
          <ul className="space-y-2">
            {savedColumnProfiles.map((profile) => {
              const isDefault = defaultProfileId === profile.id;
              return (
                <li
                  key={profile.id}
                  className={`bg-white border rounded-lg p-2.5 transition-all outline-none 
                    ${isDefault ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200 hover:border-indigo-300'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 truncate" title={profile.name}>
                      {profile.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDefaultProfile(isDefault ? null : profile.id)}
                        className={`p-1 rounded transition-colors ${isDefault ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                        title={isDefault ? "Usuń znacznik domyślny" : "Ustaw jako domyślny dla nowych projektów"}
                      >
                        <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteColumnProfile(profile.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Usuń ten filtr"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleApply(profile.state)}
                    className="w-full flex justify-center items-center gap-1.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-medium rounded transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Wczytaj widok
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
