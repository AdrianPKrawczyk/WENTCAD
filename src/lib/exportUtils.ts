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
  includeSummaries: boolean;
  fontFamily: 'helvetica' | 'times' | 'courier' | 'roboto';
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
    
    if (options.fontFamily === 'roboto') {
      try {
        const [regResp, boldResp] = await Promise.all([
          fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf'),
          fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf')
        ]);
        
        const regBuffer = await regResp.arrayBuffer();
        const boldBuffer = await boldResp.arrayBuffer();
        
        const toBase64 = (buf: ArrayBuffer) => {
          let binary = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        };

        doc.addFileToVFS("Roboto-Regular.ttf", toBase64(regBuffer));
        doc.addFont("Roboto-Regular.ttf", "roboto", "normal");
        
        doc.addFileToVFS("Roboto-Medium.ttf", toBase64(boldBuffer));
        doc.addFont("Roboto-Medium.ttf", "roboto", "bold");
        
        doc.setFont("roboto");
      } catch (e) {
        console.error("Failed to load Roboto font, falling back to Helvetica", e);
        doc.setFont("helvetica");
      }
    } else {
      doc.setFont(options.fontFamily);
    }
    
    let currentY = 20;

    // --- ZESTAWIENIA (SUMMARIES) ---
    if (options.includeSummaries) {
      doc.setFontSize(20);
      doc.setFont(options.fontFamily, 'bold');
      doc.text("Podsumowanie Projektu", 14, currentY);
      currentY += 12;

      // 1. Zestawienie Globalne (Budynek)
      const totalArea = filteredZones.reduce((sum, z) => sum + (z.area || 0), 0);
      const totalVol = filteredZones.reduce((sum, z) => sum + (z.manualVolume ?? ((z.area||0)*(z.height||0))), 0);
      const totalSup = filteredZones.reduce((sum, z) => sum + (z.calculatedVolume || 0), 0);
      const totalExh = filteredZones.reduce((sum, z) => sum + (z.calculatedExhaust || 0), 0);

      doc.setFontSize(14);
      doc.text("1. Dane Ogólne", 14, currentY);
      currentY += 4;
      
      autoTable(doc, {
        startY: currentY,
        body: [
          ['Ilość Pomieszczeń:', String(filteredZones.length), 'Powierzchnia Całk.:', `${totalArea.toFixed(2)} m²`],
          ['Kubatura Całk.:', `${totalVol.toFixed(2)} m³`, 'Bilans Wymiany:', `${(totalSup - totalExh).toFixed(2)} m³/h`],
          ['Nawiew Całkowity:', `${totalSup.toFixed(2)} m³/h`, 'Wywiew Całkowity:', `${totalExh.toFixed(2)} m³/h`],
        ],
        theme: 'grid',
        styles: { font: options.fontFamily, fontSize: 11, cellPadding: 3, textColor: [40, 40, 40] },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 244, 250] }, 2: { fontStyle: 'bold', fillColor: [240, 244, 250] } },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12;

      // 2. Zestawienie na Kondygnacje
      const floorSummaries: Record<string, { name: string, area: number, sup: number, exh: number, count: number }> = {};
      filteredZones.forEach(z => {
        if (!floorSummaries[z.floorId]) floorSummaries[z.floorId] = { name: floors[z.floorId]?.name || z.floorId, area: 0, sup: 0, exh: 0, count: 0 };
        floorSummaries[z.floorId].area += (z.area || 0);
        floorSummaries[z.floorId].sup += (z.calculatedVolume || 0);
        floorSummaries[z.floorId].exh += (z.calculatedExhaust || 0);
        floorSummaries[z.floorId].count += 1;
      });

      doc.text("2. Zestawienie Kondygnacji", 14, currentY);
      currentY += 4;
      autoTable(doc, {
        startY: currentY,
        head: [['Kondygnacja', 'Ilość Pokoi', 'Powierzchnia [m²]', 'Suma Nawiewu [m³/h]', 'Suma Wywiewu [m³/h]']],
        body: Object.values(floorSummaries).map(f => [f.name, String(f.count), f.area.toFixed(2), f.sup.toFixed(2), f.exh.toFixed(2)]),
        theme: 'grid',
        styles: { font: options.fontFamily, fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 12;

      // 3. Zestawienie Maszyn (Obciążenie Systemów)
      const sysSummaries: Record<string, { type: 'Nawiew' | 'Wywiew', flow: number, rooms: number }> = {};
      filteredZones.forEach(z => {
        if (z.systemSupplyId && z.calculatedVolume > 0) {
          if (!sysSummaries[z.systemSupplyId]) sysSummaries[z.systemSupplyId] = { type: 'Nawiew', flow: 0, rooms: 0 };
          sysSummaries[z.systemSupplyId].flow += z.calculatedVolume;
          sysSummaries[z.systemSupplyId].rooms += 1;
        }
        if (z.systemExhaustId && z.calculatedExhaust > 0) {
          if (!sysSummaries[z.systemExhaustId]) sysSummaries[z.systemExhaustId] = { type: 'Wywiew', flow: 0, rooms: 0 };
          sysSummaries[z.systemExhaustId].flow += z.calculatedExhaust;
          sysSummaries[z.systemExhaustId].rooms += 1;
        }
      });

      if (Object.keys(sysSummaries).length > 0) {
        doc.text("3. Zapotrzebowanie i Klasyfikacja Systemów", 14, currentY);
        currentY += 4;
        autoTable(doc, {
          startY: currentY,
          head: [['Identyfikator Systemu', 'Funkcja', 'Obsługiwane Pokoje', 'Zapotrzebowanie Całkowite [m³/h]']],
          body: Object.entries(sysSummaries).map(([id, data]) => [id, data.type, String(data.rooms), data.flow.toFixed(2)]),
          theme: 'grid',
          styles: { font: options.fontFamily, fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: [15, 118, 110] }, // Teal
          margin: { left: 14 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }
    
    if (options.includeBalanceTable) {
      if (options.includeSummaries) doc.addPage();
      currentY = 20;

      doc.setFontSize(16);
      doc.setFont(options.fontFamily, 'bold');
      doc.text("Tabela Bilansu Powietrza", 14, currentY);
      
      const subText = options.scope === 'ALL_FLOORS' ? "Cały Projekt" : `Kondygnacja: ${floors[activeFloorId]?.name || activeFloorId}`;
      doc.setFontSize(10);
      doc.setFont(options.fontFamily, 'normal');
      doc.text(subText, 14, currentY + 6);
      
      autoTable(doc, {
        startY: currentY + 12,
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
      if (options.includeBalanceTable || options.includeSummaries) {
        doc.addPage();
      }
      
      currentY = 20;
      doc.setFontSize(18);
      doc.setFont(options.fontFamily, 'bold');
      doc.text("Karty Szczegółowe Pomieszczeń", 14, currentY);
      currentY += 12;
      
      for (const z of filteredZones) {
        // Oblicz czy karta (ok. 50px) zmieści się na stronie
        if (currentY > doc.internal.pageSize.height - 60) {
          doc.addPage();
          currentY = 20;
        }

        // Title of the room card
        doc.setFontSize(14);
        doc.setFont(options.fontFamily, 'bold');
        doc.text(`[${z.nr}] ${z.name}`, 14, currentY);
        currentY += 4;

        // AutoTable for Room Metadata
        const cardData = [
          ['Typ Pomieszczenia:', z.activityType, 'Liczba Osób:', String(z.occupants)],
          ['Powierzchnia:', `${z.area.toFixed(2)} m²`, 'Wysokość:', `${z.height.toFixed(2)} m`],
          ['Nawiew Obliczeniowy:', `${z.calculatedVolume} m³/h`, 'Wywiew Obliczeniowy:', `${z.calculatedExhaust} m³/h`],
          ['Zadana Krotność:', `${(z.isTargetACHManual ? z.manualTargetACH : z.targetACH)?.toFixed(2) || '-'} [1/h]`, 'Rzeczywista Krotność:', `${(z.realACH || 0).toFixed(2)} [1/h]`],
          ['System Nawiewu:', z.systemSupplyId || 'Brak', 'System Wywiewu:', z.systemExhaustId || 'Brak'],
        ];

        autoTable(doc, {
          startY: currentY,
          body: cardData,
          theme: 'grid',
          styles: {
            font: options.fontFamily,
            fontSize: options.fontSize,
            cellPadding: 3,
            textColor: [60, 60, 60],
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
            1: { cellWidth: 60 },
            2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
            3: { cellWidth: 60 }
          },
          margin: { left: 14 }
        });

        // @ts-ignore - autotable sets finalY on doc
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    doc.save('Bilans_Wentylacji.pdf');
  } 
  else if (options.format === 'XLSX') {
    // Generate Excel File
    const wb = XLSX.utils.book_new();

    if (options.includeSummaries) {
      // Globals
      const totalArea = filteredZones.reduce((sum, z) => sum + (z.area || 0), 0);
      const totalSup = filteredZones.reduce((sum, z) => sum + (z.calculatedVolume || 0), 0);
      const totalExh = filteredZones.reduce((sum, z) => sum + (z.calculatedExhaust || 0), 0);
      const ws_summ = XLSX.utils.aoa_to_sheet([
        ['Podsumowanie Projektu'],
        [],
        ['Ilość Pomieszczeń', filteredZones.length],
        ['Powierzchnia Całk. [m²]', totalArea.toFixed(2)],
        ['Nawiew Całk. [m³/h]', totalSup.toFixed(2)],
        ['Wywiew Całk. [m³/h]', totalExh.toFixed(2)],
      ]);
      XLSX.utils.book_append_sheet(wb, ws_summ, "Dane Ogólne");
    }

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
