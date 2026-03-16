import { useState, useEffect } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { SystemWizardModal } from './SystemWizardModal';
import { Wand2, X, Plus, Trash2 } from 'lucide-react';

export function SystemManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const systems = useZoneStore((state) => state.systems);
  const addSystem = useZoneStore((state) => state.addSystem);
  const updateSystem = useZoneStore((state) => state.updateSystem);
  const removeSystem = useZoneStore((state) => state.removeSystem);
  const generateAutoColors = useZoneStore((state) => state.generateAutoColors);
  const stylePresets = useZoneStore((state) => state.stylePresets);
  const saveStylePreset = useZoneStore((state) => state.saveStylePreset);
  const globalSystemOpacity = useZoneStore((state) => state.globalSystemOpacity);
  const setGlobalSystemOpacity = useZoneStore((state) => state.setGlobalSystemOpacity);
  
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'SUPPLY'|'EXHAUST'|'INTAKE'|'OUTTAKE'>('SUPPLY');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Autofill logic for new system name
  useEffect(() => {
    if (!newName || newName.startsWith('Wentylacja ogólna')) {
        if (newType === 'SUPPLY') setNewName('Wentylacja ogólna nawiewna: ');
        if (newType === 'EXHAUST') setNewName('Wentylacja ogólna wywiewna: ');
        if (newType === 'INTAKE') setNewName('Czerpnia: ');
        if (newType === 'OUTTAKE') setNewName('Wyrzutnia: ');
    }
  }, [newType]);

  const patterns = [
    { id: '', name: 'Brak' },
    { id: 'hvac-pattern-diagonal', name: 'Ukośne' },
    { id: 'hvac-pattern-dots', name: 'Kropki' },
    { id: 'hvac-pattern-crosshatch', name: 'Kratka' },
    { id: 'hvac-pattern-vertical', name: 'Pionowe' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Wand2 className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Menadżer Systemów i Stylizacji</h2>
                <p className="text-gray-400 text-xs font-medium">Konfiguracja parametrów wizualnych i logicznych</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button 
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
                <Wand2 className="w-4 h-4" /> Uruchom Kreator
            </button>
            <button 
              onClick={() => generateAutoColors()}
              className="px-4 py-2 bg-white text-indigo-700 border-2 border-indigo-50 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all active:scale-95"
            >
              🎨 Automatyczne kolory
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 shadow-sm">
           <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Przezroczystość globalna:</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={globalSystemOpacity} 
                onChange={(e) => setGlobalSystemOpacity(Number(e.target.value))}
                className="w-32 h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-mono font-bold text-indigo-700 w-8">{globalSystemOpacity}%</span>
           </div>
           <div className="h-4 w-px bg-indigo-200"></div>
           <div className="text-[10px] text-indigo-600 italic">
             (Zalecane: 15-25% dla czytelności tekstu w Dark Mode)
           </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-4 text-[10px] text-amber-800 flex items-center gap-2">
           <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <div>
             <strong>Legenda:</strong> <strong>P</strong> — Priorytet Koloru (ten system narzuca kolor wiersza), <strong>W</strong> — Priorytet Wzoru (ten system narzuca deseń).
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-white min-h-[500px]">
          <div className="grid grid-cols-2 gap-10">
            {/* SUPPLY SIDE */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-indigo-600 text-sm uppercase tracking-widest border-b-2 border-indigo-100 pb-2">
                <div className="w-2 h-4 bg-indigo-600 rounded-sm"></div>
                Systemy Nawiewne (N)
              </h3>
              <ul className="space-y-3">
                {systems.filter(s => s.type === 'SUPPLY').map(sys => (
                   <li key={sys.id} className="group flex items-center gap-3 bg-gray-50/50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input 
                            type="color" 
                            value={sys.color || '#ffffff'} 
                            onChange={(e) => updateSystem(sys.id, { color: e.target.value })}
                            className="w-10 h-10 border-0 p-0 cursor-pointer bg-transparent rounded-lg overflow-hidden shrink-0"
                            title="Zmień kolor"
                          />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                             <input 
                                type="text"
                                value={sys.id}
                                onChange={(e) => updateSystem(sys.id, { id: e.target.value.toUpperCase() })}
                                className="bg-transparent font-black text-gray-800 text-sm outline-none focus:bg-white px-1 rounded transition-colors"
                             />
                             <input 
                                type="text"
                                value={sys.name}
                                onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
                                className="bg-transparent text-gray-400 italic text-[11px] outline-none focus:bg-white px-1 rounded transition-colors truncate"
                             />
                          </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                          <select 
                            value={sys.patternId || ''} 
                            onChange={(e) => updateSystem(sys.id, { patternId: e.target.value })}
                            className="bg-white border border-gray-200 rounded-lg py-1 px-2 text-[10px] font-bold text-gray-500 outline-none focus:border-indigo-300 transition-all"
                          >
                            {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>

                          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                            <label className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors" title="Priorytet Koloru">
                                <input type="checkbox" checked={sys.isColorPriority || false} onChange={e => updateSystem(sys.id, { isColorPriority: e.target.checked })} className="w-3.5 h-3.5 text-indigo-600 rounded-sm border-gray-300" />
                                <span className="text-[10px] font-black text-gray-400">P</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors" title="Priorytet Wzoru">
                                <input type="checkbox" checked={sys.isPatternPriority || false} onChange={e => updateSystem(sys.id, { isPatternPriority: e.target.checked })} className="w-3.5 h-3.5 text-indigo-600 rounded-sm border-gray-300" />
                                <span className="text-[10px] font-black text-gray-400">W</span>
                            </label>
                          </div>

                          <button onClick={() => {
                            if (window.confirm(`Usuń system ${sys.id}?`)) removeSystem(sys.id);
                          }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                   </li>
                ))}
              </ul>
            </div>

            {/* EXHAUST SIDE */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-red-600 text-sm uppercase tracking-widest border-b-2 border-red-100 pb-2">
                <div className="w-2 h-4 bg-red-600 rounded-sm"></div>
                Systemy Wywiewne (W)
              </h3>
              <ul className="space-y-3">
                {systems.filter(s => s.type === 'EXHAUST').map(sys => (
                   <li key={sys.id} className="group flex items-center gap-3 bg-gray-50/50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-50 transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input 
                            type="color" 
                            value={sys.color || '#ffffff'} 
                            onChange={(e) => updateSystem(sys.id, { color: e.target.value })}
                            className="w-10 h-10 border-0 p-0 cursor-pointer bg-transparent rounded-lg overflow-hidden shrink-0"
                            title="Zmień kolor"
                          />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                             <input 
                                type="text"
                                value={sys.id}
                                onChange={(e) => updateSystem(sys.id, { id: e.target.value.toUpperCase() })}
                                className="bg-transparent font-black text-gray-800 text-sm outline-none focus:bg-white px-1 rounded transition-colors"
                             />
                             <input 
                                type="text"
                                value={sys.name}
                                onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
                                className="bg-transparent text-gray-400 italic text-[11px] outline-none focus:bg-white px-1 rounded transition-colors truncate"
                             />
                          </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                          <select 
                            value={sys.patternId || ''} 
                            onChange={(e) => updateSystem(sys.id, { patternId: e.target.value })}
                            className="bg-white border border-gray-200 rounded-lg py-1 px-2 text-[10px] font-bold text-gray-500 outline-none focus:border-red-300 transition-all"
                          >
                            {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>

                          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                            <label className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors" title="Priorytet Koloru">
                                <input type="checkbox" checked={sys.isColorPriority || false} onChange={e => updateSystem(sys.id, { isColorPriority: e.target.checked })} className="w-3.5 h-3.5 text-red-600 rounded-sm border-gray-300" />
                                <span className="text-[10px] font-black text-gray-400">P</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors" title="Priorytet Wzoru">
                                <input type="checkbox" checked={sys.isPatternPriority || false} onChange={e => updateSystem(sys.id, { isPatternPriority: e.target.checked })} className="w-3.5 h-3.5 text-red-600 rounded-sm border-gray-300" />
                                <span className="text-[10px] font-black text-gray-400">W</span>
                            </label>
                          </div>

                          <button onClick={() => {
                            if (window.confirm(`Usuń system ${sys.id}?`)) removeSystem(sys.id);
                          }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mt-10">
            {/* INTAKE SIDE */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-teal-600 text-sm uppercase tracking-widest border-b-2 border-teal-100 pb-2">
                <div className="w-2 h-4 bg-teal-600 rounded-sm"></div>
                Czerpnie (C)
              </h3>
              <ul className="space-y-2">
                {systems.filter(s => s.type === 'INTAKE').map(sys => (
                   <li key={sys.id} className="group flex items-center gap-3 bg-gray-50/50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-50 transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input 
                            type="text"
                            value={sys.id}
                            onChange={(e) => updateSystem(sys.id, { id: e.target.value.toUpperCase() })}
                            className="bg-transparent font-black text-gray-800 text-sm w-16 outline-none focus:bg-white px-1 rounded transition-colors"
                          />
                          <input 
                            type="text"
                            value={sys.name}
                            onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
                            className="bg-transparent text-gray-400 italic text-[11px] flex-1 outline-none focus:bg-white px-1 rounded transition-colors truncate"
                          />
                      </div>
                      <button onClick={() => {
                        if (window.confirm(`Usuń czerpnię ${sys.id}?`)) removeSystem(sys.id);
                      }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </li>
                ))}
              </ul>
            </div>
            {/* OUTTAKE SIDE */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-orange-600 text-sm uppercase tracking-widest border-b-2 border-orange-100 pb-2">
                <div className="w-2 h-4 bg-orange-600 rounded-sm"></div>
                Wyrzutnie (E)
              </h3>
              <ul className="space-y-2">
                {systems.filter(s => s.type === 'OUTTAKE').map(sys => (
                   <li key={sys.id} className="group flex items-center gap-3 bg-gray-50/50 hover:bg-white p-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input 
                            type="text"
                            value={sys.id}
                            onChange={(e) => updateSystem(sys.id, { id: e.target.value.toUpperCase() })}
                            className="bg-transparent font-black text-gray-800 text-sm w-16 outline-none focus:bg-white px-1 rounded transition-colors"
                          />
                          <input 
                            type="text"
                            value={sys.name}
                            onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
                            className="bg-transparent text-gray-400 italic text-[11px] flex-1 outline-none focus:bg-white px-1 rounded transition-colors truncate"
                          />
                      </div>
                      <button onClick={() => {
                        if (window.confirm(`Usuń wyrzutnię ${sys.id}?`)) removeSystem(sys.id);
                      }} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t bg-gray-50/30">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Schematy Kolorystyczne</h3>
             <div className="flex gap-2">
                <select 
                   className="border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-indigo-500"
                   onChange={(e) => {
                      const preset = stylePresets.find(p => p.id === e.target.value);
                      if (preset) {
                         preset.systemStyles.forEach(style => {
                            updateSystem(style.systemId, { 
                               color: style.color, 
                               patternId: style.patternId,
                               isColorPriority: style.isColorPriority,
                               isPatternPriority: style.isPatternPriority
                            });
                         });
                      }
                   }}
                >
                   <option value="">Wczytaj schemat...</option>
                   {stylePresets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                </select>
                <div className="flex gap-1">
                   <input 
                      id="new-preset-name"
                      type="text" 
                      placeholder="Nazwa schematu" 
                      className="border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-indigo-500"
                   />
                   <button 
                      onClick={() => {
                         const nameInput = document.getElementById('new-preset-name') as HTMLInputElement;
                         const name = nameInput.value.trim();
                         if (!name) return;
                         const systemStyles = systems.map(s => ({
                            systemId: s.id,
                            color: s.color || '#ffffff',
                            patternId: s.patternId,
                            isColorPriority: s.isColorPriority || false,
                            isPatternPriority: s.isPatternPriority || false,
                            opacity: s.opacity
                         }));
                         saveStylePreset({
                            id: crypto.randomUUID(),
                            name,
                            systemStyles
                         });
                         nameInput.value = '';
                      }}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 transition-colors"
                   >
                      Zapisz aktualny
                   </button>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                 <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-black text-gray-700 text-sm uppercase tracking-wider">Dodaj nowy system</h3>
           </div>
           
           <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID (np. NW3)</label>
                 <input type="text" placeholder="ID" value={newId} onChange={e => setNewId(e.target.value.toUpperCase())} className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 shadow-sm text-sm font-black transition-all" />
              </div>
              <div className="flex-[2] space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pełna Nazwa</label>
                 <input type="text" placeholder="Wpisz nazwę..." value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 shadow-sm text-sm transition-all" />
              </div>
              <div className="flex-1 space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Typ</label>
                 <select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 shadow-sm text-sm text-gray-700 font-bold transition-all">
                   <option value="SUPPLY">Nawiew</option>
                   <option value="EXHAUST">Wywiew</option>
                   <option value="INTAKE">Czerpnia</option>
                   <option value="OUTTAKE">Wyrzutnia</option>
                 </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => {
                    if (newId && newName && !systems.some(s => s.id === newId)) {
                        addSystem({ id: newId, name: newName, type: newType });
                        setNewId(''); setNewName('');
                    }
                }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all font-bold active:scale-95">Dodaj</button>
              </div>
           </div>
        </div>

        <SystemWizardModal 
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
        />
      </div>
    </div>
  );
}
