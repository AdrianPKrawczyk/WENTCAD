import { useState, useEffect } from 'react';
import { X, Download, Image as ImageIcon, FileCode, Layers, Pencil, Trash2, Type, AlignLeft, AlignCenter, Square } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';

interface ExportRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPNG: (regionId: string, includeBackground: boolean) => void;
  onExportDXF: (regionId: string) => void;
  onEditRegion: (region: ExportRegion) => void;
  onDeleteRegion: (regionId: string) => void;
}

export function ExportModal({ isOpen, onClose, onExportPNG, onExportDXF, onEditRegion, onDeleteRegion }: ExportModalProps) {
  const activeFloorId = useZoneStore((s) => s.activeFloorId);
  const floors = useZoneStore((s) => s.floors);
  const dxfExportSettings = useZoneStore((s) => s.dxfExportSettings);
  const setDxfFontHeight = useZoneStore((s) => s.setDxfFontHeight);
  const setDxfLineSpacing = useZoneStore((s) => s.setDxfLineSpacing);
  const setDxfPaddingX = useZoneStore((s) => s.setDxfPaddingX);
  const setDxfPaddingY = useZoneStore((s) => s.setDxfPaddingY);
  
  const activeFloor = activeFloorId ? floors[activeFloorId] : null;
  const regions = (activeFloor?.exportRegions || []) as ExportRegion[];

  const [selectedRegionId, setSelectedRegionId] = useState<string>(regions[0]?.id || '');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [localFontHeight, setLocalFontHeight] = useState(dxfExportSettings?.fontHeight ?? 0.1);
  const [localLineSpacing, setLocalLineSpacing] = useState(dxfExportSettings?.lineSpacing ?? 1.25);
  const [localPaddingX, setLocalPaddingX] = useState(dxfExportSettings?.paddingX ?? 1.0);
  const [localPaddingY, setLocalPaddingY] = useState(dxfExportSettings?.paddingY ?? 0.36);

  useEffect(() => {
    if (isOpen && regions.length > 0) {
      if (!selectedRegionId || !regions.find(r => r.id === selectedRegionId)) {
        setSelectedRegionId(regions[0].id);
      }
    }
  }, [isOpen, regions, selectedRegionId]);

  if (!isOpen) return null;

  const selectedRegion = regions.find(r => r.id === selectedRegionId);

  const handleFontHeightChange = (value: number) => {
    const clamped = Math.max(0.05, Math.min(0.5, value));
    setLocalFontHeight(clamped);
    setDxfFontHeight(clamped);
  };

  const handleLineSpacingChange = (value: number) => {
    const clamped = Math.max(0.25, Math.min(2.0, value));
    setLocalLineSpacing(clamped);
    setDxfLineSpacing(clamped);
  };

  const handlePaddingXChange = (value: number) => {
    const clamped = Math.max(0.2, Math.min(2.0, value));
    setLocalPaddingX(clamped);
    setDxfPaddingX(clamped);
  };

  const handlePaddingYChange = (value: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, value));
    setLocalPaddingY(clamped);
    setDxfPaddingY(clamped);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Eksport Projektu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Region Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              Wybierz Kadr Eksportu
            </label>
            {regions.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium outline-none"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.width.toFixed(0)}x{r.height.toFixed(0)} px)
                    </option>
                  ))}
                </select>
                
                {/* Region Actions */}
                {selectedRegion && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditRegion(selectedRegion)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200"
                    >
                      <Pencil className="w-4 h-4" />
                      Edytuj kadr
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Czy na pewno usunąć kadr "${selectedRegion.name}"?`)) {
                          onDeleteRegion(selectedRegion.id);
                          setSelectedRegionId(regions[0]?.id || '');
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col gap-2">
                <p className="text-xs text-amber-800 font-medium">Brak zdefiniowanych kadrów na tej kondygnacji.</p>
                <p className="text-[10px] text-amber-700">Użyj narzędzia "Kadrowanie" na pasku narzędzi, aby zaznaczyć obszar do eksportu.</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
               <Layers className="w-4 h-4 text-slate-400" />
               Ustawienia Eksportu
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Dołącz podkład (tło)</span>
                <span className="text-[10px] text-slate-500">Wyłącz, aby uzyskać przezroczysty obraz PNG stref.</span>
              </div>
            </label>

            {/* Font Settings */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Type className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700">Ustawienia czcionki metek (DXF)</span>
              </div>
              
              {/* Font Height */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Wysokość czcionki</span>
                  <span className="text-[10px] text-slate-400">({(localFontHeight * localLineSpacing * 100).toFixed(1)} cm wys. wiersza)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.01"
                    value={localFontHeight}
                    onChange={(e) => handleFontHeightChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.05"
                      max="0.5"
                      step="0.01"
                      value={localFontHeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleFontHeightChange(val);
                      }}
                      className="w-14 px-1.5 py-1 text-xs text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-slate-500 w-4">m</span>
                  </div>
                </div>
              </div>

              {/* Line Spacing */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" />
                    Odstęp między wierszami
                  </span>
                  <span className="text-[10px] text-slate-400">×{localLineSpacing.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.05"
                    value={localLineSpacing}
                    onChange={(e) => handleLineSpacingChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.25"
                      max="2.0"
                      step="0.05"
                      value={localLineSpacing}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleLineSpacingChange(val);
                      }}
                      className="w-14 px-1.5 py-1 text-xs text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-slate-500 w-4">×</span>
                  </div>
                </div>
              </div>

              {/* Padding X */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <AlignCenter className="w-3 h-3" />
                    Margines poziomy ramki
                  </span>
                  <span className="text-[10px] text-slate-400">×{localPaddingX.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.05"
                    value={localPaddingX}
                    onChange={(e) => handlePaddingXChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.2"
                      max="2.0"
                      step="0.05"
                      value={localPaddingX}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handlePaddingXChange(val);
                      }}
                      className="w-14 px-1.5 py-1 text-xs text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-slate-500 w-4">×</span>
                  </div>
                </div>
              </div>

              {/* Padding Y */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    Margines pionowy ramki
                  </span>
                  <span className="text-[10px] text-slate-400">×{localPaddingY.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={localPaddingY}
                    onChange={(e) => handlePaddingYChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={localPaddingY}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handlePaddingYChange(val);
                      }}
                      className="w-14 px-1.5 py-1 text-xs text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-slate-500 w-4">×</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                Wszystkie wartości zostaną zapamiętane przy następnym eksporcie.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button
            disabled={!selectedRegionId}
            onClick={() => onExportPNG(selectedRegionId, includeBackground)}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            <ImageIcon className="w-5 h-5" />
            Eksportuj do PNG
          </button>
          
          <button
            disabled={!selectedRegionId}
            onClick={() => onExportDXF(selectedRegionId)}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 disabled:border-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98]"
          >
            <FileCode className="w-5 h-5" />
            Eksportuj do DXF
          </button>
          
          <p className="text-[10px] text-center text-slate-400 mt-1">
             DXF zawiera warstwy: OBRYSY, WYPEŁNIENIA, METKI.
          </p>
        </div>
      </div>
    </div>
  );
}
