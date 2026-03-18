import { DxfWriter, point3d, point2d, Colors, HatchPredefinedPatterns, HatchBoundaryPaths, HatchPolylineBoundary, vertex } from "@tarikjabiri/dxf";
import type { ZoneData } from "../types";
import type { FloorCanvasState, Point } from "../stores/useCanvasStore";

interface ExportFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isValidNumber(val: number): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

function safeToFixed(val: number, decimals: number = 2): number {
  if (!isValidNumber(val)) return 0;
  const mult = Math.pow(10, decimals);
  return Math.round(val * mult) / mult;
}

function isPolygonInFrame(points: number[], frame: ExportFrame): boolean {
  for (let i = 0; i < points.length; i += 2) {
    const px = points[i];
    const py = points[i + 1];
    if (
      isValidNumber(px) && isValidNumber(py) &&
      px >= frame.x &&
      px <= frame.x + frame.width &&
      py >= frame.y &&
      py <= frame.y + frame.height
    ) {
      return true;
    }
  }
  return false;
}

function isPointInFrame(x: number, y: number, frame: ExportFrame): boolean {
  return (
    isValidNumber(x) && isValidNumber(y) &&
    x >= frame.x &&
    x <= frame.x + frame.width &&
    y >= frame.y &&
    y <= frame.y + frame.height
  );
}

export function exportToDXF(
  floorState: FloorCanvasState,
  zones: Record<string, ZoneData>,
  getTagText: (zoneId: string) => { col1: string; col2: string },
  exportFrame?: ExportFrame
) {
  const dxf = new DxfWriter();
  
  // Deklaracja warstw NA POCZĄTKU - przed jakimkolwiek rysowaniem
  dxf.addLayer("WENTCAD_PUNKT_ZERO", Colors.White);
  dxf.addLayer("WENTCAD_OBRYSY", Colors.Blue);
  dxf.addLayer("WENTCAD_WYPELNIENIA", Colors.Cyan);
  dxf.addLayer("WENTCAD_METKI_RAMKI", Colors.Yellow);
  dxf.addLayer("WENTCAD_METKI_TEKST", Colors.White);
  dxf.addLayer("WENTCAD_KADRY", Colors.Green);

  const origin = floorState.referenceOrigin || { x: 0, y: 0 };
  const scale = floorState.scaleFactor || 1;

  const frameOffset = exportFrame
    ? { x: exportFrame.x, y: exportFrame.y }
    : { x: 0, y: 0 };

  const toCAD = (p: Point) => {
    if (!isValidNumber(p.x) || !isValidNumber(p.y)) {
      return { x: 0, y: 0 };
    }
    return {
      x: safeToFixed((p.x - origin.x - frameOffset.x) * scale, 4),
      y: safeToFixed(-(p.y - origin.y - frameOffset.y) * scale, 4)
    };
  };

  // Punkt zero (0,0) - tylko gdy nie ma kadrowania
  if (!exportFrame && origin.x === 0 && origin.y === 0) {
    dxf.addLine(point3d(-0.5, 0), point3d(0.5, 0), { layerName: "WENTCAD_PUNKT_ZERO" });
    dxf.addLine(point3d(0, -0.5), point3d(0, 0.5), { layerName: "WENTCAD_PUNKT_ZERO" });
    dxf.addCircle(point3d(0, 0), 0.2, { layerName: "WENTCAD_PUNKT_ZERO" });
  }

  // Rysuj ramkę kadrowania jeśli jest aktywna
  if (exportFrame) {
    const p1 = toCAD({ x: exportFrame.x, y: exportFrame.y });
    const p2 = toCAD({ x: exportFrame.x + exportFrame.width, y: exportFrame.y });
    const p3 = toCAD({ x: exportFrame.x + exportFrame.width, y: exportFrame.y + exportFrame.height });
    const p4 = toCAD({ x: exportFrame.x, y: exportFrame.y + exportFrame.height });
    
    if (isValidNumber(p1.x) && isValidNumber(p1.y)) {
      dxf.addLWPolyline([
        { point: point2d(p1.x, p1.y) },
        { point: point2d(p2.x, p2.y) },
        { point: point2d(p3.x, p3.y) },
        { point: point2d(p4.x, p4.y) }
      ], {
        layerName: "WENTCAD_KADRY",
        flags: 1
      });
    }
  }

  const floorPolygons = floorState.polygons || [];
  
  floorPolygons.forEach(poly => {
    if (exportFrame && !isPolygonInFrame(poly.points, exportFrame)) {
      return;
    }

    const zone = zones[poly.zoneId];
    if (!zone) return;

    // Budowanie tablicy punktów CAD z walidacją
    const cadPoints: { x: number, y: number }[] = [];
    for (let i = 0; i < poly.points.length; i += 2) {
      const px = poly.points[i];
      const py = poly.points[i + 1];
      if (isValidNumber(px) && isValidNumber(py)) {
        cadPoints.push(toCAD({ x: px, y: py }));
      }
    }

    // Pomijamy poligony z mniej niż 3 punktami
    if (cadPoints.length < 3) return;

    // Walidacja wszystkich punktów przed dodaniem do DXF
    const validPoints = cadPoints.filter(p => isValidNumber(p.x) && isValidNumber(p.y));
    if (validPoints.length < 3) return;

    // Rysowanie obrysu
    dxf.addLWPolyline(validPoints.map(p => ({ point: point2d(p.x, p.y) })), {
      layerName: "WENTCAD_OBRYSY",
      flags: 1
    });

    // Wypełnienie (Hatch)
    const boundary = new HatchPolylineBoundary();
    validPoints.forEach(p => boundary.add(vertex(p.x, p.y)));
    
    const paths = new HatchBoundaryPaths();
    paths.addPolylineBoundary(boundary);

    try {
      dxf.addHatch(paths, { name: HatchPredefinedPatterns.SOLID }, {
        layerName: "WENTCAD_WYPELNIENIA",
        colorNumber: 7
      });
    } catch {
      // Hatch może się nie udać dla niektórych poligonów - pomijamy cicho
      console.warn('Hatch failed for zone:', zone.id);
    }

    // Metki
    const tagPosPx = zone.tagPosition || calculateCentroid(poly.points);
    
    if (exportFrame && !isPointInFrame(tagPosPx.x, tagPosPx.y, exportFrame)) {
      return;
    }

    const tagPosCAD = toCAD(tagPosPx);
    if (!isValidNumber(tagPosCAD.x) || !isValidNumber(tagPosCAD.y)) return;

    const tagText = getTagText(zone.id);

    if (tagText.col1 || tagText.col2) {
      const fullText = `${tagText.col1}${tagText.col1 && tagText.col2 ? "\\n" : ""}${tagText.col2}`;
      const textHeight = 0.2; 
      
      try {
        dxf.addMText(point3d(tagPosCAD.x, tagPosCAD.y), textHeight, fullText, {
          layerName: "WENTCAD_METKI_TEKST",
          attachmentPoint: 5
        });

        const frameWidth = 1.5;
        const frameHeight = 0.8;
        dxf.addRectangle(
          point2d(tagPosCAD.x - frameWidth / 2, tagPosCAD.y + frameHeight / 2),
          point2d(tagPosCAD.x + frameWidth / 2, tagPosCAD.y - frameHeight / 2),
          { layerName: "WENTCAD_METKI_RAMKI" }
        );
      } catch {
        console.warn('Tag failed for zone:', zone.id);
      }
    }
  });

  // Generuj string z pliku DXF
  const result = dxf.stringify();
  
  // Weryfikacja - plik musi kończyć się "0\nEOF\n"
  if (!result.trim().endsWith('EOF')) {
    console.warn('DXF generation may be incomplete');
  }
  
  return result;
}

function calculateCentroid(points: number[]): Point {
  let x = 0, y = 0;
  for (let i = 0; i < points.length; i += 2) {
    x += points[i];
    y += points[i + 1];
  }
  const count = points.length / 2;
  return { x: x / count, y: y / count };
}

export function downloadDXF(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.toLowerCase().endsWith(".dxf") ? filename : `${filename}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
