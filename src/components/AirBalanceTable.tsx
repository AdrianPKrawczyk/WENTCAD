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
import { Wand2, Link, Box, X as XIcon } from 'lucide-react';
import { parseDxfFile } from '../lib/dxfUtils';
import { extractAndTransformPolygons } from '../lib/syncEngine';
import { SyncAlignmentModal } from './SyncAlignmentModal';
import { SyncSettingsModal } from './SyncSettingsModal';
import { DxfOutlinesModal } from './DxfOutlinesModal';
import { useCanvasStore } from '../stores/useCanvasStore';
import { calculatePolygonArea } from '../lib/geometryUtils';
import { toast } from 'sonner';
import { SavedFiltersToolPanel } from './SavedFiltersToolPanel';
import { useSettingsStore } from '../stores/useSettingsStore';

import { extractWattTopology } from '../lib/dxfWattExtractor';

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
  const clearZoneGeometry = useZoneStore((state) => state.clearZoneGeometry);
  const isSystemColoringEnabled = useZoneStore((s) => s.isSystemColoringEnabled);
  const setIsSystemColoringEnabled = useZoneStore((s) => s.setIsSystemColoringEnabled);
  const globalSystemOpacity = useZoneStore((s) => s.globalSystemOpacity);
  const activeProjectId = useProjectStore((s) => s.activeProject?.id);
  const columnState = useZoneStore((s) => s.columnState);
  const setColumnState = useZoneStore((s) => s.setColumnState);
  const checkedZoneIds = useZoneStore((state) => state.checkedZoneIds);
  const setCheckedZoneIds = useZoneStore((state) => state.setCheckedZoneIds);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const lastProjectRef = useRef<string | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const syncFileInputRef = useRef<HTMLInputElement>(null);

  // Smart Sync State
  const [syncDxfData, setSyncDxfData] = useState<any>(null);
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [isSyncAlignmentOpen, setIsSyncAlignmentOpen] = useState(false);
  const [selectedSyncLayer, setSelectedSyncLayer] = useState<string>('');
  const [syncMultiplier, setSyncMultiplier] = useState<number>(1);
  const [isOutlinesModalOpen, setOutlinesModalOpen] = useState(false);
  const [pendingDxfFile, setPendingDxfFile] = useState<File | null>(null);
  const [pendingDxfLayers, setPendingDxfLayers] = useState<string[]>([]);
  
  const activeFloor = useZoneStore((state) => state.floors[state.activeFloorId]);
  const dxfOutlinesCount = activeFloor?.dxfOutlines?.length || 0;

  const linkingZoneId = useZoneStore((s) => s.linkingZoneId);
  const setLinkingZoneId = useZoneStore((s) => s.setLinkingZoneId);

  // Canvas Store for Alignment Modal
  const canvasFloors = useCanvasStore((s) => s.floors);
  const activeCanvasFloor = canvasFloors[activeFloorId];
  const underlayUrl = activeCanvasFloor?.underlayUrl || null;

  const rowData = useMemo(() => {
    const allZones = Object.values(zones);
    const filtered = activeFloorId === '__all__' ? allZones : allZones.filter((z) => z.floorId === activeFloorId);
    // KRYTYCZNE: Klonujemy obiekty przed przekazaniem do AG Grid (Clone & Sync pattern),
    // aby grid mógł bezpiecznie mutować swoje kopie bez wpływu na historię Zustand/zundo.
    return filtered.map(z => ({ ...z }));
  }, [zones, activeFloorId]);

  const supplySystems = useMemo(() => ['Brak', ...systems.filter(s => s.type === 'SUPPLY').map(s => s.id)], [systems]);
  const exhaustSystems = useMemo(() => ['Brak', ...systems.filter(s => s.type === 'EXHAUST').map(s => s.id)], [systems]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    wrapHeaderText: true,
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
  }), [removeZone, setSelectedZone, updateZone]);

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
        values: [...Object.keys(ROOM_TYPE_ACH_MAPPING)]
      },
      minWidth: 200,
    },
    { 
      field: 'isAreaManual', 
      headerName: 'Manual Pow.', 
      editable: true, 
      width: 100,
      cellRenderer: 'agCheckboxCellRenderer',
      cellEditor: 'agCheckboxCellEditor',
    },
    {
      headerName: 'Obrys',
      field: 'geometryArea' as any,
      width: 80,
      cellRenderer: (params: any) => {
        return params.value !== null && params.value !== undefined ? '📐' : '✖️';
      },
      cellStyle: (params: any) => ({
        color: params.value ? '#3b82f6' : '#94a3b8',
        textAlign: 'center',
        fontSize: '16px'
      }),
      editable: false
    },
    { 
      field: 'area', 
      headerName: 'Pow. [m²]', 
      editable: (params) => !!params.data?.isAreaManual || params.data?.geometryArea === null, 
      type: 'numericColumn', 
      width: 120,
      valueFormatter: params => params.value ? parseFloat(params.value).toFixed(2) : '0.00',
      cellStyle: (params) => {
        if (params.data?.isAreaManual) {
          return { backgroundColor: '#fefcbf', color: '#744210', fontWeight: 'bold' };
        }
        if (!params.data?.isAreaManual && params.data?.geometryArea !== null) {
          return { backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' };
        }
        return null;
      }
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
    { field: 'transferInSum', headerName: 'Dopływ IN', width: 100 },
    { field: 'transferOutSum', headerName: 'Odpływ OUT', width: 100 },
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
    { field: 'normativeVolume', headerName: 'V. norm [m³/h]', width: 110 },
    { field: 'normativeExhaust', headerName: 'V. wyw norm', width: 110 },
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
      width: 100, 
      pinned: 'right', 
      editable: false, 
      sortable: false, 
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1 h-full">
            <button 
              title="Wyczyść geometrię (usuń rysunek)"
              className={`p-1 rounded hover:bg-orange-100 text-orange-600 transition-colors ${!params.data?.geometryArea ? 'opacity-20 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (params.data?.geometryArea && window.confirm("Czy na pewno usunąć tylko rysunek z rzutu?")) {
                  clearZoneGeometry(params.data.id);
                }
              }}
            >
              🧹
            </button>
            <button 
              title="Usuń pomieszczenie (całkowicie)"
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (params.data && window.confirm(`Czy usunąć pomieszczenie ${params.data.nr} - ${params.data.name} wraz z bilansami?`)) {
                  removeZone(params.data.id);
                }
              }}
            >
              🗑️
            </button>
        </div>
      )
    }
  ], [supplySystems, exhaustSystems]);
  
  const handleCellValueChanged = useCallback((event: any) => {
    const { data, colDef, newValue, oldValue } = event;
    if (!data || !colDef || newValue === oldValue) return;
    
    const update: any = {};
    const field = colDef.field as keyof ZoneData;
    
    // Rzutowanie na Number jeśli kolumna jest numeryczna lub typ w danych to number
    if (colDef.type === 'numericColumn' || typeof data[field] === 'number') {
      let parsed = Number(newValue);
      if (typeof newValue === 'string') {
        parsed = Number(newValue.replace(',', '.'));
      }
      const val = isNaN(parsed) ? 0 : parsed;
      
      // Enforce rounding to 2 decimal places for area-related fields
      if (field === 'area' || field === 'manualArea' || field === 'geometryArea') {
        update[field] = Math.round(val * 100) / 100;
        // If editing final area manually, also sync to manualArea
        if (field === 'area' && data.isAreaManual) {
          update.manualArea = update[field];
        }
      } else {
        update[field] = val;
      }
    } else {
      update[field] = newValue;
    }
    
    // Logika zależna dla activityType (presety)
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
      setCheckedZoneIds(ids);

      // Jeśli wybrano dokładnie jedno, to jest to nasz nowy focus
      if (ids.length === 1) {
        if (selectedZoneId !== ids[0]) {
          setSelectedZone(ids[0]);
        }
      } 
      // Podświetlenie wielu: jeśli nasz obecny focus NIE jest wśród zaznaczonych, 
      // a zaznaczono nowe elementy, ustawiamy focus na jeden z nich (ostatni).
      else if (ids.length > 1) {
        if (!ids.includes(selectedZoneId || '')) {
          setSelectedZone(ids[ids.length - 1]);
        }
      }
      // Jeśli nic nie wybrano, czyścimy focus
      else if (ids.length === 0) {
        if (selectedZoneId !== null) {
          setSelectedZone(null);
        }
      }
    }
  }, [setCheckedZoneIds, selectedZoneId, setSelectedZone]);

  const handleBulkDelete = () => {
    if (checkedZoneIds.length === 0) return;
    if (window.confirm(`Czy na pewno usunąć zaznaczone pomieszczenia (${checkedZoneIds.length})?`)) {
      bulkDeleteZones(checkedZoneIds);
      setCheckedZoneIds([]);
    }
  };

  const getRowStyle = (params: any): any => {
    if (params.data?.id === selectedZoneId) {
      return { backgroundColor: '#eef2ff', outline: '2px solid #4f46e5', outlineOffset: '-2px', zIndex: 10, fontWeight: 'bold' };
    }
    if (!isSystemColoringEnabled || !params.data) return undefined;
    const style = resolveZoneStyle(params.data, systems, globalSystemOpacity);
    if (!style.color) return undefined;
    return { backgroundColor: style.color };
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

  // Auto-scroll do wiersza i odświeżenie stylów
  useEffect(() => {
    if (gridRef.current?.api && selectedZoneId) {
      const node = gridRef.current.api.getRowNode(selectedZoneId);
      if (node) {
        gridRef.current.api.ensureNodeVisible(node);
        gridRef.current.api.redrawRows();
      }
    }
  }, [selectedZoneId]);

  // UX Fix: Synchronizacja zaznaczenia w tabeli ag-Grid z wybraną strefą
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      if (!selectedZoneId) {
        const selectedNodes = gridRef.current.api.getSelectedNodes();
        if (selectedNodes.length > 0) {
          gridRef.current.api.deselectAll();
        }
      } else {
        const node = gridRef.current.api.getRowNode(selectedZoneId);
        if (node && !node.isSelected()) {
          // Kliknięcie z zewnątrz (canvas/inspektor) czyści multi-zaznaczenie i focusuje na nowym
          gridRef.current.api.deselectAll();
          node.setSelected(true);
          gridRef.current.api.ensureNodeVisible(node);
        }
      }
    }
  }, [selectedZoneId]);


  // Pomocnicza funkcja do zapisu szerokości kolumn
  const debouncedSaveState = useRef(
    customDebounce((api: any) => {
      const state = api.getColumnState();
      console.log('Saving column state to store (debounced)...');
      setColumnState(state);
    }, 1000)
  ).current;

  const onColumnResized = useCallback((params: any) => {
    if (params.finished) {
      debouncedSaveState(params.api);
    }
  }, [debouncedSaveState]);

  const onColumnVisible = useCallback((params: any) => {
    debouncedSaveState(params.api);
  }, [debouncedSaveState]);

  const onColumnMoved = useCallback((params: any) => {
    if (params.finished) {
      debouncedSaveState(params.api);
    }
  }, [debouncedSaveState]);

  const onGridReady = useCallback((params: any) => {
    if (columnState) {
      console.log('Applying initial column state from store...');
      params.api.applyColumnState({ state: columnState, applyOrder: true });
    } else {
      // Pobieramy domyślny podgląd stanów (np. dla nowego projektu, który ma null)
      const { savedColumnProfiles, defaultProfileId } = useSettingsStore.getState();
      const defaultProfile = savedColumnProfiles.find(p => p.id === defaultProfileId);
      if (defaultProfile && defaultProfile.state) {
        console.log('Applying default column state from global settings...');
        params.api.applyColumnState({ state: defaultProfile.state, applyOrder: true });
        setColumnState(defaultProfile.state);
      }
    }
    lastProjectRef.current = activeProjectId || null;
  }, [columnState, activeProjectId, setColumnState]);

  // NIE używamy useEffect do wymuszania stanu columnState podczas sesji,
  // aby AG Grid mógł zarządzać swoim stanem wewnętrznym zgodnie z zaleceniami użytkownika.

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
      manualArea: 15,
      height: 3,
      geometryArea: null,
      isAreaManual: true,
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
      floorId: activeFloorId === '__all__' ? Object.keys(useZoneStore.getState().floors)[0] : activeFloorId,
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
        area: Math.round(area * 100) / 100,
        manualArea: Math.round(area * 100) / 100,
        height,
        geometryArea: null,
        isAreaManual: true,
        occupants: 1,
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
        floorId: activeFloorId === '__all__' ? Object.keys(useZoneStore.getState().floors)[0] : activeFloorId,
      });
    });
    
    setIsCsvModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const gridComponents = useMemo(() => ({
    savedFiltersToolPanel: SavedFiltersToolPanel,
  }), []);

  const sideBarConfig = useMemo(() => ({
     toolPanels: [
       {
         id: 'columns',
         labelDefault: 'Columns',
         labelKey: 'columns',
         iconKey: 'columns',
         toolPanel: 'agColumnsToolPanel',
       },
       {
         id: 'savedFilters',
         labelDefault: 'Szablony',
         labelKey: 'savedFilters',
         iconKey: 'filter',
         toolPanel: 'savedFiltersToolPanel',
       }
     ],
     defaultToolPanel: ''
  }), []);

  return (
    <div className="flex flex-col h-full w-full">
      <FloorManagerBar />
      <div className="flex flex-col flex-1 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Air Balance (Krok 1.5)</h2>
        </div>
        <div className="flex gap-2">
          {checkedZoneIds.length > 1 && (
            <>
              <button 
                onClick={() => setIsBulkEditOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
              >
                ✏️ Edytuj zaznaczone ({checkedZoneIds.length})
              </button>
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center gap-2"
              >
                🗑️ Usuń zaznaczone ({checkedZoneIds.length})
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
            📥 Importuj CSV
          </button>

          <input
            type="file"
            accept=".dxf"
            ref={syncFileInputRef}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              const reader = new FileReader();
              reader.onload = (ev) => {
                const content = ev.target?.result as string;
                const parsed = parseDxfFile(content);
                if (parsed) {
                  const layers = parsed.tables?.layer?.layers 
                    ? Object.keys(parsed.tables.layer.layers) 
                    : Array.from(new Set(parsed.entities.map((ent: any) => ent.layer)));
                  
                  setSyncDxfData(parsed);
                  setPendingDxfLayers(layers as string[]);
                  setPendingDxfFile(file);
                  setIsSyncSettingsOpen(true);
                } else {
                  toast.error("Błąd parsowania pliku DXF.");
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
          <button 
            onClick={() => syncFileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-lg shadow-indigo-500/20 text-sm font-bold transition-all flex items-center gap-2 group"
          >
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            ✨ Synchronizuj z CAD
          </button>

          {dxfOutlinesCount > 0 && (
            <button
              onClick={() => setOutlinesModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium border border-indigo-100 transition-colors animate-in fade-in slide-in-from-right-2"
              title="Pokaż listę obrysów wczytanych z pliku CAD"
            >
              <Box className="w-4 h-4" />
              Szuflada Obrysów ({dxfOutlinesCount})
            </button>
          )}

          <button
            onClick={() => {
              const targetId = checkedZoneIds.length === 1 ? checkedZoneIds[0] : selectedZoneId;
              if (!targetId) {
                toast.error("Wybierz dokładnie jeden wiersz, aby użyć narzędzia Połącz.");
                return;
              }
              setLinkingZoneId(targetId);
            }}
            disabled={!!linkingZoneId}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-bold transition-all flex items-center gap-2 ${
              linkingZoneId 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 hover:border-indigo-300'
            } ${(checkedZoneIds.length === 1 || selectedZoneId) ? '' : 'opacity-50'}`}
            title="Połącz zaznaczony wiersz z istniejącym obrysem na rzucie"
          >
            <Link className="w-4 h-4" />
            Połącz z rzutem
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

      {linkingZoneId && (
        <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 animate-pulse">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Tryb łączenia aktywny</p>
              <p className="text-xs text-amber-700">Kliknij obrys na rzucie 2D, aby przypisać go do pomieszczenia <span className="font-mono font-bold">"{zones[linkingZoneId]?.nr || '?'}"</span>.</p>
            </div>
          </div>
          <button 
            onClick={() => setLinkingZoneId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all"
          >
            <XIcon className="w-4 h-4" />
            Anuluj
          </button>
        </div>
      )}

      <div className="custom-ag-headers" style={{ height: '100%', width: '100%', flex: 1 }}>
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
          components={gridComponents}
          sideBar={sideBarConfig}
          rowSelection={{
            mode: 'multiRow',
            headerCheckbox: true,
            checkboxes: true,
          }}
          suppressRowClickSelection={true}
          headerHeight={80}
          defaultColDef={defaultColDef}
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
        selectedIds={checkedZoneIds}
      />

      <SyncSettingsModal 
        isOpen={isSyncSettingsOpen}
        fileName={pendingDxfFile?.name || ''}
        availableLayers={pendingDxfLayers}
        onCancel={() => {
          setIsSyncSettingsOpen(false);
          setPendingDxfFile(null);
        }}
        onConfirm={(settings) => {
          // Temporary save settings to use after alignment
          setSelectedSyncLayer(settings.zoneLayer);
          setSyncMultiplier(settings.multiplier);
          
          // Store WATT settings globally or pass them through state to use after alignment
          useCanvasStore.getState().setPendingWattSettings({
             footprintLayer: settings.footprintLayer,
             windowLayers: settings.windowLayers
          });

          setIsSyncSettingsOpen(false);
          setIsSyncAlignmentOpen(true);
        }}
      />

      <SyncAlignmentModal 
        isOpen={isSyncAlignmentOpen}
        dxfData={syncDxfData}
        selectedLayer={selectedSyncLayer}
        underlayUrl={underlayUrl}
        zones={Object.values(zones).filter(z => z.floorId === activeFloorId)}
        onCancel={() => setIsSyncAlignmentOpen(false)}
        onConfirm={(transformFn) => {
          setIsSyncAlignmentOpen(false);
          
          if (!syncDxfData || !selectedSyncLayer) return;

          // 1. OBRYSY POMIESZCZEŃ
          const extracted = extractAndTransformPolygons(syncDxfData, selectedSyncLayer, transformFn);
          if (extracted.length === 0) {
            toast.error(`Nie znaleziono zamkniętych polilinii na warstwie: ${selectedSyncLayer}`);
            return;
          }

          const currentCanvasFloor = useCanvasStore.getState().getFloorState(activeFloorId);
          const floorPolygons = currentCanvasFloor.polygons || [];
          
          let updatedPolygons = [...floorPolygons];
          const newDxfOutlines: { id: string, points: number[], area: number }[] = [];

          extracted.forEach((ext) => {
            // Overlap check
            const overlapping = floorPolygons.find(p => {
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              for (let i = 0; i < p.points.length; i += 2) {
                if (p.points[i] < minX) minX = p.points[i];
                if (p.points[i] > maxX) maxX = p.points[i];
                if (p.points[i+1] < minY) minY = p.points[i+1];
                if (p.points[i+1] > maxY) maxY = p.points[i+1];
              }
              return ext.centerX >= minX && ext.centerX <= maxX && ext.centerY >= minY && ext.centerY <= maxY;
            });

            if (overlapping) {
              // Update existing
              updatedPolygons = updatedPolygons.map(p => 
                p.id === overlapping.id ? { ...p, points: ext.points } : p
              );
              
              const area = calculatePolygonArea(ext.points) * (syncMultiplier ** 2);
              updateZone(overlapping.zoneId, { 
                geometryArea: area,
                isAreaManual: false 
              });
            } else {
              // Add to DXF drawer instead of creating zone
              newDxfOutlines.push({
                id: crypto.randomUUID(),
                points: ext.points,
                area: calculatePolygonArea(ext.points) * (syncMultiplier ** 2)
              });
            }
          });

          // Final update to floor state
          useCanvasStore.getState().updateFloorState(activeFloorId, {
            polygons: updatedPolygons,
            dxfOutlines: [...(currentCanvasFloor.dxfOutlines || []), ...newDxfOutlines]
          });

          // 2. WATT TOPOLOGY EXTRACTION (Opcjonalne)
          const wattSettings = useCanvasStore.getState().pendingWattSettings;
          if (wattSettings && (wattSettings.footprintLayer || (wattSettings.windowLayers && wattSettings.windowLayers.length > 0))) {
             const footprintLayers = wattSettings.footprintLayer ? [wattSettings.footprintLayer] : [];
             const windowLayers = wattSettings.windowLayers || [];
             
             const rawWattData = extractWattTopology(syncDxfData, footprintLayers, windowLayers);
             
             // Transform footprint
             const transformedFootprint = rawWattData.buildingFootprint.map(polygon => {
                return polygon.map(pt => {
                   const t = transformFn(pt.x, pt.y);
                   return { x: t.x, y: t.y };
                });
             });

             // Transform windows
             const transformedWindows = rawWattData.windows.map(win => {
                if (!win.centroid) return win;
                const tCenter = transformFn(win.centroid.x, win.centroid.y);
                // Adjust width by multiplier (scale to meters in our app if they were drawn in mm/cm)
                return {
                   ...win,
                   width: win.width * syncMultiplier,
                   centroid: { x: tCenter.x, y: tCenter.y }
                };
             });

             // Zapisz do głownego stanu projektu WATT
             useZoneStore.getState().setBuildingFootprint(transformedFootprint);
             
             // TODO: Windows should be stored temporarily and then assigned to boundaries in Topology Engine (Step 3).
             // For now we will keep them in memory or console log them, as the Topology engine will match them by coordinate.
             console.log("WATT Extracted Windows:", transformedWindows);

             useCanvasStore.getState().setPendingWattSettings(null); // Clear pending settings
          }

          toast.success(`Zakończono analizę CAD. Znaleziono i dodano do szuflady ${newDxfOutlines.length} nowych obrysów.`);
        }}
      />

      {isOutlinesModalOpen && (
        <DxfOutlinesModal 
          isOpen={isOutlinesModalOpen} 
          onClose={() => setOutlinesModalOpen(false)} 
        />
      )}
      </div>
    </div>
  );
}
