import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ZoneData, Floor } from '../types';
import type { ColumnState } from 'ag-grid-community';

type ExportOptions = {
  format: 'PDF' | 'XLSX';
  scope: 'ALL_FLOORS' | 'ACTIVE_FLOOR';
  includeBalanceTable: boolean;
  includeRoomCards: boolean;
  fontFamily: 'helvetica' | 'times' | 'courier';
  fontSize: number;
  columnProfileName?: string;
  columnState?: ColumnState[];
};

export async function exportData(
  options: ExportOptions, 
  zones: Record<string, ZoneData>, 
  floors: Record<string, Floor>, 
  activeFloorId: string
) {
  // 1. Prepare data
  const zonesArray = Object.values(zones);
  const filteredZones = options.scope === 'ACTIVE_FLOOR' && activeFloorId !== '__all__' 
    ? zonesArray.filter(z => z.floorId === activeFloorId) 
    : zonesArray;
  
  // Create mapping array from specific column state
  const allAvailableColumns = [
    { id: 'floorId', header: 'Kondygnacja', val: (z: ZoneData) => floors[z.floorId]?.name || z.floorId },
    { id: 'nr', header: 'Nr', val: (z: ZoneData) => z.nr },
    { id: 'name', header: 'Nazwa', val: (z: ZoneData) => z.name },
    { id: 'activityType', header: 'Typ pomieszczenia', val: (z: ZoneData) => z.activityType },
    { id: 'area', header: 'Pow. [m²]', val: (z: ZoneData) => (typeof z.area === 'number' ? z.area.toFixed(2) : z.area) },
    { id: 'height', header: 'H [m]', val: (z: ZoneData) => z.height },
    { id: 'volume', header: 'V [m³]', val: (z: ZoneData) => (z.manualVolume ?? (z.area * z.height)).toFixed(1) },
    { id: 'occupants', header: 'Osoby', val: (z: ZoneData) => z.occupants },
    { id: 'targetACH', header: 'Zadane [1/h]', val: (z: ZoneData) => (z.isTargetACHManual ? z.manualTargetACH : z.targetACH) },
    { id: 'normativeVolume', header: 'Norma nawiew [m³/h]', val: (z: ZoneData) => z.normativeVolume },
    { id: 'calculatedVolume', header: 'Oblicz. nawiew [m³/h]', val: (z: ZoneData) => z.calculatedVolume },
    { id: 'normativeExhaust', header: 'Norma wywiew [m³/h]', val: (z: ZoneData) => z.normativeExhaust },
    { id: 'calculatedExhaust', header: 'Oblicz. wywiew [m³/h]', val: (z: ZoneData) => z.calculatedExhaust },
    { id: 'netBalance', header: 'Bilans [m³/h]', val: (z: ZoneData) => z.netBalance },
    { id: 'realACH', header: 'Rzecz. [1/h]', val: (z: ZoneData) => (z.realACH ?? 0).toFixed(2) },
    { id: 'systemSupplyId', header: 'Sys. N', val: (z: ZoneData) => z.systemSupplyId },
    { id: 'systemExhaustId', header: 'Sys. W', val: (z: ZoneData) => z.systemExhaustId },
  ];

  let displayColumns = allAvailableColumns;

  // Filter and sort by column state if present
  if (options.columnState) {
    displayColumns = [];
    for (const cs of options.columnState) {
      if (!cs.hide) {
        const found = allAvailableColumns.find(c => c.id === cs.colId);
        if (found) displayColumns.push(found);
      }
    }
    // If empty (e.g., loaded faulty profile), revert to all
    if (displayColumns.length === 0) displayColumns = allAvailableColumns;
  }

  const tableHeaders = displayColumns.map(c => c.header);
  const tableData = filteredZones.map(z => displayColumns.map(c => {
    const v = c.val(z);
    return v === undefined || v === null ? '' : String(v);
  }));

  // === EXPORT LOGIC ===
  if (options.format === 'PDF') {
    // Generate PDF (A3 Landscape is best for large tables)
    const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
    doc.setFont(options.fontFamily);
    
    if (options.includeBalanceTable) {
      doc.setFontSize(16);
      doc.text("Tabela Bilansu Powietrza", 14, 20);
      
      const subText = options.scope === 'ALL_FLOORS' ? "Cały Projekt" : `Kondygnacja: ${floors[activeFloorId]?.name || activeFloorId}`;
      doc.setFontSize(10);
      doc.text(subText, 14, 26);
      
      autoTable(doc, {
        startY: 32,
        head: [tableHeaders],
        body: tableData,
        styles: {
          font: options.fontFamily,
          fontSize: options.fontSize,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [63, 81, 181], // Indigo
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
    }

    if (options.includeRoomCards) {
      // Room cards logic (Start a new page if table exists)
      if (options.includeBalanceTable) {
        doc.addPage();
      }
      
      let yOffset = 20;
      doc.setFontSize(16);
      doc.text("Karty Pomieszczeń", 14, yOffset);
      yOffset += 10;
      doc.setFontSize(10);
      
      for (const z of filteredZones) {
        // Draw card per room
        if (yOffset > doc.internal.pageSize.height - 60) {
          doc.addPage();
          yOffset = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont(options.fontFamily, 'bold');
        doc.text(`[${z.nr}] ${z.name}`, 14, yOffset);
        yOffset += 6;
        
        doc.setFontSize(options.fontSize);
        doc.setFont(options.fontFamily, 'normal');
        
        doc.text(`Typ: ${z.activityType}    Osoby: ${z.occupants}`, 14, yOffset);
        yOffset += 5;
        doc.text(`Powierzchnia: ${z.area.toFixed(2)} m²    Krotność Rzecz.: ${(z.realACH || 0).toFixed(2)} [1/h]`, 14, yOffset);
        yOffset += 5;
        doc.text(`Obliczeniowy Nawiew: ${z.calculatedVolume} m³/h    Obliczeniowy Wywiew: ${z.calculatedExhaust} m³/h`, 14, yOffset);
        yOffset += 15;
      }
    }

    doc.save('Bilans_Wentylacji.pdf');
  } 
  else if (options.format === 'XLSX') {
    // Generate Excel File
    const wb = XLSX.utils.book_new();

    if (options.includeBalanceTable) {
      // Create worksheet
      const ws_data = [ tableHeaders, ...tableData ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "Tabela Bilansu");
    }

    if (options.includeRoomCards) {
      // Create a flat list of room properties for Excel
      const roomCardsData = filteredZones.map(z => ({
        "Numer": z.nr,
        "Nazwa": z.name,
        "Typ Pomieszczenia": z.activityType,
        "Powierzchnia [m2]": z.area,
        "Doprowadzono Nawiew [m3/h]": z.calculatedVolume,
        "Odprowadzono Wywiew [m3/h]": z.calculatedExhaust,
        "Rzeczywista Krotność [1/h]": z.realACH,
      }));
      const ws2 = XLSX.utils.json_to_sheet(roomCardsData);
      XLSX.utils.book_append_sheet(wb, ws2, "Karty Pomieszczeń");
    }

    XLSX.writeFile(wb, 'Bilans_Wentylacji.xlsx');
  }
}
