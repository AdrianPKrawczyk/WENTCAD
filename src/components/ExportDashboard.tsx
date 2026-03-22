import { useState } from 'react';
import { Download, FileText, Table, Save, Trash2, CheckCircle2, Box } from 'lucide-react';
import { useZoneStore } from '../stores/useZoneStore';
import { useSettingsStore, type ExportProfile } from '../stores/useSettingsStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { exportData } from '../lib/exportUtils';
import { toast } from 'sonner';

export function ExportDashboard() {
  const zones = useZoneStore(s => s.zones);
  const floors = useZoneStore(s => s.floors);
  const activeFloorId = useZoneStore(s => s.activeFloorId);
  
  const savedExportProfiles = useSettingsStore(s => s.savedExportProfiles);
  const savedColumnProfiles = useSettingsStore(s => s.savedColumnProfiles);
  const saveExportProfile = useSettingsStore(s => s.saveExportProfile);
  const deleteExportProfile = useSettingsStore(s => s.deleteExportProfile);

  // Form State
  const [profileName, setProfileName] = useState('');
  const [format, setFormat] = useState<'PDF' | 'XLSX' | 'IFC'>('PDF');
  const [scope, setScope] = useState<'ALL_FLOORS' | 'ACTIVE_FLOOR'>('ACTIVE_FLOOR');
  
  const [includeBalanceTable, setIncludeBalanceTable] = useState(true);
  const [includeRoomCards, setIncludeRoomCards] = useState(false);
  const [includeSummaries, setIncludeSummaries] = useState(true);
  
  const [fontFamily, setFontFamily] = useState<'helvetica' | 'times' | 'courier' | 'roboto'>('roboto');
  const [fontSize, setFontSize] = useState<number>(10);
  const [columnProfileId, setColumnProfileId] = useState<string>('');

  const handleExport = async () => {
    toast.promise(
      (async () => {
        if (format === 'IFC') {
          const { exportToIfc } = await import('../lib/ifcExport');
          const canvasFloors = useCanvasStore.getState().floors;
          await exportToIfc(zones, floors, canvasFloors);
          return;
        }

        let selectedColumns;
        if (columnProfileId) {
          const profile = savedColumnProfiles.find(p => p.id === columnProfileId);
          if (profile) selectedColumns = profile.state;
        }

        await exportData(
          {
            format,
            scope,
            includeBalanceTable,
            includeRoomCards,
            includeSummaries,
            fontFamily,
            fontSize,
            columnState: selectedColumns
          },
          zones,
          floors,
          activeFloorId
        );
      })(),
      {
        loading: 'Generowanie pliku...',
        success: 'Dane pomyślnie wyeksportowane!',
        error: 'Wystąpił błąd podczas generowania.',
      }
    );
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    saveExportProfile({
      name: profileName,
      format,
      scope,
      includeBalanceTable,
      includeRoomCards,
      includeSummaries,
      fontFamily,
      fontSize,
      columnProfileId: columnProfileId || null,
    });
    setProfileName('');
    toast.success('Szablon eksportu zapisany pomyślnie!');
  };

  const applyProfile = (p: ExportProfile) => {
    setFormat(p.format);
    setScope(p.scope);
    setIncludeBalanceTable(p.includeBalanceTable);
    setIncludeRoomCards(p.includeRoomCards);
    setIncludeSummaries(p.includeSummaries || false);
    setFontFamily(p.fontFamily);
    setFontSize(p.fontSize);
    setColumnProfileId(p.columnProfileId || '');
  };

  return (
    <div className="flex w-full h-full bg-slate-50 relative overflow-hidden">
      
      {/* KREATOR GŁÓWNY (ŚRODEK) */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm border border-indigo-200">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Eksport Danych z Projektu</h1>
              <p className="text-slate-500 mt-1">Generuj czytelne tabele zbiorcze z kolumnami wg szablonu na arkuszu oraz szczegółowe karty poszczególnych pomieszczeń instalacji wentylacyjnych.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 1: Format i Zakres */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 pb-2 border-b border-slate-100">Format i Dane Wejściowe</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Rozszerzenie Pliku</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormat('PDF')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${
                        format === 'PDF' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <FileText className="w-5 h-5" /> PDF (A3)
                    </button>
                    <button
                      onClick={() => setFormat('XLSX')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${
                        format === 'XLSX' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Table className="w-5 h-5" /> Excel (XLSX)
                    </button>
                    <button
                      onClick={() => setFormat('IFC')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${
                        format === 'IFC' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Box className="w-5 h-5" /> IFC (3D)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Zakres Kondygnacji</label>
                  <select 
                    value={scope} 
                    onChange={e => setScope(e.target.value as any)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-indigo-500 font-medium bg-white"
                  >
                    <option value="ACTIVE_FLOOR">Obecna (Kondygnacja: {floors[activeFloorId]?.name || activeFloorId})</option>
                    <option value="ALL_FLOORS">Cały Projekt Wspólnie (Wszystkie wpisy)</option>
                  </select>
                </div>

                <div className={format === 'IFC' ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Zawartość Dokumentu</label>
                  <label className="flex items-center gap-3 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mb-2">
                    <input 
                      type="checkbox" 
                      checked={includeSummaries} 
                      onChange={e => setIncludeSummaries(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Tabela Podsumowań i Zestawień</span>
                      <span className="block text-xs text-slate-500">Agregacja stref na całe kondygnacje, węzły HVAC oraz globalne dane budynku.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mb-2">
                    <input 
                      type="checkbox" 
                      checked={includeBalanceTable} 
                      onChange={e => setIncludeBalanceTable(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Tabela Zbiorcza Bilansu</span>
                      <span className="block text-xs text-slate-500">Duża tabela pozioma z przeglądem wszystkich stref i sumami systemów z Krok 1.5.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeRoomCards} 
                      onChange={e => setIncludeRoomCards(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Szczegółowe Karty Pomieszczeń</span>
                      <span className="block text-xs text-slate-500">Osobne moduły metryczek dla każdego pokoju, zawierające dane wejściowe.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 2: Wygląd i Kolumny */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div className={format === 'IFC' ? 'opacity-50 pointer-events-none' : ''}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 pb-2 border-b border-slate-100">Prezentacja / Czytelność (Dla PDF)</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Rodzina Czcionki</label>
                      <select 
                        value={fontFamily} 
                        onChange={e => setFontFamily(e.target.value as any)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="roboto">Roboto (Polskie Znaki)</option>
                        <option value="helvetica">Helvetica (Polecana/Nowoczesna)</option>
                        <option value="times">Times New Roman (Klasyczna)</option>
                        <option value="courier">Courier (Techniczna)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Rozmiar Tekstu (Tabela)</label>
                      <input 
                        type="number" 
                        min="6" max="18"
                        value={fontSize} 
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 mt-2 pt-2 border-t border-slate-100">
                      Zastosuj Szablon Widoczności Kolumn 
                      <span className="block text-xs font-normal text-slate-500 mt-0.5">Mniej kolumn = większa przestrzeń na komórkę w arkuszu. Wykorzystaj własne profile zapisane z okna "Szablony" z prawego paska Tabeli Bilansu.</span>
                    </label>
                    <select 
                      value={columnProfileId} 
                      onChange={e => setColumnProfileId(e.target.value)}
                      className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-indigo-900 focus:outline-none focus:border-indigo-500 font-bold bg-indigo-50/50"
                    >
                      <option value="">(Wszystkie Dostępne Kolumny Bez Filtra)</option>
                      {savedColumnProfiles.map(p => (
                        <option key={p.id} value={p.id}>✅ Zapisany Układ: "{p.name}"</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-8">
                <button
                  onClick={handleExport}
                  disabled={format === 'IFC' ? false : (!includeBalanceTable && !includeRoomCards)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  WYGENERUJ DOKUMENT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL PRAWY - ZAPISANE SZABLONY EKSPORTU */}
      <div className="w-80 bg-white border-l border-slate-200 shadow-sm flex flex-col shrink-0 z-10">
        <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Save className="w-4 h-4 text-indigo-600" />
            Profile Generatora
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Tutaj zapiszesz zdefiniowaną przed chwilą precyzyjną konfigurację (rodzaj fontu, powiązane ustawienie kolumn, oraz odznaczenia tabel/kart) do użycia wielokrotnie, na każdym projekcie.
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 text-xs font-bold border-2 border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              placeholder="Nazwij ten układ profilu..."
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
            />
            <button
              onClick={handleSaveProfile}
              disabled={!profileName.trim()}
              className="bg-slate-800 text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-black disabled:opacity-50 transition-colors shrink-0"
            >
              Zapisz
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {savedExportProfiles.length === 0 ? (
             <div className="text-center p-6 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
               Jeszcze nie utworzyłeś szybkiego szablonu generatora plików.
             </div>
          ) : (
            savedExportProfiles.map(p => (
              <div key={p.id} className="bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-xl p-3 transition-colors shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-800 leading-tight">{p.name}</h4>
                  <button onClick={() => deleteExportProfile(p.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex gap-1 flex-wrap mb-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${p.format === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{p.format}</span>
                  {p.includeSummaries && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-100">SUMY</span>}
                  {p.includeBalanceTable && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">TABLICA</span>}
                  {p.includeRoomCards && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-100">KARTY POK.</span>}
                </div>

                <button 
                  onClick={() => applyProfile(p)}
                  className="w-full flex justify-center items-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg border border-slate-200 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Zastosuj ustawienia
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
