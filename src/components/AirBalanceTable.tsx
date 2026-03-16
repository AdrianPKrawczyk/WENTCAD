import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { AgGridReact } from 'ag-grid-react';
import { RoomWizardModal } from './RoomWizardModal';
import { CsvMappingModal } from './CsvMappingModal';
import { SystemManagerModal } from './SystemManagerModal';
import { FloorManagerBar } from './FloorManagerBar';
import { BulkEditModal } from './BulkEditModal';
import { ModuleRegistry, ClientSideRowModelModule, ValidationModule, RowSelectionModule, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { useZoneStore } from '../stores/useZoneStore';
import { useProjectStore } from '../stores/useProjectStore';
import { customDebounce } from '../lib/utils';
import { ROOM_PRESETS, ROOM_TYPE_ACH_MAPPING } from '../lib/hvacConstants';
import type { ZoneData, ActivityType } from '../types';
import type { ColDef } from 'ag-grid-community';
import { resolveZoneStyle } from '../lib/VisualStyles';

// Register ALL enterprise modules to avoid version mismatches
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule, RowSelectionModule, AllEnterpriseModule]);

export function AirBalanceTable() {
  const zones = useZoneStore((state) => state.zones);
  const addZone = useZoneStore((state) => state.addZone);
  const updateZone = useZoneStore((state) => state.updateZone);
  const removeZone = useZoneStore((state) => state.removeZone);
  const setSelectedZone = useZoneStore((state) => state.setSelectedZone);
  const systems = useZoneStore((state) => state.systems);
  const activeFloorId = useZoneStore((state) => state.activeFloorId);
  const bulkDeleteZones = useZoneStore((state) => state.bulkDeleteZones);
  const isSystemColoringEnabled = useZoneStore((s) => s.isSystemColoringEnabled);
  const setIsSystemColoringEnabled = useZoneStore((s) => s.setIsSystemColoringEnabled);
  const globalSystemOpacity = useZoneStore((s) => s.globalSystemOpacity);
  const activeProjectId = useProjectStore((s) => s.activeProject?.id);
  const columnState = useZoneStore((s) => s.columnState);
  const setColumnState = useZoneStore((s) => s.setColumnState);
  const isApplyingStateRef = useRef(false);
  const lastAppliedStateRef = useRef<string>('');
  const lastProjectRef = useRef<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const gridRef = useRef<AgGridReact>(null);

  const rowData = useMemo(() => {
    const allZones = Object.values(zones);
    if (activeFloorId === '__all__') return allZones;
    return allZones.filter((z) => z.floorId === activeFloorId);
  }, [zones, activeFloorId]);

  const supplySystems = useMemo(() => ['Brak', ...systems.filter(s => s.type === 'SUPPLY').map(s => s.id)], [systems]);
  const exhaustSystems = useMemo(() => ['Brak', ...systems.filter(s => s.type === 'EXHAUST').map(s => s.id)], [systems]);

  const columnDefs = useMemo<ColDef<ZoneData>[]>(() => [
    { 
      field: 'nr', 
      headerName: 'Nr', 
      editable: true, 
      width: 100, 
      pinned: 'left',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
    },
    { field: 'name', headerName: 'Nazwa', editable: true, minWidth: 250 },
    { 
      field: 'activityType', 
      headerName: 'Rodzaj pomieszczenia', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          ...Object.keys(ROOM_TYPE_ACH_MAPPING)
        ]
      },
      minWidth: 200
    },
    { 
      field: 'area', 
      headerName: 'Pow. [m²]', 
      editable: true, 
      type: 'numericColumn', 
      width: 120,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
    { 
      field: 'height', 
      headerName: 'Wys. [m]', 
      editable: true, 
      type: 'numericColumn', 
      width: 110,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
    {
      headerName: 'Kubatura [m³]',
      valueGetter: (params) => {
        if (!params.data) return 0;
        return params.data.manualVolume !== null && params.data.manualVolume !== undefined 
            ? params.data.manualVolume 
            : params.data.area * params.data.height;
      },
      editable: false,
      type: 'numericColumn',
      width: 130,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
    {
      field: 'manualTargetACH',
      headerName: 'Krotność zadana',
      editable: (params) => !!params.data?.isTargetACHManual,
      type: 'numericColumn',
      width: 130,
      valueFormatter: params => {
        if (!params.data?.isTargetACHManual) {
           return `(Auto) ${params.data?.targetACH?.toFixed(2) || '0.00'}`;
        }
        return params.value ? parseFloat(params.value).toFixed(2) : '0.00';
      },
      cellStyle: (params) => {
        return params.data?.isTargetACHManual ? { backgroundColor: '#fff', color: 'inherit' } : { backgroundColor: '#f3f4f6', color: '#9ca3af' };
      }
    },
    { field: 'occupants', headerName: 'Osoby', editable: true, type: 'numericColumn', width: 90 },
    {
      field: 'calculatedVolume',
      headerName: 'Nawiew [m³/h]',
      editable: false,
      cellStyle: { backgroundColor: '#e0f2fe', fontWeight: 'bold' } as any,
      width: 120
    },
    { 
      field: 'systemSupplyId', 
      headerName: 'System N', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: supplySystems
      },
      minWidth: 100 
    },
    {
      field: 'calculatedExhaust',
      headerName: 'Wywiew [m³/h]',
      editable: false,
      cellStyle: { backgroundColor: '#fee2e2', fontWeight: 'bold' } as any,
      width: 120
    },
    { 
      field: 'systemExhaustId', 
      headerName: 'System W', 
      editable: true, 
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: exhaustSystems
      },
      minWidth: 100 
    },
    { field: 'transferInSum', headerName: 'Dopływ IN', editable: false, width: 100 },
    { field: 'transferOutSum', headerName: 'Odpływ OUT', editable: false, width: 100 },
    {
      field: 'netBalance',
      headerName: 'Bilans netto',
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
      headerName: 'Krotność rzecz. [1/h]',
      editable: false,
      cellStyle: { backgroundColor: '#f3f4f6', fontWeight: 'bold' } as any,
      width: 140,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00'
    },
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
    { field: 'normativeVolume', headerName: 'V. norm [m³/h]', editable: true, type: 'numericColumn', width: 110 },
    { field: 'normativeExhaust', headerName: 'V. wyw norm', editable: true, type: 'numericColumn', width: 110 },
    {
      field: 'isTargetACHManual',
      headerName: 'Manual ACH',
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      width: 110
    },
    { 
      headerName: 'Akcje', 
      colId: 'delete', 
      width: 90, 
      pinned: 'right', 
      editable: false, 
      sortable: false, 
      filter: false,
      cellRenderer: () => {
         return <button className="pointer-events-none text-red-600 font-bold bg-white px-2 py-0.5 rounded border border-red-200 shadow-sm text-xs">Usuń 🗑️</button>
      }
    }
  ], [supplySystems, exhaustSystems]);

  const handleCellValueChanged = useCallback((event: any) => {
    const { data, colDef, newValue } = event;
    if (!data || !colDef) return;
    
    const update: any = {};
    const field = colDef.field as keyof ZoneData;
    
    // Rzutowanie na Number jeśli kolumna jest numeryczna
    if (colDef.type === 'numericColumn' || typeof (data as any)[field] === 'number') {
      let parsed = Number(newValue);
      if (typeof newValue === 'string') {
        parsed = Number(newValue.replace(',', '.'));
      }
      update[field] = isNaN(parsed) ? 0 : parsed;
    } else {
      update[field] = newValue;
    }
    
    // Specjalna logika dla zmiany typu pomieszczenia - aktualizacja presetów
    if (field === 'activityType') {
      const preset = ROOM_PRESETS[newValue as ActivityType];
      if (preset) {
        if (!data.isTargetACHManual) {
          update.targetACH = preset.ach;
        }
        if (!data.isMaxDbAManual) {
          update.maxAllowedDbA = preset.maxDbA;
        }
      }
    }
    
    updateZone(data.id, update);
  }, [updateZone]);

  const onSelectionChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      const ids = selectedNodes.map(node => node.data?.id).filter(Boolean);
      setSelectedIds(ids);
    }
  }, []);

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Czy na pewno usunąć zaznaczone pomieszczenia (${selectedIds.length})?`)) {
      bulkDeleteZones(selectedIds);
      setSelectedIds([]);
    }
  };

  const getRowStyle = (params: any) => {
    if (!isSystemColoringEnabled || !params.data) return undefined;
    const { color } = resolveZoneStyle(params.data, systems, globalSystemOpacity);
    if (!color) return undefined;
    return { backgroundColor: color };
  };

  const getRowClass = (params: any) => {
    if (!isSystemColoringEnabled || !params.data) return undefined;
    const { patternId } = resolveZoneStyle(params.data, systems, globalSystemOpacity);
    return patternId || undefined;
  };

  // Wymuszenie odświeżenia wierszy po zmianie ustawień wizualnych
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows();
    }
  }, [isSystemColoringEnabled, globalSystemOpacity, systems]);


  // Pomocnicza funkcja do zapisu szerokości kolumn (zapobieganie resetowaniu)
  // Używamy dębounca, aby nie zapychać synchronizacji podczas przeciągania
  const debouncedSaveState = useRef(
    customDebounce((api: any) => {
      if (isApplyingStateRef.current) return;
      
      const state = api.getColumnState();
      const stateStr = JSON.stringify(state);
      
      if (stateStr === lastAppliedStateRef.current) return;
      
      console.log('Saving column state to store (debounced)...');
      lastAppliedStateRef.current = stateStr; // Update local ref to avoid immediate re-application
      setColumnState(state);
    }, 1000)
  ).current;

  const onColumnResized = useCallback((params: any) => {
    // Zapisujemy tylko po zakończeniu przesuwania (finished)
    if (params.finished) {
      debouncedSaveState(params.api);
    }
  }, [debouncedSaveState]);

  const onColumnVisible = useCallback((params: any) => {
    debouncedSaveState(params.api);
  }, [debouncedSaveState]);

  const onColumnMoved = useCallback((params: any) => {
    // Zapisujemy tylko po zakończeniu przesuwania (finished)
    if (params.finished) {
      debouncedSaveState(params.api);
    }
  }, [debouncedSaveState]);

  const onGridReady = useCallback((params: any) => {
    if (columnState) {
      isApplyingStateRef.current = true;
      lastAppliedStateRef.current = JSON.stringify(columnState);
      params.api.applyColumnState({ state: columnState, applyOrder: true });
      setTimeout(() => { isApplyingStateRef.current = false; }, 500);
    } else {
      params.api.sizeColumnsToFit();
    }
    lastProjectRef.current = activeProjectId || null;
  }, [columnState, activeProjectId]);

  // Re-apply column state if it changes from outside (e.g. sync/load)
  useEffect(() => {
    if (!gridRef.current?.api || !columnState) return;

    const isNewProject = activeProjectId !== lastProjectRef.current;
    const stateStr = JSON.stringify(columnState);
    const isDifferentState = stateStr !== lastAppliedStateRef.current;

    // Aplikujemy tylko jeśli to nowy projekt lub stan faktycznie się zmienił (np. F5)
    // i NIE jesteśmy w trakcie własnej aplikacji
    if (isNewProject || isDifferentState) {
      if (!isApplyingStateRef.current) {
        console.log('External column state sync detected, applying to grid...');
        isApplyingStateRef.current = true;
        lastAppliedStateRef.current = stateStr;
        gridRef.current.api.applyColumnState({ state: columnState, applyOrder: true });
        // Dajemy więcej czasu na uspokojenie zdarzeń
        setTimeout(() => { isApplyingStateRef.current = false; }, 500);
      }
      lastProjectRef.current = activeProjectId || null;
    }
  }, [columnState, activeProjectId]);

  const handleAutosize = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.sizeColumnsToFit();
      debouncedSaveState(gridRef.current.api);
    }
  };

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
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
      activityType: 'CUSTOM',
      calculationMode: 'AUTO_MAX',
      systemSupplyId: 'N1',
      systemExhaustId: 'W1',
      area: 15,
      height: 3,
      isAreaLinkedToGeometry: false,
      occupants: 2,
      dosePerOccupant: 30,
      isTargetACHManual: false,
      manualTargetACH: null,
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
      isMaxDbAManual: false,
      manualMaxAllowedDbA: null,
      transferIn: [],
      transferOut: [],
      calculatedVolume: 0,
      calculatedExhaust: 0,
      transferInSum: 0,
      transferOutSum: 0,
      netBalance: 0,
      realACH: 0,
      floorId: activeFloorId === '__all__' ? 'floor-parter' : activeFloorId,
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
        activityType: 'CUSTOM',
        calculationMode: 'AUTO_MAX',
        systemSupplyId: 'N1',
        systemExhaustId: 'W1',
        area,
        height,
        isAreaLinkedToGeometry: false,
        occupants: 0,
        dosePerOccupant: 30,
        isTargetACHManual: false,
        manualTargetACH: null,
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
        isMaxDbAManual: false,
        manualMaxAllowedDbA: null,
        transferIn: [],
        transferOut: [],
        calculatedVolume: 0,
        calculatedExhaust: 0,
        transferInSum: 0,
        transferOutSum: 0,
        netBalance: 0,
        realACH: 0,
        floorId: activeFloorId === '__all__' ? 'floor-parter' : activeFloorId,
      });
    });
    
    setIsCsvModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <FloorManagerBar />
      <div className="flex flex-col flex-1 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Air Balance (Krok 1.5)</h2>
        <div className="flex gap-2">
          {selectedIds.length > 1 && (
            <>
              <button 
                onClick={() => setIsBulkEditOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
              >
                ✏️ Edytuj zaznaczone ({selectedIds.length})
              </button>
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
              >
                🗑️ Usuń zaznaczone ({selectedIds.length})
              </button>
            </>
          )}

          <label className="flex items-center gap-2 mr-2 bg-gray-100 px-3 py-2 rounded-md border border-gray-300 shadow-sm cursor-pointer hover:bg-gray-200 transition-colors">
            <input 
              type="checkbox" 
              checked={isSystemColoringEnabled} 
              onChange={(e) => setIsSystemColoringEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-gray-700">Widok Systemowy</span>
          </label>

          <button 
            onClick={handleAutosize}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md border border-gray-300 shadow-sm text-sm font-medium transition-colors flex items-center gap-1.5"
            title="Dopasuj szerokość kolumn do okna"
          >
            ↔️ Autosize
          </button>

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
            onClick={() => setIsSystemModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            ⚙️ Systemy
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
          ref={gridRef}
          theme={themeQuartz}
          getRowId={(params) => params.data.id}
          rowData={rowData}
          columnDefs={columnDefs}
          context={{ removeZone }}
          onCellValueChanged={handleCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          getRowStyle={getRowStyle}
          getRowClass={getRowClass}
          onColumnResized={onColumnResized}
          onColumnMoved={onColumnMoved}
          onColumnVisible={onColumnVisible}
          onDisplayedColumnsChanged={onColumnMoved}
          onGridReady={onGridReady}
          animateRows={true}
          sideBar={'columns'}
          rowSelection={{
            mode: 'multiRow',
            headerCheckbox: true,
            checkboxes: true,
          }}
          suppressRowClickSelection={true}
          headerHeight={48}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            onCellClicked: (params: any) => {
              if (params.column.colId === 'delete') {
                if (params.data && window.confirm(`Czy na pewno usunąć strefę ${params.data.nr} - ${params.data.name}?`)) {
                  removeZone(params.data.id);
                }
                return;
              }
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

      <SystemManagerModal 
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
      />

      <CsvMappingModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleCsvImport}
        csvData={csvRawData}
        headers={csvHeaders}
      />
      
      <BulkEditModal 
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedIds={selectedIds}
      />
      </div>
    </div>
  );
}
