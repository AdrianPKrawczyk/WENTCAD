import { useState, useEffect } from 'react';
import { X, Ruler, Layers, Palette } from 'lucide-react';

interface DxfUnitModalProps {
  isOpen: boolean;
  fileName: string;
  availableLayers: string[];
  onConfirm: (multiplier: number, unitLabel: string, selectedLayers: string[], keepColors: boolean) => void;
  onCancel: () => void;
}

export function DxfUnitModal({ isOpen, fileName, availableLayers, onConfirm, onCancel }: DxfUnitModalProps) {
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1.0);
  const [unitLabel, setUnitLabel] = useState<string>('Metry (m)');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [keepColors, setKeepColors] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const savedLayers = localStorage.getItem(`dxf-layers-${fileName}`);
      if (savedLayers) {
        try {
          const parsed = JSON.parse(savedLayers);
          // Filter to only include layers that actually exist in the current file
          setSelectedLayers(parsed.filter((l: string) => availableLayers.includes(l)));
        } catch (e) {
          setSelectedLayers(availableLayers);
        }
      } else {
        setSelectedLayers(availableLayers);
      }
    }
  }, [isOpen, fileName, availableLayers]);

  if (!isOpen) return null;

  const toggleLayer = (layer: string) => {
    setSelectedLayers(prev => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]);
  };

  const handleConfirm = () => {
    localStorage.setItem(`dxf-layers-${fileName}`, JSON.stringify(selectedLayers));
    onConfirm(selectedMultiplier, unitLabel, selectedLayers, keepColors);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Konfiguracja Importu DXF</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Kolumna Lewa - Jednostki i Opcje */}
          <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Ruler className="w-4 h-4"/> Jednostki rysunku</h3>
              <select 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedMultiplier}
                onChange={(e) => {
                  setSelectedMultiplier(parseFloat(e.target.value));
                  setUnitLabel(e.target.options[e.target.selectedIndex].text);
                }}
              >
                <option value={0.001}>Milimetry (mm)</option>
                <option value={0.01}>Centymetry (cm)</option>
                <option value={1.0}>Metry (m)</option>
              </select>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Palette className="w-4 h-4"/> Wygląd</h3>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={keepColors} onChange={(e) => setKeepColors(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5"/>
                <span className="text-sm font-medium text-gray-700">Zachowaj oryginalne kolory z pliku CAD</span>
              </label>
            </div>
          </div>

          {/* Kolumna Prawa - Warstwy */}
          <div className="w-full md:w-1/2 p-6 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Layers className="w-4 h-4"/> Warstwy DXF</h3>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setSelectedLayers(availableLayers)} className="text-indigo-600 hover:underline">Wszystkie</button>
                <button onClick={() => setSelectedLayers([])} className="text-gray-500 hover:underline">Żadne</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
              {availableLayers.map(layer => (
                <label key={layer} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded cursor-pointer">
                  <input type="checkbox" checked={selectedLayers.includes(layer)} onChange={() => toggleLayer(layer)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 truncate">{layer}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors text-sm">Anuluj</button>
          <button onClick={handleConfirm} disabled={selectedLayers.length === 0} className="px-6 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors text-sm disabled:opacity-50">Generuj Podkład</button>
        </div>
      </div>
    </div>
  );
}
