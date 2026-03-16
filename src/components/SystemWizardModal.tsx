import { useState } from 'react';
import { useZoneStore } from '../stores/useZoneStore';
import { X, Wand2, ChevronRight, ChevronLeft, Check, Plus, Minus } from 'lucide-react';
import type { SystemDef } from '../types';

interface WizardData {
  ahuCount: number;
  exhaustFansPerAhu: Record<number, number>;
  ahuNaming: Record<number, { prefix: string; customPrefix?: string; suffix: string }>;
  fanNaming: Record<string, string>; // key: "ahuIdx-fanIdx"
}

const FAMILY_COLORS = [
  '#4e79a7', // Blue
  '#f28e2c', // Orange
  '#76b7b2', // Teal
  '#e15759', // Red
  '#59a14f', // Green
  '#edc949', // Yellow
  '#af7aa1', // Purple
  '#ff9da7', // Pink
  '#9c755f', // Brown
  '#bab0ab'  // Gray
];

const PREFIX_OPTIONS = [
  { value: 'Wentylacja ogólna', label: 'Wentylacja ogólna' },
  { value: 'Wentylacja technologiczna', label: 'Wentylacja technologiczna' },
  { value: 'CUSTOM', label: 'Własny tekst...' },
];

export function SystemWizardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const addSystems = useZoneStore((s) => s.addSystems);

  const [data, setData] = useState<WizardData>({
    ahuCount: 1,
    exhaustFansPerAhu: {},
    ahuNaming: {},
    fanNaming: {},
  });

  if (!isOpen) return null;

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleGenerate = () => {
    const newSystems: SystemDef[] = [];
    
    for (let i = 1; i <= data.ahuCount; i++) {
        const familyColor = FAMILY_COLORS[(i - 1) % FAMILY_COLORS.length];
        const naming = data.ahuNaming[i] || { prefix: 'Wentylacja ogólna', suffix: '' };
        const prefix = naming.prefix === 'CUSTOM' ? (naming.customPrefix || '') : naming.prefix;
        const suffix = naming.suffix ? ` ${naming.suffix}` : '';

        // Supply (N)
        newSystems.push({
            id: `N${i}`,
            name: `${prefix} nawiewna:${suffix}`,
            type: 'SUPPLY',
            color: familyColor,
            isColorPriority: true,
        });

        // Main Exhaust (W)
        newSystems.push({
            id: `W${i}`,
            name: `${prefix} wywiewna:${suffix}`,
            type: 'EXHAUST',
            color: familyColor,
            isColorPriority: true,
        });

        // Exhaust Fans (W.x)
        const fanCount = data.exhaustFansPerAhu[i] || 0;
        for (let j = 1; j <= fanCount; j++) {
            const fanSuffix = data.fanNaming[`${i}-${j}`] || '';
            newSystems.push({
                id: `W${i}.${j}`,
                name: `Wywiew ${fanSuffix}`.trim(),
                type: 'EXHAUST',
                color: familyColor,
                patternId: 'hvac-pattern-diagonal',
                isColorPriority: true,
                isPatternPriority: true,
            });
        }
    }

    addSystems(newSystems);
    onClose();
    // Reset state for next time
    setStep(1);
    setData({
        ahuCount: 1,
        exhaustFansPerAhu: {},
        ahuNaming: {},
        fanNaming: {},
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
                <Wand2 className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-bold tracking-tight">Kreator Systemów</h2>
                <p className="text-indigo-100 text-xs">Automatyczne generowanie central i wentylatorów</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex px-6 py-4 bg-gray-50 border-b border-gray-100 items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center group">
                    <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                        ${step === s ? 'bg-indigo-600 text-white shadow-lg scale-110' : 
                          step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                        {step > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    {s < 5 && (
                        <div className={`w-8 sm:w-16 h-1 mx-2 rounded-full transition-colors duration-300 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">Ile central (N+W) wygenerować?</h3>
                <p className="text-gray-500 text-sm">Kreator utworzy pary systemów NW dla każdej centrali.</p>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={() => setData(prev => ({ ...prev, ahuCount: Math.max(1, prev.ahuCount - 1) }))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <div className="text-6xl font-black text-indigo-600 w-24 text-center select-none">
                  {data.ahuCount}
                </div>
                <button 
                  onClick={() => setData(prev => ({ ...prev, ahuCount: Math.min(10, prev.ahuCount + 1) }))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Wentylatory wyciągowe</h3>
                    <p className="text-gray-500 text-sm">Określ liczbę wentylatorów współpracujących z każdą centralą.</p>
                </div>
                <div className="space-y-4">
                    {Array.from({ length: data.ahuCount }).map((_, i) => {
                        const idx = i + 1;
                        return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group hover:border-indigo-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                        {idx}
                                    </div>
                                    <span className="font-semibold text-gray-700">Centrala {idx} (N{idx}/W{idx})</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400 font-medium">Liczba went:</span>
                                    <div className="flex items-center bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setData(prev => ({
                                                ...prev,
                                                exhaustFansPerAhu: { ...prev.exhaustFansPerAhu, [idx]: Math.max(0, (prev.exhaustFansPerAhu[idx] || 0) - 1) }
                                            }))}
                                            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500"
                                        >
                                            -
                                        </button>
                                        <div className="w-12 text-center font-bold text-gray-800 border-x border-gray-200">
                                            {data.exhaustFansPerAhu[idx] || 0}
                                        </div>
                                        <button 
                                            onClick={() => setData(prev => ({
                                                ...prev,
                                                exhaustFansPerAhu: { ...prev.exhaustFansPerAhu, [idx]: Math.min(5, (prev.exhaustFansPerAhu[idx] || 0) + 1) }
                                            }))}
                                            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Nazewnictwo Central</h3>
                    <p className="text-gray-500 text-sm">Podaj prefiks i sufiks dla każdej pary systemów (N+W).</p>
                </div>
                <div className="space-y-6">
                    {Array.from({ length: data.ahuCount }).map((_, i) => {
                        const idx = i + 1;
                        const naming = data.ahuNaming[idx] || { prefix: 'Wentylacja ogólna', suffix: '' };
                        return (
                            <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                        {idx}
                                    </div>
                                    <h4 className="font-bold text-gray-800">Centrala {idx} (N{idx}, W{idx})</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Prefiks</label>
                                        <select 
                                            value={naming.prefix}
                                            onChange={(e) => setData(prev => ({
                                                ...prev, 
                                                ahuNaming: { ...prev.ahuNaming, [idx]: { ...naming, prefix: e.target.value } }
                                            }))}
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        >
                                            {PREFIX_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sufiks (Lokalizacja)</label>
                                        <input 
                                            type="text" 
                                            placeholder="np. sal wykładowych" 
                                            value={naming.suffix}
                                            onChange={(e) => setData(prev => ({
                                                ...prev, 
                                                ahuNaming: { ...prev.ahuNaming, [idx]: { ...naming, suffix: e.target.value } }
                                            }))}
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                {naming.prefix === 'CUSTOM' && (
                                    <div className="space-y-1 animate-in zoom-in-95 duration-200">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Własny prefiks</label>
                                        <input 
                                            type="text" 
                                            placeholder="Wpisz dowolny tekst..." 
                                            value={naming.customPrefix || ''}
                                            onChange={(e) => setData(prev => ({
                                                ...prev, 
                                                ahuNaming: { ...prev.ahuNaming, [idx]: { ...naming, customPrefix: e.target.value } }
                                            }))}
                                            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                )}
                                <div className="text-[11px] bg-white p-2 border border-gray-100 rounded-lg text-gray-400 italic">
                                    Efekt: <span className="text-gray-600 font-medium">N{idx}: {naming.prefix === 'CUSTOM' ? naming.customPrefix : naming.prefix} nawiewna:{naming.suffix ? ` ${naming.suffix}` : ''}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Nazewnictwo Wentylatorów</h3>
                    <p className="text-gray-500 text-sm">Uzupełnij lokalizację dla wentylatorów wyciągowych (W.x).</p>
                </div>
                <div className="space-y-8">
                    {Array.from({ length: data.ahuCount }).map((_, i) => {
                        const ahuIdx = i + 1;
                        const fans = data.exhaustFansPerAhu[ahuIdx] || 0;
                        if (fans === 0) return null;
                        
                        return (
                            <div key={ahuIdx} className="space-y-4">
                                <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
                                    <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Centrala {ahuIdx}</h4>
                                </div>
                                <div className="grid gap-3">
                                    {Array.from({ length: fans }).map((__, j) => {
                                        const fanIdx = j + 1;
                                        const key = `${ahuIdx}-${fanIdx}`;
                                        return (
                                            <div key={key} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                <div className="shrink-0 w-16 text-[11px] font-black text-gray-500">W{ahuIdx}.{fanIdx}</div>
                                                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-3 overflow-hidden">
                                                    <span className="text-sm text-gray-400 font-medium shrink-0">Wywiew:</span>
                                                    <input 
                                                        type="text" 
                                                        placeholder="np. z toalet"
                                                        value={data.fanNaming[key] || ''}
                                                        onChange={(e) => setData(prev => ({
                                                            ...prev,
                                                            fanNaming: { ...prev.fanNaming, [key]: e.target.value }
                                                        }))}
                                                        className="w-full p-2.5 text-sm outline-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
                <div className="text-center space-y-2 mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Gotowy do generowania?</h3>
                    <p className="text-gray-500 text-sm">Podsumowanie systemów do utworzenia:</p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
                    <div className="px-6 py-4 flex justify-between text-sm font-bold text-gray-500 bg-gray-100">
                        <span>ID SYSTEMU</span>
                        <span>PEŁNA NAZWA</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {Array.from({ length: data.ahuCount }).map((_, i) => {
                            const ahuIdx = i + 1;
                            const naming = data.ahuNaming[ahuIdx] || { prefix: 'Wentylacja ogólna', suffix: '' };
                            const prefix = naming.prefix === 'CUSTOM' ? (naming.customPrefix || '') : naming.prefix;
                            const suffix = naming.suffix ? ` ${naming.suffix}` : '';
                            const fans = data.exhaustFansPerAhu[ahuIdx] || 0;
                            const familyColor = FAMILY_COLORS[(ahuIdx - 1) % FAMILY_COLORS.length];

                            return (
                                <div key={ahuIdx} className="divide-y divide-gray-100 border-b border-gray-200 last:border-b-0">
                                    <div className="px-6 py-3 flex justify-between items-center group hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: familyColor }}></div>
                                            N{ahuIdx}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">{prefix} nawiewna:{suffix}</div>
                                    </div>
                                    <div className="px-6 py-3 flex justify-between items-center group hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: familyColor }}></div>
                                            W{ahuIdx}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">{prefix} wywiewna:{suffix}</div>
                                    </div>
                                    {Array.from({ length: fans }).map((__, j) => {
                                        const fanIdx = j + 1;
                                        const fanKey = `${ahuIdx}-${fanIdx}`;
                                        const fanSuffix = data.fanNaming[fanKey] || '';
                                        return (
                                            <div key={fanKey} className="px-6 py-2.5 flex justify-between items-center pl-10 bg-indigo-50/30 group hover:bg-white transition-colors">
                                                <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-indigo-400">
                                                    <div className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: familyColor }}></div>
                                                    W{ahuIdx}.{fanIdx}
                                                </div>
                                                <div className="text-xs text-gray-500 italic">Wywiew {fanSuffix}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <div className="bg-amber-100 p-1 rounded">
                        <Wand2 className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="text-xs text-amber-800 leading-relaxed">
                        <strong>Logika stylizacji:</strong> Każda centrala otrzyma unikalny kolor. Wentylatory wyciągowe (W.x) otrzymają kolor swojej centrali oraz deseń ( ukośne paski), aby odróżnić je od głównych ciągów.
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t border-gray-200">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" /> Wstecz
          </button>
          
          <button 
            onClick={step === 5 ? handleGenerate : nextStep}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            {step === 5 ? (
                <>Utwórz systemy <Check className="w-5 h-5 ml-1" /></>
            ) : (
                <>Dalej <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
