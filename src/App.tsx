import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { useZoneStore } from './stores/useZoneStore'
import { AirBalanceTable } from './components/AirBalanceTable'
import { ZonePropertiesPanel } from './components/ZonePropertiesPanel'
import { StatusBar } from './components/StatusBar'

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Nie sprawdzono')
  const zones = useZoneStore((state) => state.zones)

  const testDbConnection = async () => {
    try {
      setDbStatus('Sprawdzanie...')
      const { error } = await supabase.from('projects').select('id').limit(1)
      if (error) throw error
      setDbStatus('Połączono z bazą')
    } catch (e: any) {
      console.error(e)
      setDbStatus('Błąd połączenia')
    }
  }

  const saveToSupabase = async () => {
    // Uwaga: To wymaga autentykacji (RLS on default table 'projects' will block anonymous inserts if standard policy applies).
    // The user will need row-level insert rights. We use an example project ID or create one if none exists.
    try {
      setDbStatus('Zapisywanie...')
      const stateData = { zones }
      
      // In production, we'd have a user login auth step before doing this.
      // And we'd update a specific `id` rather than inserting arbitrarily.
      const { error } = await supabase.from('projects').insert([
        { name: 'Krok 1 Projekt Testowy', state_data: stateData }
      ])
      
      if (error) throw error
      setDbStatus('Zapisano pomyślnie')
    } catch (e: any) {
      console.error(e)
      setDbStatus('Błąd zapisu (RLS/Auth?)')
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* TOOLBAR */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col mr-6">
            <h1 className="text-sm font-bold leading-tight">WENTCAD</h1>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Pulpit Inżyniera</span>
          </div>

          <button 
            onClick={saveToSupabase}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
          >
            Zapisz do chmury
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <button 
            onClick={testDbConnection} 
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-md transition-colors"
          >
            Test Połączenia Supabase
          </button>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          <span className={`w-2 h-2 rounded-full ${dbStatus.includes('Połączono') || dbStatus.includes('pomyślnie') ? 'bg-green-500' : dbStatus.includes('Błąd') ? 'bg-red-500' : 'bg-gray-400'}`}></span>
          <span>{dbStatus}</span>
        </div>
      </header>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEWY SIDEBAR: Zastępczy (do Kroku 2: Drzewo Projektu) */}
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4 shadow-sm z-10 shrink-0">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100" title="Tabele Bilansowe">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="p-2 text-gray-400 hover:text-gray-600 cursor-not-allowed" title="Canvas (dostępny w Kroku 2)">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </aside>

        {/* CENTRUM: Air Balance Table */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
          <AirBalanceTable />
        </main>

        {/* PRAWY SIDEBAR: Właściwości Strefy */}
        <ZonePropertiesPanel />

      </div>

      {/* PASEK STANU (Dashboard) */}
      <StatusBar />
      
    </div>
  )
}

export default App

