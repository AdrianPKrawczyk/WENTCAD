import { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useZoneStore } from '../stores/useZoneStore';
import type { TagFieldConfig, TagFieldType, GlobalTagSettings } from '../types';
import { X, ChevronUp, ChevronDown, Tag as TagIcon, Eye } from 'lucide-react';

interface SmartTagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_LABELS: Record<TagFieldType, string> = {
  ROOM_NR_NAME: 'Nr i Nazwa Pomieszczenia',
  AREA: 'Powierzchnia [m²]',
  VOLUME: 'Kubatura [m³]',
  FLOW_SUPPLY: 'Wydatek Nawiewny [m³/h]',
  FLOW_EXHAUST: 'Wydatek Wywiewny [m³/h]',
  REAL_ACH: 'Krotność Rzeczywista [1/h]',
  ACOUSTICS: 'Limit Hałasu [dB(A)]',
  SUPPLY_SYSTEM_NAME: 'Nazwa Systemu Nawiewnego',
  EXHAUST_SYSTEM_NAME: 'Nazwa Systemu Wyciągowego',
  INTERNAL_TEMP: 'Temperatura Wewnętrzna [°C]',
  OCCUPANTS: 'Liczba Osób',
  HEAT_GAINS: 'Zyski Ciepła [W]',
};

// Mock data for preview
const MOCK_ZONE: any = {
  nr: "1.01",
  name: "Biuro",
  area: 15.5,
  calculatedVolume: 300,
  calculatedExhaust: 0,
  realACH: 1.5,
  maxAllowedDbA: 35,
  roomTemp: 20,
  occupants: 2,
  totalHeatGain: 450
};

export function SmartTagModal({ isOpen, onClose }: SmartTagModalProps) {
  const globalTagSettings = useZoneStore((s) => s.globalTagSettings);
  const updateGlobalTagSettings = useZoneStore((s) => s.updateGlobalTagSettings);

  const { register, control, handleSubmit, watch, reset } = useForm<GlobalTagSettings>({
    defaultValues: globalTagSettings
  });

  const { fields, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const watchedFields = watch('fields');
  const watchedFillColor = watch('fillColor');
  const watchedStrokeColor = watch('strokeColor');
  const watchedFontSize = watch('fontSize');

  const handleSave = (data: GlobalTagSettings) => {
    updateGlobalTagSettings(data);
    onClose();
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    // Swap order values
    const currentOrder = fields[index].order;
    const targetOrder = fields[newIndex].order;
    
    reset((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === index) return { ...f, order: targetOrder };
        if (i === newIndex) return { ...f, order: currentOrder };
        return f;
      }),
    }), { keepDefaultValues: true });
    
    move(index, newIndex);
  };

  const previewColumns = useMemo(() => {
    if (!watchedFields) return { col1: '', col2: '' };
    
    const activeFields = [...watchedFields]
      .filter((f: TagFieldConfig) => f.enabled)
      .sort((a: TagFieldConfig, b: TagFieldConfig) => a.order - b.order);

    const generateColText = (cols: TagFieldConfig[]) => cols.map((f: TagFieldConfig) => {
      let val: string | number = '--';
      switch (f.type) {
        case 'ROOM_NR_NAME': val = `${MOCK_ZONE.nr} ${MOCK_ZONE.name}`; break;
        case 'AREA': val = MOCK_ZONE.area.toFixed(2); break;
        case 'VOLUME': val = MOCK_ZONE.calculatedVolume.toFixed(2); break;
        case 'FLOW_SUPPLY': val = Math.round(MOCK_ZONE.calculatedVolume); break;
        case 'FLOW_EXHAUST': val = Math.round(MOCK_ZONE.calculatedExhaust || 0); break;
        case 'REAL_ACH': val = MOCK_ZONE.realACH.toFixed(1); break;
        case 'ACOUSTICS': val = MOCK_ZONE.maxAllowedDbA; break;
        case 'SUPPLY_SYSTEM_NAME': val = 'N1'; break;
        case 'EXHAUST_SYSTEM_NAME': val = 'W1'; break;
        case 'INTERNAL_TEMP': val = MOCK_ZONE.roomTemp; break;
        case 'OCCUPANTS': val = MOCK_ZONE.occupants; break;
        case 'HEAT_GAINS': val = MOCK_ZONE.totalHeatGain; break;
      }
      return `${f.prefix}${val}${f.suffix}`;
    }).join('\n');

    return {
      col1: generateColText(activeFields.filter(f => f.column === 1)),
      col2: generateColText(activeFields.filter(f => f.column === 2))
    };
  }, [watchedFields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <TagIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kreator Metek (Smart Tag)</h2>
              <p className="text-sm text-slate-500 font-medium">Skonfiguruj parametry wyświetlane na rzucie 2D</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Configuration */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100">
            <form id="tag-settings-form" onSubmit={handleSubmit(handleSave)} className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Pola Danych</h3>
                <div className="space-y-2">
                  {fields.map((field: any, index: number) => (
                    <div 
                      key={field.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        watch(`fields.${index}.enabled`) 
                          ? 'bg-white border-slate-200 shadow-sm' 
                          : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        {...register(`fields.${index}.enabled`)}
                        className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer"
                      />
                      
                      <div className="flex-1 min-w-[150px]">
                        <span className="text-sm font-bold text-slate-700 block truncate">
                          {FIELD_LABELS[field.type as TagFieldType]}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{field.type}</span>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex flex-col">
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 ml-1">Prefiks</label>
                          <input 
                            {...register(`fields.${index}.prefix`)}
                            placeholder="Prefix"
                            className="text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none w-20"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 ml-1">Sufiks</label>
                          <input 
                            {...register(`fields.${index}.suffix`)}
                            placeholder="Suffix"
                            className="text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none w-20"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 ml-1">Kol.</label>
                          <select
                            {...register(`fields.${index}.column`, { valueAsNumber: true })}
                            className="text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none w-14 font-bold"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button 
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual settings */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      {...register('isFixedSize')}
                      id="isFixedSize"
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isFixedSize" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Stały rozmiar metki na ekranie (ignoruj zoom)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">Wielkość Fontu</label>
                    <input 
                      type="number" 
                      {...register('fontSize', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">Odsunięcie kolumny (px)</label>
                    <input 
                      type="number" 
                      {...register('leftColumnWidth', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">Kolor Tła</label>
                    <input 
                      type="color" 
                      {...register('fillColor')}
                      className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 ml-1">Kolor Ramki</label>
                    <input 
                      type="color" 
                      {...register('strokeColor')}
                      className="w-full h-9 p-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="w-80 bg-slate-50 p-6 flex flex-col gap-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Eye className="w-4 h-4" />
              Podgląd na żywo
            </h3>
            
            <div className="flex-1 flex items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-inner relative overflow-hidden pattern-dots">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
              <div 
                className="p-6 rounded-xl border-2 shadow-2xl transition-all duration-300 max-w-full overflow-hidden flex"
                style={{ 
                  backgroundColor: watchedFillColor,
                  borderColor: watchedStrokeColor
                }}
              >
                <div 
                  className="font-sans text-slate-800 whitespace-pre-wrap leading-relaxed border-r border-slate-200 pr-4 mr-4"
                  style={{ 
                    fontSize: `${watchedFontSize * 1.5}px`,
                    minWidth: `${(watch('leftColumnWidth') || 100) * 1.5}px`
                  }}
                >
                  {previewColumns.col1 || <span className="text-slate-300 italic">Kolumna 1</span>}
                </div>
                <div 
                  className="font-sans text-slate-800 whitespace-pre-wrap leading-relaxed"
                  style={{ fontSize: `${watchedFontSize * 1.5}px` }}
                >
                  {previewColumns.col2 || <span className="text-slate-300 italic">Kolumna 2</span>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-[11px] text-indigo-700 leading-relaxed italic">
                Powyższy podgląd reprezentuje wygląd metki dla przykładowego pomieszczenia biurowego na rzucie.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Anuluj
          </button>
          <button 
            type="submit"
            form="tag-settings-form"
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:transform active:scale-95 transition-all"
          >
            Zapisz Ustawienia
          </button>
        </div>
      </div>
    </div>
  );
}
