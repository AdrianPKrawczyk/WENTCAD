import { useState, useEffect } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Save, Square, LogIn } from 'lucide-react';
import type { IfcWindowStyle } from '../lib/wattTypes';

interface OpeningStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStyle?: IfcWindowStyle;
  defaultType?: 'WINDOW' | 'DOOR';
}

export function OpeningStyleModal({ isOpen, onClose, editingStyle, defaultType = 'WINDOW' }: OpeningStyleModalProps) {
  const addWindowStyle = useZoneStore((state) => state.addWindowStyle);
  const updateWindowStyle = useZoneStore((state) => state.updateWindowStyle);
  
  const [name, setName] = useState('');
  const [uValue, setUValue] = useState(1.1);
  const [gValue, setGValue] = useState(0.5);
  const [type, setType] = useState<'WINDOW' | 'DOOR'>(defaultType);

  useEffect(() => {
    if (isOpen) {
      if (editingStyle) {
        setName(editingStyle.name);
        setUValue(editingStyle.overallUValue);
        setGValue(editingStyle.solarHeatGainCoefficient);
        setType(editingStyle.type || 'WINDOW');
      } else {
        setName('');
        setUValue(1.1);
        setGValue(0.5);
        setType(defaultType);
      }
    }
  }, [isOpen, editingStyle, defaultType]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name) {
      alert("Podaj nazwę stylu.");
      return;
    }

    if (editingStyle) {
      updateWindowStyle(editingStyle.id, {
        name,
        overallUValue: uValue,
        solarHeatGainCoefficient: gValue,
        type
      });
    } else {
      addWindowStyle({
        id: `ws-${Date.now()}`,
        name,
        overallUValue: uValue,
        solarHeatGainCoefficient: gValue,
        type
      });
    }
    
    onClose();
  };

  const Icon = type === 'WINDOW' ? Square : LogIn;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white ${type === 'WINDOW' ? 'bg-sky-600' : 'bg-emerald-600'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{editingStyle ? 'Edytuj Styl' : 'Nowy Styl'} {type === 'WINDOW' ? 'Okna' : 'Drzwi'}</h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Parametry techniczne otworu</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nazwa Stylu</label>
            <input 
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder={type === 'WINDOW' ? "np. Okno 3-szybowe" : "np. Drzwi wejściowe ocieplane"}
              className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-sky-400 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">U-Value [W/m²K]</label>
              <input 
                type="number" step="0.1" value={uValue} onChange={e => setUValue(parseFloat(e.target.value))}
                className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-sky-400 text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">g-Value (SHGC)</label>
              <input 
                type="number" step="0.05" min="0" max="1" value={gValue} onChange={e => setGValue(parseFloat(e.target.value))}
                className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-sky-400 text-sm font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Typ</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
               <button 
                 onClick={() => setType('WINDOW')}
                 className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${type === 'WINDOW' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Okno
               </button>
               <button 
                 onClick={() => setType('DOOR')}
                 className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${type === 'DOOR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Drzwi
               </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600">Anuluj</button>
           <button 
             onClick={handleSave}
             className={`flex-[2] py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-2 ${type === 'WINDOW' ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
           >
             <Save className="w-4 h-4" /> Zapisz Styl
           </button>
        </div>
      </div>
    </div>
  );
}
