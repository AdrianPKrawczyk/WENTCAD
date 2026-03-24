import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Plus, Trash2, Database, Layers, Thermometer, Info, Save, LayoutGrid, List, Edit2 } from 'lucide-react';
import type { IfcMaterial, IfcWallType } from '../lib/wattTypes';
import { WallTypeModal } from './WallTypeModal';
import { useMemo } from 'react';

const MaterialCard = ({ mat, removeMaterial, updateMaterial, existingCategories }: { 
  mat: IfcMaterial, 
  removeMaterial: (id: string) => void, 
  updateMaterial: (id: string, updates: Partial<IfcMaterial>) => void,
  existingCategories: string[]
}) => (
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
      <div className="flex-1 min-w-0">
         <input 
           className="font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-full text-sm outline-none truncate"
           value={mat.name}
           onChange={(e) => updateMaterial(mat.id, { name: e.target.value })}
         />
         <div className="relative mt-0.5 text-[9px] font-bold text-gray-400 group-hover:text-orange-400 transition-colors uppercase">
            <select 
              className="bg-transparent border-none p-0 focus:ring-0 text-[10px] cursor-pointer appearance-none outline-none"
              value={mat.category}
              onChange={(e) => updateMaterial(mat.id, { category: e.target.value })}
            >
              {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
      </div>
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
);

export function WATTManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const materials = useZoneStore((state) => state.materials);
  const wallTypes = useZoneStore((state) => state.wallTypes);
  const wallTypeTemplates = useZoneStore((state) => state.wallTypeTemplates);

  const addMaterial = useZoneStore((state) => state.addMaterial);
  const updateMaterial = useZoneStore((state) => state.updateMaterial);
  const removeMaterial = useZoneStore((state) => state.removeMaterial);

  const addWallType = useZoneStore((state) => state.addWallType);
  const removeWallType = useZoneStore((state) => state.removeWallType);
  const removeWallTypeTemplate = useZoneStore((state) => state.removeWallTypeTemplate);

  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'WALL_TYPES'>('MATERIALS');
  const [materialViewMode, setMaterialViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedCategory, setSelectedCategory] = useState('WSZYSTKO');
  const [isWallTypeModalOpen, setIsWallTypeModalOpen] = useState(false);
  const [editingWallType, setEditingWallType] = useState<IfcWallType | null>(null);


  // Material Form State
  const [mName, setMName] = useState('');
  const [mCategory, setMCategory] = useState('Mury i Konstrukcja');
  const [mLambda, setMLambda] = useState(0.04);
  const [mDensity, setMDensity] = useState(20);
  const [mCp, setMCp] = useState(1460);

  const existingCategories = useMemo(() => {
    const cats = new Set(Object.values(materials).map(m => m.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [materials]);

  const categoryTabLabels: Record<string, string> = {
    'WSZYSTKO': 'Wszystko',
    'CONSTRUCTION': 'Mury i Konstrukcja',
    'INSULATION': 'Izolacje',
    'FINISH': 'Wykończenie',
    'WOOD': 'Drewno',
    'OTHER': 'Inne',
    'KAMIEN': 'Kamień',
    'METAL': 'Metal'
  };

  const getCategoryLabel = (cat: string) => {
    const upper = cat.toUpperCase();
    return categoryTabLabels[upper] || cat;
  };

  const allCategories = useMemo(() => ['WSZYSTKO', ...existingCategories], [existingCategories]);

  const filteredMaterials = useMemo(() => {
    if (selectedCategory === 'WSZYSTKO') return materials;
    const filtered: Record<string, IfcMaterial> = {};
    Object.entries(materials).forEach(([id, mat]) => {
      if (mat.category === selectedCategory) filtered[id] = mat;
    });
    return filtered;
  }, [materials, selectedCategory]);

  const groupedFilteredMaterials = useMemo(() => {
    const groups: Record<string, IfcMaterial[]> = {};
    Object.values(filteredMaterials).forEach(mat => {
      const cat = mat.category || 'Inne';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mat);
    });
    return groups;
  }, [filteredMaterials]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
          
          {activeTab === 'MATERIALS' && (
            <div className="ml-auto flex items-center gap-2 px-8 invisible">
               {/* Spacer to keep tab alignment if needed, but we'll move the real buttons */}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'MATERIALS' && (
            <div className="space-y-8">
              {/* Category Sub-tabs and View Switcher */}
              <div className="flex items-center gap-4 border-b border-gray-100 mb-6 bg-gray-50/50 p-1.5 rounded-2xl">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
                  {allCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                        selectedCategory === cat 
                          ? 'bg-white text-orange-600 shadow-sm ring-1 ring-gray-100' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-gray-100 shrink-0">
                  <button 
                    onClick={() => setMaterialViewMode('GRID')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${
                      materialViewMode === 'GRID' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Siatka</span>
                  </button>
                  <button 
                    onClick={() => setMaterialViewMode('TABLE')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${
                      materialViewMode === 'TABLE' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabela</span>
                  </button>
                </div>
              </div>

              <div className="space-y-12">
                {materialViewMode === 'GRID' ? (
                  selectedCategory === 'WSZYSTKO' ? (
                    Object.entries(groupedFilteredMaterials).map(([category, mats]) => (
                      <div key={category} className="space-y-4">
                        <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                          <div className="w-8 h-[2px] bg-orange-600/20" />
                          {category}
                          <span className="text-[10px] font-bold text-gray-300 ml-auto bg-gray-50 px-2 py-0.5 rounded-full lowercase tracking-normal">
                            {mats.length} {mats.length === 1 ? 'materiał' : 'materiały'}
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {mats.map(mat => (
                            <MaterialCard key={mat.id} mat={mat} removeMaterial={removeMaterial} updateMaterial={updateMaterial} existingCategories={existingCategories} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.values(filteredMaterials).map(mat => (
                        <MaterialCard key={mat.id} mat={mat} removeMaterial={removeMaterial} updateMaterial={updateMaterial} existingCategories={existingCategories} />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Nazwa</th>
                          <th className="px-6 py-4">Kategoria</th>
                          <th className="px-6 py-4">λ [W/mK]</th>
                          <th className="px-6 py-4">ρ [kg/m³]</th>
                          <th className="px-6 py-4">Cp [J/kgK]</th>
                          <th className="px-6 py-4 text-right">Akcje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Object.values(filteredMaterials).sort((a,b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)).map(mat => (
                          <tr key={mat.id} className="hover:bg-orange-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <input 
                                value={mat.name}
                                onChange={(e) => updateMaterial(mat.id, { name: e.target.value })}
                                className="bg-transparent border-none p-0 focus:ring-0 w-full font-medium text-gray-700 outline-none"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={mat.category}
                                onChange={(e) => updateMaterial(mat.id, { category: e.target.value })}
                                className="bg-transparent border-none p-0 focus:ring-0 text-xs text-gray-500 uppercase font-bold cursor-pointer appearance-none outline-none"
                              >
                                {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">
                              <input 
                                type="number" step="0.001"
                                value={mat.thermalConductivity}
                                onChange={(e) => updateMaterial(mat.id, { thermalConductivity: parseFloat(e.target.value) })}
                                className="bg-transparent border-none p-0 focus:ring-0 w-20 font-bold text-gray-600"
                              />
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              <input 
                                type="number" step="10"
                                value={mat.massDensity}
                                onChange={(e) => updateMaterial(mat.id, { massDensity: parseFloat(e.target.value) })}
                                className="bg-transparent border-none p-0 focus:ring-0 w-16"
                              />
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              <input 
                                type="number" step="10"
                                value={mat.specificHeatCapacity}
                                onChange={(e) => updateMaterial(mat.id, { specificHeatCapacity: parseFloat(e.target.value) })}
                                className="bg-transparent border-none p-0 focus:ring-0 w-16"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => removeMaterial(mat.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  <div className="w-48 space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">Kategoria</label>
                    <div className="relative">
                       <input 
                         type="text" list="existing-cats"
                         value={mCategory} onChange={e => setMCategory(e.target.value)}
                         className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm" 
                       />
                       <datalist id="existing-cats">
                          {existingCategories.map(c => <option key={c} value={c} />)}
                       </datalist>
                    </div>
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">λ [W/mK]</label>
                    <input 
                      type="number" step="0.001"
                      value={mLambda} onChange={e => setMLambda(parseFloat(e.target.value))}
                      className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm font-bold" 
                    />
                  </div>
                   <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">ρ [kg/m³]</label>
                    <input 
                      type="number" step="10"
                      value={mDensity} onChange={e => setMDensity(parseFloat(e.target.value))}
                      className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm" 
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[10px] font-bold text-orange-700 uppercase ml-1">Cp [J/kgK]</label>
                    <input 
                      type="number" step="10"
                      value={mCp} onChange={e => setMCp(parseFloat(e.target.value))}
                      className="w-full border border-orange-200 p-2.5 rounded-xl outline-none focus:border-orange-400 shadow-sm text-sm" 
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (mName) {
                        addMaterial({
                          id: `mat-${Date.now()}`,
                          name: mName,
                          category: mCategory || 'Inne',
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
                         <div className="flex gap-2">
                            <button 
                               onClick={() => {
                                 setEditingWallType(wt);
                                 setIsWallTypeModalOpen(true);
                               }}
                               className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                               title="Edytuj układ warstw"
                            >
                               <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                               onClick={() => removeWallType(wt.id)}
                               className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>

               {/* Wall Type Creator */}
               <div className="mt-8">
                  <button 
                    onClick={() => {
                      setEditingWallType(null);
                      setIsWallTypeModalOpen(true);
                    }}
                    className="w-full py-4 border-2 border-dashed border-orange-200 rounded-2xl text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Stwórz nową przegrodę wielowarstwową
                  </button>
               </div>

               {/* GLOBAL TEMPLATES SECTION */}
               {wallTypeTemplates.length > 0 && (
                 <div className="mt-12 space-y-4">
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                       <Save className="w-4 h-4" /> Twoja Biblioteka Szablonów
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {wallTypeTemplates.map(template => (
                         <div key={template.id} className="flex items-center gap-4 bg-amber-50/30 p-4 rounded-2xl border border-amber-100 relative group">
                            <div className="flex-1">
                               <h4 className="font-bold text-gray-800 text-sm">{template.name}</h4>
                               <p className="text-[10px] text-amber-600 font-medium">Szablon: {template.predefinedType}</p>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => addWallType({ ...template, id: crypto.randomUUID() })}
                                 className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600 transition-colors"
                               >
                                 UŻYJ W PROJEKCIE
                               </button>
                               <button 
                                 onClick={() => removeWallTypeTemplate(template.id)}
                                 className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        <WallTypeModal 
          isOpen={isWallTypeModalOpen}
          editingWallType={editingWallType || undefined}
          onClose={() => {
            setIsWallTypeModalOpen(false);
            setEditingWallType(null);
          }}
        />
      </div>
    </div>
  );
}
