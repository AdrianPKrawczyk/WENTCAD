import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';

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
  const [newType, setNewType] = useState<'SUPPLY'|'EXHAUST'>('SUPPLY');

  const patterns = [
    { id: '', name: 'Brak' },
    { id: 'hvac-pattern-diagonal', name: 'Ukośne' },
    { id: 'hvac-pattern-dots', name: 'Kropki' },
    { id: 'hvac-pattern-crosshatch', name: 'Kratka' },
    { id: 'hvac-pattern-vertical', name: 'Pionowe' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Menadżer Systemów i Stylizacji</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => generateAutoColors()}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              🎨 Automatyczne kolory
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold ml-2">✕</button>
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
        
        <div className="grid grid-cols-2 gap-6">
          <div>
             <h3 className="font-bold text-blue-600 mb-2 border-b-2 border-blue-200 pb-1">Systemy Nawiewne (N)</h3>
              <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {systems.filter(s => s.type === 'SUPPLY').map(sys => (
                   <li key={sys.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-2 items-center bg-gray-50 px-2 py-1.5 rounded border border-gray-200 text-[11px] shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                         <div className="w-3.5 h-3.5 rounded border border-gray-300 shrink-0" style={{ backgroundColor: sys.color || 'transparent' }}></div>
                         <span className="truncate" title={`${sys.id} — ${sys.name}`}><strong>{sys.id}</strong> <span className="text-gray-400 italic font-normal">{sys.name}</span></span>
                      </div>

                      <input 
                        type="color" 
                        value={sys.color || '#ffffff'} 
                        onChange={(e) => updateSystem(sys.id, { color: e.target.value })}
                        className="w-5 h-5 border-0 p-0 cursor-pointer bg-transparent rounded overflow-hidden"
                        title="Zmień kolor"
                      />

                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={sys.opacity ?? ''} 
                        onChange={(e) => updateSystem(sys.id, { opacity: e.target.value === '' ? undefined : Number(e.target.value) })}
                        className="w-8 border border-gray-300 rounded p-0.5 text-[9px] text-center"
                        placeholder="GLB"
                        title="Indywidualna przezroczystość (%)"
                      />

                      <select 
                        value={sys.patternId || ''} 
                        onChange={(e) => updateSystem(sys.id, { patternId: e.target.value })}
                        className="border border-gray-300 rounded p-0.5 text-[9px] w-14 bg-white"
                        title="Deseń"
                      >
                        {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      <label className="flex items-center gap-0.5 cursor-pointer" title="Priorytet Koloru">
                        <input type="checkbox" checked={sys.isColorPriority || false} onChange={e => updateSystem(sys.id, { isColorPriority: e.target.checked })} className="w-3 h-3" />
                        <span className="font-bold text-gray-500">P</span>
                      </label>

                      <label className="flex items-center gap-0.5 cursor-pointer" title="Priorytet Wzoru">
                        <input type="checkbox" checked={sys.isPatternPriority || false} onChange={e => updateSystem(sys.id, { isPatternPriority: e.target.checked })} className="w-3 h-3" />
                        <span className="font-bold text-gray-500">W</span>
                      </label>

                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć system ${sys.id}? Zostanie on odpięty od przypisanych pomieszczeń.`)) {
                          removeSystem(sys.id);
                        }
                      }} className="text-red-400 hover:text-red-600 transition-colors p-0.5">
                        🗑️
                      </button>
                   </li>
                ))}
             </ul>
          </div>
          <div>
             <h3 className="font-bold text-red-600 mb-2 border-b-2 border-red-200 pb-1">Systemy Wywiewne (W)</h3>
              <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {systems.filter(s => s.type === 'EXHAUST').map(sys => (
                   <li key={sys.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-2 items-center bg-gray-50 px-2 py-1.5 rounded border border-gray-200 text-[11px] shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                         <div className="w-3.5 h-3.5 rounded border border-gray-300 shrink-0" style={{ backgroundColor: sys.color || 'transparent' }}></div>
                         <span className="truncate" title={`${sys.id} — ${sys.name}`}><strong>{sys.id}</strong> <span className="text-gray-400 italic font-normal">{sys.name}</span></span>
                      </div>

                      <input 
                        type="color" 
                        value={sys.color || '#ffffff'} 
                        onChange={(e) => updateSystem(sys.id, { color: e.target.value })}
                        className="w-5 h-5 border-0 p-0 cursor-pointer bg-transparent rounded overflow-hidden"
                      />

                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={sys.opacity ?? ''} 
                        onChange={(e) => updateSystem(sys.id, { opacity: e.target.value === '' ? undefined : Number(e.target.value) })}
                        className="w-8 border border-gray-300 rounded p-0.5 text-[9px] text-center"
                        placeholder="GLB"
                        title="Indywidualna przezroczystość (%)"
                      />

                      <select 
                        value={sys.patternId || ''} 
                        onChange={(e) => updateSystem(sys.id, { patternId: e.target.value })}
                        className="border border-gray-300 rounded p-0.5 text-[9px] w-14 bg-white"
                      >
                        {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      <label className="flex items-center gap-0.5 cursor-pointer">
                        <input type="checkbox" checked={sys.isColorPriority || false} onChange={e => updateSystem(sys.id, { isColorPriority: e.target.checked })} className="w-3 h-3" />
                        <span className="font-bold text-gray-500">P</span>
                      </label>

                      <label className="flex items-center gap-0.5 cursor-pointer">
                        <input type="checkbox" checked={sys.isPatternPriority || false} onChange={e => updateSystem(sys.id, { isPatternPriority: e.target.checked })} className="w-3 h-3" />
                        <span className="font-bold text-gray-500">W</span>
                      </label>

                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć system ${sys.id}? Zostanie on odpięty od przypisanych pomieszczeń.`)) {
                          removeSystem(sys.id);
                        }
                      }} className="text-red-400 hover:text-red-600 transition-colors p-0.5">
                        🗑️
                      </button>
                   </li>
                ))}
             </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
             <h3 className="font-bold text-teal-600 mb-2 border-b-2 border-teal-200 pb-1">Czerpnie (C)</h3>
             <ul className="space-y-2">
                {systems.filter(s => s.type === 'INTAKE').map(sys => (
                   <li key={sys.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm shadow-sm">
                      <span><strong className="text-gray-800">{sys.id}</strong> <span className="text-gray-500">— {sys.name}</span></span>
                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć czerpnię ${sys.id}?`)) {
                          removeSystem(sys.id);
                        }
                      }} className="text-red-500 hover:text-red-700 p-1 bg-white border border-red-100 rounded">
                        🗑️
                      </button>
                   </li>
                ))}
             </ul>
          </div>
          <div>
             <h3 className="font-bold text-orange-600 mb-2 border-b-2 border-orange-200 pb-1">Wyrzutnie (E)</h3>
             <ul className="space-y-2">
                {systems.filter(s => s.type === 'OUTTAKE').map(sys => (
                   <li key={sys.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm shadow-sm">
                      <span><strong className="text-gray-800">{sys.id}</strong> <span className="text-gray-500">— {sys.name}</span></span>
                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć wyrzutnię ${sys.id}?`)) {
                          removeSystem(sys.id);
                        }
                      }} className="text-red-500 hover:text-red-700 p-1 bg-white border border-red-100 rounded">
                        🗑️
                      </button>
                   </li>
                ))}
             </ul>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
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

        <div className="mt-4 border-t pt-4 bg-gray-50 -mx-6 px-6 pb-2 rounded-b-lg">
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Dodaj nowy system</h3>
          <div className="flex gap-2">
             <input type="text" placeholder="ID (np. NW3)" value={newId} onChange={e => setNewId(e.target.value.toUpperCase())} className="border border-gray-300 p-2 rounded flex-1 focus:outline-none focus:border-indigo-500 shadow-sm text-sm font-mono" />
             <input type="text" placeholder="Pełna Nazwa (np. Nawiew Centrala 3)" value={newName} onChange={e => setNewName(e.target.value)} className="border border-gray-300 p-2 rounded flex-2 w-full focus:outline-none focus:border-indigo-500 shadow-sm text-sm" />
             <select value={newType} onChange={e => setNewType(e.target.value as any)} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-indigo-500 shadow-sm text-sm text-gray-700">
               <option value="SUPPLY">Nawiew</option>
               <option value="EXHAUST">Wywiew</option>
               <option value="INTAKE">Czerpnia</option>
               <option value="OUTTAKE">Wyrzutnia</option>
             </select>
             <button onClick={() => {
                if (newId && newName && !systems.some(s => s.id === newId)) {
                   addSystem({ id: newId, name: newName, type: newType });
                   setNewId(''); setNewName('');
                } else if (systems.some(s => s.id === newId)) {
                   alert('System o takim ID już istnieje!');
                }
             }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors font-medium">Dodaj</button>
          </div>
        </div>
      </div>
    </div>
  );
}
