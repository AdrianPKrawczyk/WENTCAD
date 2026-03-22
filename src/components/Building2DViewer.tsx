import React, { useEffect } from 'react';
import { Workspace2D } from './Workspace2D';
import { useUIStore } from '../stores/useUIStore';
import { Eye, EyeOff, Layers } from 'lucide-react';

export function Building2DViewer() {
  const isUnderlayVisible = useUIStore((s) => s.isUnderlayVisible);
  const setIsUnderlayVisible = useUIStore((s) => s.setIsUnderlayVisible);

  // Domyślnie wyłączamy podkład przy wejściu do tego widoku
  useEffect(() => {
    setIsUnderlayVisible(false);
    // Opcjonalnie: przy wyjściu można przywrócić, ale lepiej zostawić wybór użytkownika
  }, [setIsUnderlayVisible]);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Pasek narzędzi widoku 2D */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
          <Layers className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Model Architektoniczny 2D</span>
        </div>
        
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        
        <button
          onClick={() => setIsUnderlayVisible(!isUnderlayVisible)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isUnderlayVisible 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          {isUnderlayVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Podkład CAD
        </button>
      </div>

      {/* Reużywamy Workspace2D jako silnika rzutu */}
      <Workspace2D className="flex-1" />
      
      {/* Miejsce na przyszłe narzędzia edycji (Overlay) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
         <div className="bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest opacity-50 border border-white/10">
            Tryb Przeglądu Modelu (Edycja w przygotowaniu)
         </div>
      </div>
    </div>
  );
}
