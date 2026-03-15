import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';

export function SystemManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const systems = useZoneStore((state) => state.systems);
  const addSystem = useZoneStore((state) => state.addSystem);
  const removeSystem = useZoneStore((state) => state.removeSystem);
  
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'SUPPLY'|'EXHAUST'>('SUPPLY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Menadżer Systemów</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">✕</button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
             <h3 className="font-bold text-blue-600 mb-2 border-b-2 border-blue-200 pb-1">Systemy Nawiewne (N)</h3>
             <ul className="space-y-2">
                {systems.filter(s => s.type === 'SUPPLY').map(sys => (
                   <li key={sys.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm shadow-sm">
                      <span><strong className="text-gray-800">{sys.id}</strong> <span className="text-gray-500">— {sys.name}</span></span>
                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć system ${sys.id}? Zostanie on odpięty od przypisanych pomieszczeń.`)) {
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
             <h3 className="font-bold text-red-600 mb-2 border-b-2 border-red-200 pb-1">Systemy Wywiewne (W)</h3>
             <ul className="space-y-2">
                {systems.filter(s => s.type === 'EXHAUST').map(sys => (
                   <li key={sys.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm shadow-sm">
                      <span><strong className="text-gray-800">{sys.id}</strong> <span className="text-gray-500">— {sys.name}</span></span>
                      <button onClick={() => {
                        if (window.confirm(`Czy na pewno usunąć system ${sys.id}? Zostanie on odpięty od przypisanych pomieszczeń.`)) {
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

        <div className="mt-8 border-t pt-4 bg-gray-50 -mx-6 px-6 pb-2 rounded-b-lg">
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
