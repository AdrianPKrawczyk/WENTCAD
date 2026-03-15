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
    height: ''
  });

  // Attempt auto-mapping
  useEffect(() => {
    if (!isOpen || headers.length === 0) return;
    
    setMapping({
      nr: headers.find(h => h.toLowerCase().includes('nr') || h.toLowerCase().includes('numer')) || '',
      name: headers.find(h => h.toLowerCase().includes('nazwa') || h.toLowerCase().includes('name') || h.toLowerCase().includes('pomieszczenie')) || '',
      area: headers.find(h => h.toLowerCase().includes('powierzchnia') || h.toLowerCase().includes('area')) || '',
      height: headers.find(h => h.toLowerCase().includes('wysoko') || h.toLowerCase().includes('height')) || ''
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
        height: mapping.height ? parseValue(row[mapping.height]) : undefined
      };
    });
    
    onImport(mappedObjects);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl">
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
