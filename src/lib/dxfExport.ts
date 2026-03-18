import { DxfWriter, point3d, point2d, Colors, HatchPredefinedPatterns, HatchBoundaryPaths, HatchPolylineBoundary, vertex } from "@tarikjabiri/dxf";
import type { ZoneData } from "../types";
import type { FloorCanvasState, Point } from "../stores/useCanvasStore";

export function exportToDXF(
  floorState: FloorCanvasState,
  zones: Record<string, ZoneData>,
  getTagText: (zoneId: string) => { col1: string; col2: string }
) {
  const dxf = new DxfWriter();
  
  // 1. Setup Layers
  dxf.addLayer("WENTCAD_PUNKT_ZERO", Colors.White);
  dxf.addLayer("WENTCAD_OBRYSY", Colors.Blue);
  dxf.addLayer("WENTCAD_WYPELNIENIA", Colors.Cyan);
  dxf.addLayer("WENTCAD_METKI_RAMKI", Colors.Yellow);
  dxf.addLayer("WENTCAD_METKI_TEKST", Colors.White);

  const origin = floorState.referenceOrigin || { x: 0, y: 0 };
  const scale = floorState.scaleFactor || 1; // meters per pixel

  // Transformation helper: Konva px -> CAD meters
  const toCAD = (p: Point) => {
    return {
      x: (p.x - origin.x) * scale,
      y: -(p.y - origin.y) * scale // Y is up in CAD
    };
  };

  // 2. Add Point Zero Marker
  dxf.addLine(point3d(-0.5, 0), point3d(0.5, 0), { layerName: "WENTCAD_PUNKT_ZERO" });
  dxf.addLine(point3d(0, -0.5), point3d(0, 0.5), { layerName: "WENTCAD_PUNKT_ZERO" });
  dxf.addCircle(point3d(0, 0), 0.2, { layerName: "WENTCAD_PUNKT_ZERO" });

  // 3. Process Zones
  const floorPolygons = floorState.polygons || [];
  
  floorPolygons.forEach(poly => {
    const zone = zones[poly.zoneId];
    if (!zone) return;

    // a) Draw Outline
    const cadPoints: { x: number, y: number }[] = [];
    for (let i = 0; i < poly.points.length; i += 2) {
      cadPoints.push(toCAD({ x: poly.points[i], y: poly.points[i + 1] }));
    }

    dxf.addLWPolyline(cadPoints.map(p => ({ point: point2d(p.x, p.y) })), {
      layerName: "WENTCAD_OBRYSY",
      flags: 1 // Closed
    });

    // b) Add Fill (Hatch)
    const boundary = new HatchPolylineBoundary();
    cadPoints.forEach(p => boundary.add(vertex(p.x, p.y)));
    
    const paths = new HatchBoundaryPaths();
    paths.addPolylineBoundary(boundary);

    dxf.addHatch(paths, { name: HatchPredefinedPatterns.SOLID }, {
      layerName: "WENTCAD_WYPELNIENIA",
      colorNumber: 7 // Stick to standard layers or use specific ACI
    });

    // c) Draw Smart Tag
    const tagPosPx = zone.tagPosition || calculateCentroid(poly.points);
    const tagPosCAD = toCAD(tagPosPx);
    const tagText = getTagText(zone.id);

    if (tagText.col1 || tagText.col2) {
      const fullText = `${tagText.col1}${tagText.col1 && tagText.col2 ? "\n" : ""}${tagText.col2}`;
      const textHeight = 0.2; 
      
      dxf.addMText(point3d(tagPosCAD.x, tagPosCAD.y), textHeight, fullText, {
        layerName: "WENTCAD_METKI_TEKST",
        attachmentPoint: 5 // Middle Center
      });

      const frameWidth = 1.5;
      const frameHeight = 0.8;
      dxf.addRectangle(
        point2d(tagPosCAD.x - frameWidth / 2, tagPosCAD.y + frameHeight / 2),
        point2d(tagPosCAD.x + frameWidth / 2, tagPosCAD.y - frameHeight / 2),
        { layerName: "WENTCAD_METKI_RAMKI" }
      );
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
