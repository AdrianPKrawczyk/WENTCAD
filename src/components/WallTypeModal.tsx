import { useState, useMemo } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Plus, Trash2, Layers, ChevronUp, ChevronDown, Save } from 'lucide-react';
import type { IfcMaterialLayer, IfcMaterialLayerSet, IfcWallType } from '../lib/wattTypes';
import { calculateUValue } from '../lib/thermalUtils';

interface WallTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWallType?: IfcWallType;
}

export function WallTypeModal({ isOpen, onClose, editingWallType }: WallTypeModalProps) {
  const materials = useZoneStore((state) => state.materials);
  const addWallType = useZoneStore((state) => state.addWallType);
  const addLayerSet = useZoneStore((state) => state.addLayerSet);
  
  const [name, setName] = useState(editingWallType?.name || '');
  const [isExternal, setIsExternal] = useState(editingWallType?.isExternal ?? true);
  const [type, setType] = useState<IfcWallType['predefinedType']>(editingWallType?.predefinedType || 'STANDARD');
  
  const [layers, setLayers] = useState<IfcMaterialLayer[]>([]);

  const uValue = useMemo(() => calculateUValue(layers, materials, isExternal), [layers, materials, isExternal]);

  if (!isOpen) return null;

  const handleAddLayer = () => {
    const firstMatId = Object.keys(materials)[0];
    if (!firstMatId) return;
    
    setLayers([...layers, {
      id: crypto.randomUUID(),
      materialId: firstMatId,
      thickness: 0.24
    }]);
  };

  const updateLayer = (id: string, updates: Partial<IfcMaterialLayer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
  };

  const handleSave = () => {
    if (!name) {
       alert("Podaj nazwę przegrody.");
       return;
    }
    if (layers.length === 0) {
       alert("Przegroda musi mieć przynajmniej jedną warstwę.");
       return;
    }

    const layerSetId = crypto.randomUUID();
    const layerSet: IfcMaterialLayerSet = {
      id: layerSetId,
      name: `LS for ${name}`,
      layers: layers
    };

    const wallType: IfcWallType = {
      id: crypto.randomUUID(),
      name: name,
      layerSetId: layerSetId,
      predefinedType: type,
      isExternal: isExternal
    };

    addLayerSet(layerSet);
    addWallType(wallType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Kreator Typu Przegrody</h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Definiowanie układu warstw</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* General Wall Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nazwa Przegrody</label>
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="np. Ściana zewnętrzna 24+15"
                className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rodzaj</label>
              <select 
                value={type} onChange={e => setType(e.target.value as any)}
                className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 text-sm"
              >
                <option value="STANDARD">Standardowa</option>
                <option value="SOLIDWALL">Pełna (Konstrukcyjna)</option>
                <option value="PARTITIONING">Działowa</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
             <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" checked={isExternal} onChange={e => setIsExternal(e.target.checked)}
                     className="w-4 h-4 text-indigo-600 rounded-sm border-gray-300"
                   />
                   <span className="text-xs font-bold text-indigo-900 uppercase">Przegroda Zewnętrzna</span>
                </label>
                <p className="text-[9px] text-indigo-400 mt-0.5">Wpływa na współczynnik przejmowania ciepła Rse</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-indigo-400 uppercase font-bold">Wyliczone U</p>
                <p className="text-2xl font-black text-indigo-700">{uValue.toFixed(3)} <span className="text-[10px] font-normal">W/m²K</span></p>
             </div>
          </div>

          {/* Layer Editor */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
              Struktura Warstw (od wewnątrz)
              <button 
                onClick={handleAddLayer}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 normal-case"
              >
                <Plus className="w-3 h-3" /> Dodaj warstwę
              </button>
            </h4>

            {layers.length === 0 ? (
              <div className="py-10 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-300 text-xs italic">
                Brak warstw. Dodaj pierwszą warstwę, aby rozpocząć.
              </div>
            ) : (
              <div className="space-y-2">
                {layers.map((layer, idx) => (
                  <div key={layer.id} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all">
                    <div className="w-6 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {idx + 1}
                    </div>
                    <select 
                      value={layer.materialId} onChange={e => updateLayer(layer.id, { materialId: e.target.value })}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium"
                    >
                      {Object.values(materials).map(mat => (
                        <option key={mat.id} value={mat.id}>{mat.name} (λ={mat.thermalConductivity})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" step="0.01" value={layer.thickness} 
                        onChange={e => updateLayer(layer.id, { thickness: parseFloat(e.target.value) })}
                        className="w-16 bg-white border border-gray-200 rounded p-1 text-right text-sm font-bold focus:border-indigo-400 outline-none"
                      />
                      <span className="text-[10px] text-gray-400 font-bold uppercase">m</span>
                    </div>
                    <button onClick={() => removeLayer(layer.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600">Anuluj</button>
           <button 
             onClick={handleSave}
             className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
           >
             <Save className="w-4 h-4" /> Zapisz Typ Przegrody
           </button>
        </div>
      </div>
    </div>
  );
}
