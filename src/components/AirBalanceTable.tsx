import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule, ValidationModule, RowSelectionModule } from 'ag-grid-community';
import { useZoneStore } from '../stores/useZoneStore';
import type { ZoneData } from '../types';
import type { ColDef } from 'ag-grid-community';

// Ostatnio w v32 nalezy zarejestrowac moduly explicitly 
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule, RowSelectionModule]);

// Importowanie stylów CSS z zewnątrz jest już w App/index ale ag-grid wymaga swoich motywów:
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export function AirBalanceTable() {
  const zones = useZoneStore((state) => state.zones);
  const addZone = useZoneStore((state) => state.addZone);
  const updateZone = useZoneStore((state) => state.updateZone);
  const setSelectedZone = useZoneStore((state) => state.setSelectedZone);

  const rowData = useMemo(() => Object.values(zones), [zones]);

  const columnDefs = useMemo<ColDef<ZoneData>[]>(() => [
    { field: 'name', headerName: 'Nazwa', editable: true, flex: 1 },
    { field: 'area', headerName: 'Powierzchnia [m²]', editable: true, type: 'numericColumn' },
    { field: 'height', headerName: 'Wysokość [m]', editable: true, type: 'numericColumn' },
    { field: 'occupants', headerName: 'Osoby', editable: true, type: 'numericColumn' },
    { field: 'dosePerOccupant', headerName: 'Dawka/os [m³/h]', editable: true, type: 'numericColumn' },
    { field: 'totalHeatGain', headerName: 'Zyski Ciepła [W]', editable: true, type: 'numericColumn' },
    {
      field: 'calculatedVolume',
      headerName: 'V_final [m³/h]',
      editable: false,
      cellStyle: { backgroundColor: '#f3f4f6', fontWeight: 'bold' } as any
    },
    {
      field: 'realACH',
      headerName: 'Real ACH [1/h]',
      editable: false,
      cellStyle: { backgroundColor: '#f3f4f6' } as any
    }
  ], []);

  const handleCellValueChanged = useCallback((event: any) => {
    const { data, colDef, newValue } = event;
    if (!data || !colDef) return;
    
    const update: any = {};
    const field = colDef.field as keyof ZoneData;
    
    // Rzutowanie na Number jeśli kolumna jest numeryczna
    if (colDef.type === 'numericColumn' || typeof (data as any)[field] === 'number') {
      update[field] = Number(newValue) || 0;
    } else {
      update[field] = newValue;
    }
    
    updateZone(data.id, update);
  }, [updateZone]);

  const handleSelectionChanged = useCallback((event: any) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      setSelectedZone(selectedRows[0].id);
    } else {
      setSelectedZone(null);
    }
  }, [setSelectedZone]);

  const handleAddRow = () => {
    const newId = `zone-${Date.now()}`;
    addZone({
      id: newId,
      name: `Nowy Pokój`,
      activityType: 'OFFICE',
      area: 15,
      height: 3,
      isAreaLinkedToGeometry: false,
      occupants: 2,
      dosePerOccupant: 30,
      targetACH: 0,
      normativeVolume: 0,
      totalHeatGain: 0,
      roomTemp: 24,
      roomRH: 50,
      supplyTemp: 16,
      supplyRH: 80,
      acousticAbsorption: 'MEDIUM',
      maxAllowedDbA: 35,
      calculatedVolume: 0,
      realACH: 0
    });
  };

  return (
    <div className="flex flex-col h-full w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Air Balance (Krok 1)</h2>
        <button 
          onClick={handleAddRow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
        >
          + Dodaj Strefę
        </button>
      </div>
      
      <div className="ag-theme-alpine w-full flex-1 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          rowSelection="single"
          onSelectionChanged={handleSelectionChanged}
          onCellValueChanged={handleCellValueChanged}
          animateRows={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
        />
      </div>
    </div>
  );
}
