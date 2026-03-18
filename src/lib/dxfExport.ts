import { DxfWriter, point3d } from "@tarikjabiri/dxf";
import type { ZoneData } from "../types";
import type { FloorCanvasState, Point } from "../stores/useCanvasStore";

interface ExportFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isValidNumber(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

function safeToFixed(val: number, decimals: number = 3): number {
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
): string {
  const dxf = new DxfWriter();
  
  dxf.addLayer("WENTCAD_OBRYSY", 5);
  dxf.addLayer("WENTCAD_KADRY", 3);

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
      x: safeToFixed((p.x - origin.x - frameOffset.x) * scale, 3),
      y: safeToFixed(-(p.y - origin.y - frameOffset.y) * scale, 3)
    };
  };

  // Rysuj ramkę kadrowania
  if (exportFrame) {
    const p1 = toCAD({ x: exportFrame.x, y: exportFrame.y });
    const p2 = toCAD({ x: exportFrame.x + exportFrame.width, y: exportFrame.y });
    const p3 = toCAD({ x: exportFrame.x + exportFrame.width, y: exportFrame.y + exportFrame.height });
    const p4 = toCAD({ x: exportFrame.x, y: exportFrame.y + exportFrame.height });
    
    if (isValidNumber(p1.x) && isValidNumber(p1.y) &&
        isValidNumber(p2.x) && isValidNumber(p2.y) &&
        isValidNumber(p3.x) && isValidNumber(p3.y) &&
        isValidNumber(p4.x) && isValidNumber(p4.y)) {
      dxf.addLine(point3d(p1.x, p1.y, 0), point3d(p2.x, p2.y, 0), { layerName: "WENTCAD_KADRY" });
      dxf.addLine(point3d(p2.x, p2.y, 0), point3d(p3.x, p3.y, 0), { layerName: "WENTCAD_KADRY" });
      dxf.addLine(point3d(p3.x, p3.y, 0), point3d(p4.x, p4.y, 0), { layerName: "WENTCAD_KADRY" });
      dxf.addLine(point3d(p4.x, p4.y, 0), point3d(p1.x, p1.y, 0), { layerName: "WENTCAD_KADRY" });
    }
  }

  const floorPolygons = floorState.polygons || [];
  
  floorPolygons.forEach(poly => {
    if (exportFrame && !isPolygonInFrame(poly.points, exportFrame)) {
      return;
    }

    const zone = zones[poly.zoneId];
    if (!zone) return;

    const cadPoints: { x: number, y: number }[] = [];
    for (let i = 0; i < poly.points.length; i += 2) {
      const px = poly.points[i];
      const py = poly.points[i + 1];
      if (isValidNumber(px) && isValidNumber(py)) {
        cadPoints.push(toCAD({ x: px, y: py }));
      }
    }

    if (cadPoints.length < 3) return;

    const validPoints = cadPoints.filter(p => isValidNumber(p.x) && isValidNumber(p.y));
    if (validPoints.length < 3) return;

    // Dodaj obrys jako linie
    for (let i = 0; i < validPoints.length; i++) {
      const p1 = validPoints[i];
      const p2 = validPoints[(i + 1) % validPoints.length];
      dxf.addLine(point3d(p1.x, p1.y, 0), point3d(p2.x, p2.y, 0), { layerName: "WENTCAD_OBRYSY" });
    }

    // Dodaj tekst metki
    const tagPosPx = zone.tagPosition || calculateCentroid(poly.points);
    
    if (exportFrame && !isPointInFrame(tagPosPx.x, tagPosPx.y, exportFrame)) {
      return;
    }

    const tagPosCAD = toCAD(tagPosPx);
    if (!isValidNumber(tagPosCAD.x) || !isValidNumber(tagPosCAD.y)) return;

    const tagText = getTagText(zone.id);
    if (tagText.col1 || tagText.col2) {
      const fullText = `${tagText.col1}${tagText.col1 && tagText.col2 ? " | " : ""}${tagText.col2}`;
      dxf.addText(point3d(tagPosCAD.x, tagPosCAD.y, 0), 0.15, fullText, { 
        layerName: "WENTCAD_OBRYSY"
      });
    }
  });

  return dxf.stringify();
}

function calculateCentroid(points: number[]): Point {
  let x = 0, y = 0;
  for (let i = 0; i < points.length; i += 2) {
    x += points[i];
    y += points[i + 1];
  }
  const count = points.length / 2;
  return { x: count > 0 ? x / count : 0, y: count > 0 ? y / count : 0 };
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
