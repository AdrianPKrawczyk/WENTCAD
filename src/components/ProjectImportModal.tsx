import React, { useState, useRef } from 'react';
import { UploadCloud, FileJson, Layers, CheckCircle2, X } from 'lucide-react';
import { parseProjectFile, type WentcadExportData, type ImportOptions } from '../lib/projectTransfer';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: WentcadExportData, options: ImportOptions) => void;
  currentProjectId?: string; // If null, we only allow NEW_PROJECT mode
}

export function ProjectImportModal({ isOpen, onClose, onImport, currentProjectId }: ProjectImportModalProps) {
  const [fileData, setFileData] = useState<WentcadExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'NEW_PROJECT' | 'MERGE'>('NEW_PROJECT');
  const [selectedFloors, setSelectedFloors] = useState<Set<string>>(new Set());
  const [importSystems, setImportSystems] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const data = await parseProjectFile(file);
      setFileData(data);
      // Pre-select all floors
      if (data.zoneState.floors) {
        setSelectedFloors(new Set(Object.keys(data.zoneState.floors)));
      }
      
      // Auto-switch mode based on context
      if (currentProjectId) {
        setMode('MERGE');
      } else {
        setMode('NEW_PROJECT');
      }
    } catch (err: any) {
      setError(err.message);
      setFileData(null);
    }
  };

  const handleImport = () => {
    if (!fileData) return;
    onImport(fileData, {
      mode,
      floorsToImport: mode === 'MERGE' ? Array.from(selectedFloors) : undefined,
      importSystems: mode === 'MERGE' ? importSystems : true,
    });
    // Reset state
    setFileData(null);
    setMode('NEW_PROJECT');
    onClose();
  };

  const floorsList = fileData ? Object.values(fileData.zoneState.floors || {}) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-indigo-600" />
            Import Projektu WENTCAD
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!fileData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <input
                type="file"
                accept=".wentcad,.json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <div 
                className="w-full max-w-md bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-indigo-500">
                  <FileJson className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Upuść plik .wentcad tutaj</h3>
                <p className="text-sm text-slate-500">lub kliknij, aby wybrać z dysku</p>
              </div>
              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 max-w-md w-full text-center">
                  Błąd: {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informacje o pliku */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start justify-between">
                <div>
                  <h3 className="text-indigo-900 font-bold mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    Plik załadowany pomyślnie
                  </h3>
                  <div className="space-y-1 text-sm text-indigo-700/80 ml-7">
                    <p><strong>Projekt:</strong> {fileData.metadata.name}</p>
                    <p><strong>Z wyeksportowano:</strong> {new Date(fileData.metadata.exportedAt).toLocaleString()}</p>
                    <p><strong>Znaleziono:</strong> {floorsList.length} kondygnacji, {Object.keys(fileData.zoneState.zones || {}).length} pomieszczeń.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFileData(null)}
                  className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  Zmień plik
                </button>
              </div>

              {/* Tryb importu */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Wybierz tryb importu:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`
                    border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3
                    ${mode === 'NEW_PROJECT' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}
                  `}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      className="mt-1"
                      checked={mode === 'NEW_PROJECT'} 
                      onChange={() => setMode('NEW_PROJECT')}
                    />
                    <div>
                      <div className={`font-bold ${mode === 'NEW_PROJECT' ? 'text-indigo-900' : 'text-slate-700'}`}>Odtwórz jako Nowy Projekt</div>
                      <div className="text-xs text-slate-500 mt-1">Stworzy całkowicie niezależną kopię w Twoim środowisku. Idealne do robienia kopii zapasowych lub powielania projektów.</div>
                    </div>
                  </label>

                  {/* Disable merge if not in an active project */}
                  <div className={!currentProjectId ? 'opacity-50 pointer-events-none' : ''}>
                    <label className={`
                      border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3 h-full
                      ${mode === 'MERGE' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:border-slate-300'}
                    `}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        className="mt-1"
                        checked={mode === 'MERGE'} 
                        onChange={() => setMode('MERGE')}
                        disabled={!currentProjectId}
                      />
                      <div>
                        <div className={`font-bold flex items-center gap-2 ${mode === 'MERGE' ? 'text-amber-900' : 'text-slate-700'}`}>
                          Wklej do aktualnego
                          {!currentProjectId && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-normal">Niedostępne</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Połączy wybrane kondygnacje i systemy z pliku z Twoim **obecnie otwartym** projektem. Zapewnia ochronę przed duplikatami ID.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Opcje Scalania */}
              {mode === 'MERGE' && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200/50 animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600" />
                    Zasady importowania (Merging)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-amber-800 mb-2">Jaknie kondygnacje połączyć?</div>
                      <div className="space-y-2 bg-white/60 p-3 rounded-lg border border-amber-100">
                        {floorsList.map(floor => (
                          <label key={floor.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-amber-600 focus:ring-amber-500"
                              checked={selectedFloors.has(floor.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedFloors);
                                if (e.target.checked) newSet.add(floor.id);
                                else newSet.delete(floor.id);
                                setSelectedFloors(newSet);
                              }}
                            />
                            <span className="text-sm text-slate-700 font-medium">{floor.name} <span className="text-xs text-slate-400 ml-1">({floor.elevation}m)</span></span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-amber-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                        checked={importSystems}
                        onChange={(e) => setImportSystems(e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Skopiuj brakujące Systemy Wentylacyjne</div>
                        <div className="text-xs text-amber-700/70">Jeśli odznaczysz, zaimportowane sale mogą stracić swoje przypisania systemów (nawiewnika/wywiewnika).</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          
          <button 
            onClick={handleImport}
            disabled={!fileData || (mode === 'MERGE' && selectedFloors.size === 0)}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'NEW_PROJECT' ? 'Odtwórz Projekt' : 'Scal Dane'}
          </button>
        </div>
      </div>
    </div>
  );
}
