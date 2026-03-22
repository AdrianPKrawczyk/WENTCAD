import { useState } from 'react';
import { X, Check, Layers, Ruler, Box, Type } from 'lucide-react';

export interface SyncSettings {
  zoneLayer: string;
  footprintLayer?: string;
  windowLayers: string[];
  multiplier: number;
  unitLabel: string;
}

interface SyncSettingsModalProps {
  isOpen: boolean;
  fileName: string;
  availableLayers: string[];
  onConfirm: (settings: SyncSettings) => void;
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
  const [footprintLayer, setFootprintLayer] = useState('');
  const [windowLayers, setWindowLayers] = useState<string[]>([]);
  const [unit, setUnit] = useState(DXF_UNITS[0]);

  if (!isOpen) return null;

  const toggleWindowLayer = (layer: string) => {
    setWindowLayers(prev => 
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ustawienia Importu WATT & Stref</h3>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">{fileName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 transition-colors rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Core Settings: Unit and Zone Layer */}
          <div className="grid grid-cols-2 gap-6">
            {/* Unit Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                <Ruler className="w-3 h-3" /> 1. Jednostki Pliku CAD
              </label>
              <div className="grid grid-cols-1 gap-2">
                {DXF_UNITS.map((u) => (
                  <button
                    key={u.label}
                    onClick={() => setUnit(u)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
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

            {/* Required: Zones */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-rose-500 flex items-center gap-2">
                <Box className="w-3 h-3" /> 2. Warstwa Stref (Wymagane)
              </label>
              <select
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(e.target.value)}
                className="w-full p-2.5 bg-rose-50/30 border border-rose-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              >
                <option value="" disabled>Wybierz warstwę stref...</option>
                {availableLayers.map(layer => (
                  <option key={layer} value={layer}>{layer}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                Wybierz warstwę, na której znajdują się obrysy pomieszczeń (LWPOLYLINE).
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Optional WATT Topology Data */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Moduł WATT (Analiza Termiczna i Architektura) <span className="text-xs font-normal text-slate-400 ml-2">Opcjonalnie</span></h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Footprint Layer */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Obrys Budynku (Footprint)
                </label>
                <select
                  value={footprintLayer}
                  onChange={(e) => setFootprintLayer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="">Brak (Omiń)</option>
                  {availableLayers.filter(l => l !== selectedLayer).map(layer => (
                    <option key={`foot-${layer}`} value={layer}>{layer}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  Polilinia wyznaczająca granicę ścian zewnętrznych. Służy do wykrywania ścian zewnętrznych.
                </p>
              </div>

              {/* Windows Layers */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2">
                  <Type className="w-3 h-3" /> Warstwy Okien (Windows)
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                  {availableLayers.filter(l => l !== selectedLayer && l !== footprintLayer).map(layer => {
                     // Auto-detect window metadata
                     const hasMeta = layer.match(/_H\d+/i);
                     return (
                        <label key={`win-${layer}`} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer group">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            windowLayers.includes(layer) 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'border-slate-300 bg-white group-hover:border-indigo-400'
                          }`}>
                            {windowLayers.includes(layer) && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-sm text-slate-700 font-medium truncate flex-1">{layer}</span>
                          {hasMeta && <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shrink-0">WATT META</span>}
                        </label>
                     );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  Zaznacz wszystkie warstwy zawierające prostokąty okien. Jeśli nazwa zawiera "H", system spróbuje odczytać wysokość.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={() => onConfirm({
              zoneLayer: selectedLayer,
              footprintLayer: footprintLayer || undefined,
              windowLayers: windowLayers,
              multiplier: unit.multiplier,
              unitLabel: unit.label
            })}
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
