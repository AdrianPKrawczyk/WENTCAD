import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Plus, Trash2, Database, Layers, Thermometer, Info } from 'lucide-react';
import type { IfcMaterial, IfcMaterialLayerSet, IfcWallType } from '../lib/wattTypes';
import { WallTypeModal } from './WallTypeModal';

export function WATTManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const materials = useZoneStore((state) => state.materials);
  const layerSets = useZoneStore((state) => state.layerSets);
  const wallTypes = useZoneStore((state) => state.wallTypes);
  
  const addMaterial = useZoneStore((state) => state.addMaterial);
  const updateMaterial = useZoneStore((state) => state.updateMaterial);
  const removeMaterial = useZoneStore((state) => state.removeMaterial);
  
  const addWallType = useZoneStore((state) => state.addWallType);
  const removeWallType = useZoneStore((state) => state.removeWallType);

  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'WALL_TYPES'>('MATERIALS');
  const [isWallTypeModalOpen, setIsWallTypeModalOpen] = useState(false);

  // Material Form State
  const [mName, setMName] = useState('');
  const [mLambda, setMLambda] = useState(0.04);
  const [mDensity, setMDensity] = useState(20);
  const [mCp, setMCp] = useState(1460);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-orange-600 p-2 rounded-xl text-white">
                <Database className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Katalog Przegród i Materiałów (WATT)</h2>
                <p className="text-gray-400 text-xs font-medium">Zarządzanie parametrami termicznymi komponentów budowlanych</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={() => setActiveTab('MATERIALS')}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'MATERIALS' ? 'text-orange-600 border-orange-600 bg-white' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Biblioteka Materiałów
          </button>
          <button
            onClick={() => setActiveTab('WALL_TYPES')}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'WALL_TYPES' ? 'text-orange-600 border-orange-600 bg-white' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Typy Przegród
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'MATERIALS' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(materials).map(mat => (
                  <div key={mat.id} className="group p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all relative">
                    <button 
                      onClick={() => removeMaterial(mat.id)}
                      className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <input 
                        className="font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-full"
                        value={mat.name}
                        onChange={(e) => updateMaterial(mat.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                        <span>Lambda (λ)</span>
                        <span className="text-gray-800">{mat.thermalConductivity} W/mK</span>
                      </div>
                      <input 
                        type="range" min="0.01" max="3.0" step="0.005"
                        value={mat.thermalConductivity}
                        onChange={(e) => updateMaterial(mat.id, { thermalConductivity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Material Footer */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-600 p-1.5 rounded-lg text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-orange-900 text-sm">Dodaj nowy materiał</h3>
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">Nazwa Materiału</label>
                    <input 
                      type="text" placeholder="np. Drewno sosnowe" 
                      value={mName} onChange={e => setMName(e.target.value)}
                      className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm" 
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">λ [W/mK]</label>
                    <input 
                      type="number" step="0.001"
                      value={mLambda} onChange={e => setMLambda(parseFloat(e.target.value))}
                      className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm font-bold" 
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (mName) {
                        addMaterial({
                          id: `mat-${Date.now()}`,
                          name: mName,
                          thermalConductivity: mLambda,
                          massDensity: mDensity,
                          specificHeatCapacity: mCp
                        });
                        setMName('');
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-orange-200 transition-all font-bold active:scale-95 shrink-0"
                  >
                    Dodaj do bazy
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WALL_TYPES' && (
            <div className="space-y-6">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-xs flex gap-3 items-center">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>Typy przegród pozwalają na definiowanie wielowarstwowych struktur (np. ściana 24cm + 15cm styropianu). Współczynnik <b>U</b> jest wyliczany automatycznie.</p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {Object.values(wallTypes).length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                       <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 font-medium">Nie zdefiniowano jeszcze typów ścian.</p>
                    </div>
                  ) : (
                    Object.values(wallTypes).map(wt => (
                      <div key={wt.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center font-black text-gray-400 text-xl">
                            U
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{wt.name}</h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Standard: {wt.predefinedType}</p>
                         </div>
                         <button 
                            onClick={() => removeWallType(wt.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    ))
                  )}
               </div>

               {/* Wall Type Creator */}
               <div className="mt-8">
                  <button 
                    onClick={() => setIsWallTypeModalOpen(true)}
                    className="w-full py-4 border-2 border-dashed border-orange-200 rounded-2xl text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Stwórz nową przegrodę wielowarstwową
                  </button>
               </div>
            </div>
          )}
        </div>

        <WallTypeModal 
          isOpen={isWallTypeModalOpen}
          onClose={() => setIsWallTypeModalOpen(false)}
        />
      </div>
    </div>
  );
}
