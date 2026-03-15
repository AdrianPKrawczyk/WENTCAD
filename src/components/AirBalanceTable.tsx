import { useMemo, useCallback, useState, useRef } from 'react';
import Papa from 'papaparse';
import { AgGridReact } from 'ag-grid-react';
import { RoomWizardModal } from './RoomWizardModal';
import { CsvMappingModal } from './CsvMappingModal';
import { ModuleRegistry, ClientSideRowModelModule, ValidationModule, RowSelectionModule, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { useZoneStore } from '../stores/useZoneStore';
import type { ZoneData } from '../types';
import type { ColDef } from 'ag-grid-community';

// Register ALL enterprise modules to avoid version mismatches
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule, RowSelectionModule, AllEnterpriseModule]);

export function AirBalanceTable() {
  const zones = useZoneStore((state) => state.zones);
  const addZone = useZoneStore((state) => state.addZone);
  const updateZone = useZoneStore((state) => state.updateZone);
  const removeZone = useZoneStore((state) => state.removeZone);
  const setSelectedZone = useZoneStore((state) => state.setSelectedZone);

  const rowData = useMemo(() => Object.values(zones), [zones]);

  const columnDefs = useMemo<ColDef<ZoneData>[]>(() => [
    { field: 'nr', headerName: 'Nr', editable: true, width: 80, pinned: 'left' },
    { field: 'name', headerName: 'Nazwa', editable: true, flex: 1, minWidth: 150 },
    { 
      field: 'calculationMode', 
      headerName: 'Tryb Obliczeń', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['AUTO_MAX', 'MANUAL', 'HYGIENIC_ONLY', 'ACH_ONLY', 'THERMAL_ONLY']
      },
      minWidth: 130
    },
    { 
      field: 'systemSupplyId', 
      headerName: 'Sys. Nawiew', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['NW1', 'NW2', 'Brak']
      },
      minWidth: 120 
    },
    { 
      field: 'systemExhaustId', 
      headerName: 'Sys. Wyciąg', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['WW1', 'WW2', 'Brak']
      },
      minWidth: 120 
    },
    { 
      field: 'area', 
      headerName: 'Pow. [m²]', 
      editable: true, 
      type: 'numericColumn', 
      width: 100,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
    { 
      field: 'height', 
      headerName: 'Wys. [m]', 
      editable: true, 
      type: 'numericColumn', 
      width: 90,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
    { field: 'occupants', headerName: 'Osoby', editable: true, type: 'numericColumn', width: 90 },
    { field: 'normativeVolume', headerName: 'V_norm [m³/h]', editable: true, type: 'numericColumn', width: 110 },
    { field: 'normativeExhaust', headerName: 'V_wyc_norm', editable: true, type: 'numericColumn', width: 110 },
    {
      field: 'calculatedVolume',
      headerName: 'V_sup [m³/h]',
      editable: false,
      cellStyle: { backgroundColor: '#e0f2fe', fontWeight: 'bold' } as any,
      width: 110
    },
    {
      field: 'calculatedExhaust',
      headerName: 'V_exh [m³/h]',
      editable: false,
      cellStyle: { backgroundColor: '#fee2e2', fontWeight: 'bold' } as any,
      width: 110
    },
    { field: 'transferInSum', headerName: 'Trans. IN', editable: false, width: 100 },
    { field: 'transferOutSum', headerName: 'Trans. OUT', editable: false, width: 100 },
    {
      field: 'netBalance',
      headerName: 'Net Balance',
      editable: false,
      cellStyle: (params) => {
        const val = params.value;
        if (val > 0) return { backgroundColor: '#dcfce7', fontWeight: 'bold' };
        if (val < 0) return { backgroundColor: '#fef08a', fontWeight: 'bold' };
        return { backgroundColor: '#f3f4f6', fontWeight: 'bold' };
      },
      width: 110
    },
    {
      field: 'realACH',
      headerName: 'Real ACH [1/h]',
      editable: false,
      cellStyle: { backgroundColor: '#f3f4f6' } as any,
      width: 110
    },
    { 
      headerName: '', 
      colId: 'delete', 
      width: 50, 
      pinned: 'right', 
      editable: false, 
      sortable: false, 
      filter: false,
      cellRenderer: () => '<span class="cursor-pointer text-red-500 hover:text-red-700 bg-white p-1 rounded">🗑️</span>',
      onCellClicked: (params) => {
        if (params.data && confirm('Czy na pewno chcesz usunąć tę strefę? (Zostaną usunięte także powiązane transfery w innych pokojach)')) {
          // call delete function 
          params.context?.removeZone(params.data.id);
        }
      }
    }
  ], []);

  const handleCellValueChanged = useCallback((event: any) => {
    const { data, colDef, newValue } = event;
    if (!data || !colDef) return;
    
    const update: any = {};
    const field = colDef.field as keyof ZoneData;
    
    // Rzutowanie na Number jeśli kolumna jest numeryczna
    // newValue pochodzi ze stringa jeśli było edytowane jako tekst (a nie przez dedykowany edytor numeryczny)
    if (colDef.type === 'numericColumn' || typeof (data as any)[field] === 'number') {
      let parsed = Number(newValue);
      if (typeof newValue === 'string') {
        parsed = Number(newValue.replace(',', '.'));
      }
      update[field] = isNaN(parsed) ? 0 : parsed;
    } else {
      update[field] = newValue;
    }
    
    updateZone(data.id, update);
  }, [updateZone]);


  // Pomocnicza funkcja do zapisu szerokości kolumn (zapobieganie resetowaniu)
  const onColumnResized = useCallback((params: any) => {
    if (params.finished) {
      const columnState = params.api.getColumnState();
      localStorage.setItem('wentcad_column_state', JSON.stringify(columnState));
    }
  }, []);

  const onGridReady = useCallback((params: any) => {
    const savedState = localStorage.getItem('wentcad_column_state');
    if (savedState) {
      params.api.applyColumnState({ state: JSON.parse(savedState), applyOrder: true });
    }
  }, []);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRow = () => {
    const newId = `zone-${Date.now()}`;
    const newIndex = Object.keys(zones).length + 1;
    addZone({
      id: newId,
      nr: `P-${newIndex.toString().padStart(2, '0')}`,
      name: `Nowy Pokój`,
      activityType: 'OFFICE',
      calculationMode: 'AUTO_MAX',
      systemSupplyId: 'NW1',
      systemExhaustId: 'WW1',
      area: 15,
      height: 3,
      isAreaLinkedToGeometry: false,
      occupants: 2,
      dosePerOccupant: 30,
      targetACH: 0,
      normativeVolume: 0,
      normativeExhaust: 0,
      totalHeatGain: 0,
      roomTemp: 24,
      roomRH: 50,
      supplyTemp: 16,
      supplyRH: 80,
      acousticAbsorption: 'MEDIUM',
      maxAllowedDbA: 35,
      transferIn: [],
      transferOut: [],
      calculatedVolume: 0,
      calculatedExhaust: 0,
      transferInSum: 0,
      transferOutSum: 0,
      netBalance: 0,
      realACH: 0
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length > 0) {
          setCsvHeaders(Object.keys(results.data[0]));
          setCsvRawData(results.data);
          setIsCsvModalOpen(true);
        }
      }
    });
  };

  const handleCsvImport = (mappedData: any[]) => {
    mappedData.forEach((row, index) => {
      const area = row.area || 15;
      const height = row.height || 3;
      const name = row.name || `Pokój ${index + 1}`;
      const nr = row.nr || `P-${(Object.keys(zones).length + index + 1).toString().padStart(2, '0')}`;
      
      addZone({
        id: `zone-${Date.now()}-${index}`,
        nr,
        name,
        activityType: 'OFFICE',
        calculationMode: 'AUTO_MAX',
        systemSupplyId: 'NW1',
        systemExhaustId: 'WW1',
        area,
        height,
        isAreaLinkedToGeometry: false,
        occupants: 0,
        dosePerOccupant: 30,
        targetACH: 0,
        normativeVolume: 0,
        normativeExhaust: 0,
        totalHeatGain: 0,
        roomTemp: 24,
        roomRH: 50,
        supplyTemp: 16,
        supplyRH: 80,
        acousticAbsorption: 'MEDIUM',
        maxAllowedDbA: 35,
        transferIn: [],
        transferOut: [],
        calculatedVolume: 0,
        calculatedExhaust: 0,
        transferInSum: 0,
        transferOutSum: 0,
        netBalance: 0,
        realACH: 0
      });
    });
    
    setIsCsvModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Air Balance (Krok 1.5)</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md border border-gray-300 shadow-sm text-sm font-medium transition-colors"
          >
            Import CSV
          </button>
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            + Kreator Szablonów
          </button>
          <button 
            onClick={handleAddRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            + Pusty Wiersz
          </button>
        </div>
      </div>
      
      <div style={{ height: '100%', width: '100%', flex: 1 }}>
        <AgGridReact
          theme={themeQuartz}
          getRowId={(params) => params.data.id}
          rowData={rowData}
          columnDefs={columnDefs}
          context={{ removeZone }}
          onCellValueChanged={handleCellValueChanged}
          onColumnResized={onColumnResized}
          onColumnMoved={onColumnResized}  
          onDisplayedColumnsChanged={onColumnResized}
          onGridReady={onGridReady}
          animateRows={true}
          sideBar={'columns'}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            onCellClicked: (params: any) => {
              console.log('[WENTCAD] defaultColDef onCellClicked', params?.data?.id);
              if (params.data) {
                setSelectedZone(params.data.id);
              }
            }
          }}
        />
      </div>

      <RoomWizardModal 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onSave={addZone} 
      />

      <CsvMappingModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleCsvImport}
        csvData={csvRawData}
        headers={csvHeaders}
      />
    </div>
  );
}
