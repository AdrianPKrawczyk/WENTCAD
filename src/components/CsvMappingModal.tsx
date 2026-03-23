import { useState, useEffect } from 'react';

interface CsvMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mappedData: any[]) => void;
  csvData: any[]; // The raw data mapped to original headers
  headers: string[]; // The detected headers from CSV
}

export function CsvMappingModal({ isOpen, onClose, onImport, csvData, headers }: CsvMappingModalProps) {
  const [mapping, setMapping] = useState<{ [key: string]: string }>({
    nr: '',
    name: '',
    area: '',
    height: '',
    // WATT Thermodynamics
    roomTempSummer: '',
    roomRHSummer: '',
    supplyTempSummer: '',
    supplyRHSummer: '',
    roomTempWinter: '',
    roomRHWinter: '',
    supplyTempWinter: '',
    supplyRHWinter: '',
    manualHeatLoss: '',
    manualSensibleGain: '',
    manualMoistureGain: ''
  });

  // Attempt auto-mapping
  useEffect(() => {
    if (!isOpen || headers.length === 0) return;
    
    setMapping({
      nr: headers.find(h => h.toLowerCase().includes('nr') || h.toLowerCase().includes('numer')) || '',
      name: headers.find(h => h.toLowerCase().includes('nazwa') || h.toLowerCase().includes('name') || h.toLowerCase().includes('pomieszczenie')) || '',
      area: headers.find(h => h.toLowerCase().includes('powierzchnia') || h.toLowerCase().includes('area')) || '',
      height: headers.find(h => h.toLowerCase().includes('wysoko') || h.toLowerCase().includes('height')) || '',
      // WATT Auto-mapping
      roomTempSummer: headers.find(h => (h.toLowerCase().includes('lato') || h.toLowerCase().includes('summer')) && (h.toLowerCase().includes('temp') || h.toLowerCase().includes('t_'))) || '',
      roomRHSummer: headers.find(h => (h.toLowerCase().includes('lato') || h.toLowerCase().includes('summer')) && (h.toLowerCase().includes('wilg') || h.toLowerCase().includes('rh'))) || '',
      supplyTempSummer: headers.find(h => (h.toLowerCase().includes('lato') || h.toLowerCase().includes('summer')) && h.toLowerCase().includes('nawiew') && h.toLowerCase().includes('temp')) || '',
      supplyRHSummer: headers.find(h => (h.toLowerCase().includes('lato') || h.toLowerCase().includes('summer')) && h.toLowerCase().includes('nawiew') && h.toLowerCase().includes('wilg')) || '',
      roomTempWinter: headers.find(h => (h.toLowerCase().includes('zima') || h.toLowerCase().includes('winter')) && (h.toLowerCase().includes('temp') || h.toLowerCase().includes('t_'))) || '',
      roomRHWinter: headers.find(h => (h.toLowerCase().includes('zima') || h.toLowerCase().includes('winter')) && (h.toLowerCase().includes('wilg') || h.toLowerCase().includes('rh'))) || '',
      supplyTempWinter: headers.find(h => (h.toLowerCase().includes('zima') || h.toLowerCase().includes('winter')) && h.toLowerCase().includes('nawiew') && h.toLowerCase().includes('temp')) || '',
      supplyRHWinter: headers.find(h => (h.toLowerCase().includes('zima') || h.toLowerCase().includes('winter')) && h.toLowerCase().includes('nawiew') && h.toLowerCase().includes('wilg')) || '',
      manualHeatLoss: headers.find(h => h.toLowerCase().includes('strata') || h.toLowerCase().includes('heat loss')) || '',
      manualSensibleGain: headers.find(h => h.toLowerCase().includes('zyski jawne') || h.toLowerCase().includes('sensible gain')) || '',
      manualMoistureGain: headers.find(h => h.toLowerCase().includes('zyski wilgoci') || h.toLowerCase().includes('moisture gain')) || ''
    });
  }, [isOpen, headers]);

  if (!isOpen) return null;

  const handleApply = () => {
    // Transform original csvData arrays based on user chosen mapping
    const mappedObjects = csvData.map(row => {
      const parseValue = (val: any) => val ? parseFloat(val.toString().replace(',', '.')) : undefined;
      return {
        nr: mapping.nr ? row[mapping.nr] : undefined,
        name: mapping.name ? row[mapping.name] : undefined,
        area: mapping.area ? parseValue(row[mapping.area]) : undefined,
        height: mapping.height ? parseValue(row[mapping.height]) : undefined,
        // WATT Fields
        roomTempSummer: mapping.roomTempSummer ? parseValue(row[mapping.roomTempSummer]) : undefined,
        roomRHSummer: mapping.roomRHSummer ? parseValue(row[mapping.roomRHSummer]) : undefined,
        supplyTempSummer: mapping.supplyTempSummer ? parseValue(row[mapping.supplyTempSummer]) : undefined,
        supplyRHSummer: mapping.supplyRHSummer ? parseValue(row[mapping.supplyRHSummer]) : undefined,
        roomTempWinter: mapping.roomTempWinter ? parseValue(row[mapping.roomTempWinter]) : undefined,
        roomRHWinter: mapping.roomRHWinter ? parseValue(row[mapping.roomRHWinter]) : undefined,
        supplyTempWinter: mapping.supplyTempWinter ? parseValue(row[mapping.supplyTempWinter]) : undefined,
        supplyRHWinter: mapping.supplyRHWinter ? parseValue(row[mapping.supplyRHWinter]) : undefined,
        manualHeatLoss: mapping.manualHeatLoss ? parseValue(row[mapping.manualHeatLoss]) : undefined,
        manualSensibleGain: mapping.manualSensibleGain ? parseValue(row[mapping.manualSensibleGain]) : undefined,
        manualMoistureGain: mapping.manualMoistureGain ? parseValue(row[mapping.manualMoistureGain]) : undefined
      };
    });
    
    onImport(mappedObjects);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-[550px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4">Mapowanie Kolumn CSV</h2>
        <p className="text-sm text-gray-500 mb-6">Przypisz kolumny z pliku CSV do właściwości systemu WENTCAD.</p>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Numer (Nr)</label>
            <select 
              value={mapping.nr} 
              onChange={(e) => setMapping({...mapping, nr: e.target.value})}
              className="mt-1 block w-2/3 border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Pomiń (Wygeneruj auto) --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Nazwa Pokoju</label>
            <select 
              value={mapping.name} 
              onChange={(e) => setMapping({...mapping, name: e.target.value})}
              className="mt-1 block w-2/3 border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Pomiń (Pokój X) --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Powierzchnia [m²]</label>
            <select 
              value={mapping.area} 
              onChange={(e) => setMapping({...mapping, area: e.target.value})}
              className="mt-1 block w-2/3 border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Pomiń (Domyślnie 15) --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-medium text-gray-700">Wysokość [m]</label>
            <select 
              value={mapping.height} 
              onChange={(e) => setMapping({...mapping, height: e.target.value})}
              className="mt-1 block w-2/3 border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Pomiń (Domyślnie 3) --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Termodynamika (Opcjonalne)</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {[
                { label: 'Temp. Lato [°C]', field: 'roomTempSummer' },
                { label: 'Wilg. Lato [%]', field: 'roomRHSummer' },
                { label: 'Nawiew Temp. Lato [°C]', field: 'supplyTempSummer' },
                { label: 'Nawiew Wilg. Lato [%]', field: 'supplyRHSummer' },
                { label: 'Temp. Zima [°C]', field: 'roomTempWinter' },
                { label: 'Wilg. Zima [%]', field: 'roomRHWinter' },
                { label: 'Nawiew Temp. Zima [°C]', field: 'supplyTempWinter' },
                { label: 'Nawiew Wilg. Zima [%]', field: 'supplyRHWinter' },
                { label: 'Manualna Strata Ciepła [W]', field: 'manualHeatLoss' },
                { label: 'Manualne Zyski Jawne [W]', field: 'manualSensibleGain' },
                { label: 'Manualne Zyski Wilgoci [g/s]', field: 'manualMoistureGain' },
              ].map(item => (
                <div key={item.field} className="flex items-center">
                  <label className="w-1/3 text-[11px] font-medium text-gray-600">{item.label}</label>
                  <select 
                    value={(mapping as any)[item.field]} 
                    onChange={(e) => setMapping({...mapping, [item.field]: e.target.value})}
                    className="mt-1 block w-2/3 border border-gray-200 rounded-md p-1.5 text-xs"
                  >
                    <option value="">-- Pomiń --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button 
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Importuj Dane
          </button>
        </div>
      </div>
    </div>
  );
}
