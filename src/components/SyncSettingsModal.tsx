import { useState } from 'react';
import { X, Check, Layers, Ruler } from 'lucide-react';

interface SyncSettingsModalProps {
  isOpen: boolean;
  fileName: string;
  availableLayers: string[];
  onConfirm: (selectedLayer: string, multiplier: number, unitLabel: string) => void;
  onCancel: () => void;
}

const DXF_UNITS = [
  { label: 'Milimetry (mm)', multiplier: 0.001, default: true },
  { label: 'Centymetry (cm)', multiplier: 0.01, default: false },
  { label: 'Metry (m)', multiplier: 1.0, default: false },
  { label: 'Cale (inch)', multiplier: 0.0254, default: false },
];

export function SyncSettingsModal({ isOpen, fileName, availableLayers, onConfirm, onCancel }: SyncSettingsModalProps) {
  const [selectedLayer, setSelectedLayer] = useState(availableLayers[0] || '');
  const [unit, setUnit] = useState(DXF_UNITS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ustawienia Synchronizacji</h3>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{fileName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 transition-colors rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Layer Selection */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Warstwa ze Strefami
            </label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            >
              <option value="" disabled>Wybierz warstwę...</option>
              {availableLayers.map(layer => (
                <option key={layer} value={layer}>{layer}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Wybierz warstwę, na której znajdują się zamknięte obrysy pomieszczeń (LWPOLYLINE).
            </p>
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
              <Ruler className="w-3 h-3" /> Jednostki Pliku CAD
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DXF_UNITS.map((u) => (
                <button
                  key={u.label}
                  onClick={() => setUnit(u)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    unit.label === u.label 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{u.label}</span>
                  {unit.label === u.label && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={() => onConfirm(selectedLayer, unit.multiplier, unit.label)}
            disabled={!selectedLayer}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            Przejdź do kalibracji
          </button>
        </div>
      </div>
    </div>
  );
}
