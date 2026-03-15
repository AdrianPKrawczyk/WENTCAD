import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Nie sprawdzono')

  // Example basic connection test wrapper
  const testDbConnection = async () => {
    try {
      setDbStatus('Sprawdzanie...')
      const { error } = await supabase.from('projects').select('id').limit(1)
      if (error) throw error
      setDbStatus('Połączono')
    } catch (e: any) {
      console.error(e)
      setDbStatus('Błąd połączenia')
    }
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      
      {/* SIDEBAR: Menedżer instalacji i właściwości */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">WENTCAD</h1>
          <p className="text-sm text-gray-500">HVAC BIM Platform</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Sekcja: Nawiew */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Nawiew (Supply)
            </h2>
            <div className="border-l-4 border-[var(--color-brand-supply)] pl-3 py-1">
              <p className="text-sm font-medium">Instalacja Nawiewna</p>
              <p className="text-xs text-gray-500">przepływ: {`--- m³/h`}</p>
            </div>
          </div>
          
          {/* Sekcja: Wyciąg */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Wyciąg (Exhaust)
            </h2>
            <div className="border-l-4 border-[var(--color-brand-exhaust)] pl-3 py-1">
              <p className="text-sm font-medium">Instalacja Wyciągowa</p>
              <p className="text-xs text-gray-500">przepływ: {`--- m³/h`}</p>
            </div>
          </div>
          
        </div>
      </aside>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOOLBAR */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              Zapisz
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              Cofnij
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              Ponów
            </button>
            <button 
              onClick={testDbConnection} 
              className="ml-4 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Test Supabase
            </button>
          </div>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <span>Supabase:</span>
            <span className={`font-semibold ${dbStatus === 'Połączono' ? 'text-green-600' : dbStatus === 'Błąd połączenia' ? 'text-red-600' : ''}`}>
              {dbStatus}
            </span>
          </div>
        </header>

        {/* CANVAS: react-konva (placeholder for now) */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 border-4 border-dashed border-gray-200 m-4 rounded-xl">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Brak aktywnego projektu</h3>
              <p className="mt-1 text-sm text-gray-500">Obszar roboczy Konva.js pojawi się w kolejnych krokach.</p>
            </div>
          </div>
        </div>
        
      </main>
    </div>
  )
}

export default App
