import { DxfWriter, point3d } from "@tarikjabiri/dxf";
import type { ZoneData, SystemDef } from "../types";
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

const polishCharMap: Record<string, string> = {
  'ą': '\\U+0105',
  'ć': '\\U+0107',
  'ę': '\\U+0119',
  'ł': '\\U+0142',
  'ń': '\\U+0144',
  'ó': '\\U+00F3',
  'ś': '\\U+015B',
  'ź': '\\U+017A',
  'ż': '\\U+017C',
  'Ą': '\\U+0104',
  'Ć': '\\U+0106',
  'Ę': '\\U+0118',
  'Ł': '\\U+0141',
  'Ń': '\\U+0143',
  'Ó': '\\U+00D3',
  'Ś': '\\U+015A',
  'Ź': '\\U+0179',
  'Ż': '\\U+017B'
};

function escapePolishChars(text: string): string {
  let result = '';
  for (const char of text) {
    result += polishCharMap[char] || char;
  }
  return result;
}

function measureTextWidth(text: string, fontSize: number): number {
  const charWidths: Record<string, number> = {
    ' ': 0.3, '.': 0.25, '-': 0.25, ',': 0.2, ':': 0.2, ';': 0.2,
    '1': 0.5, '2': 0.5, '3': 0.5, '4': 0.5, '5': 0.5, '6': 0.5, '7': 0.5, '8': 0.5, '9': 0.5, '0': 0.5,
    'A': 0.7, 'B': 0.65, 'C': 0.7, 'D': 0.7, 'E': 0.6, 'F': 0.55, 'G': 0.7, 'H': 0.7, 'I': 0.3,
    'J': 0.5, 'K': 0.7, 'L': 0.55, 'M': 0.85, 'N': 0.7, 'O': 0.75, 'P': 0.65, 'Q': 0.75, 'R': 0.7,
    'S': 0.65, 'T': 0.6, 'U': 0.7, 'V': 0.65, 'W': 0.95, 'X': 0.65, 'Y': 0.65, 'Z': 0.6,
  };
  let width = 0;
  for (const char of text.toUpperCase()) {
    width += charWidths[char] || 0.65;
  }
  return width * fontSize;
}

export function exportToDXF(
  floorState: FloorCanvasState,
  zones: Record<string, ZoneData>,
  _systems: SystemDef[],
  getTagText: (zoneId: string) => { col1: string; col2: string },
  exportFrame?: ExportFrame
): string {
  const dxf = new DxfWriter();
  
  dxf.addLayer("WENTCAD_OBRYSY", 7);
  dxf.addLayer("WENTCAD_KADRY", 3);
  dxf.addLayer("WENTCAD_METKI_RAMKI", 7);
  dxf.addLayer("WENTCAD_METKI_TEKST", 7);

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

    for (let i = 0; i < validPoints.length; i++) {
      const p1 = validPoints[i];
      const p2 = validPoints[(i + 1) % validPoints.length];
      dxf.addLine(point3d(p1.x, p1.y, 0), point3d(p2.x, p2.y, 0), { layerName: "WENTCAD_OBRYSY" });
    }

    const tagPosPx = zone.tagPosition || calculateCentroid(poly.points);
    
    if (exportFrame && !isPointInFrame(tagPosPx.x, tagPosPx.y, exportFrame)) {
      return;
    }

    const tagPosCAD = toCAD(tagPosPx);
    if (!isValidNumber(tagPosCAD.x) || !isValidNumber(tagPosCAD.y)) return;

    const tagText = getTagText(zone.id);
    if (tagText.col1 || tagText.col2) {
      const fontSize = 0.2;
      const lineHeight = fontSize * 1.8;
      const paddingX = 0.15;
      const paddingY = 0.08;
      
      const line1 = tagText.col1 || '';
      const line2 = tagText.col2 || '';
      
      const line1Width = measureTextWidth(line1, fontSize);
      const line2Width = measureTextWidth(line2, fontSize);
      const tagWidth = Math.max(line1Width, line2Width) + paddingX * 2;
      const tagHeight = (line1 ? lineHeight : 0) + (line2 ? lineHeight : 0) + paddingY * 2;
      
      const tagX = tagPosCAD.x - tagWidth / 2;
      const tagY = tagPosCAD.y - tagHeight / 2;

      dxf.addLine(point3d(tagX, tagY, 0), point3d(tagX + tagWidth, tagY, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX + tagWidth, tagY, 0), point3d(tagX + tagWidth, tagY + tagHeight, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX + tagWidth, tagY + tagHeight, 0), point3d(tagX, tagY + tagHeight, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX, tagY + tagHeight, 0), point3d(tagX, tagY, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      
      if (line1) {
        const textX = tagX + paddingX;
        const textY = tagY + paddingY + fontSize;
        dxf.addText(point3d(textX, textY, 0), fontSize, escapePolishChars(line1), { 
          layerName: "WENTCAD_METKI_TEKST"
        });
      }
      
      if (line2) {
        const textX = tagX + paddingX;
        const textY = tagY + paddingY + (line1 ? lineHeight : 0) + fontSize;
        dxf.addText(point3d(textX, textY, 0), fontSize, escapePolishChars(line2), { 
          layerName: "WENTCAD_METKI_TEKST"
        });
      }
    }
  });

  const rawContent = dxf.stringify();
  
  const properHeader = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
9
$INSUNITS
70
5
9
$EXTMIN
10
-1.0
20
-1.0
30
0.0
9
$EXTMAX
10
1000000.0
20
1000000.0
30
0.0
9
$LIMMIN
10
0.0
20
0.0
9
$LIMMAX
10
1000000.0
20
1000000.0
0
ENDSEC
`;

  const headerStart = rawContent.indexOf('0\nSECTION\n2\nHEADER');
  const headerEnd = rawContent.indexOf('0\nENDSEC\n', headerStart) + 10;
  
  if (headerStart !== -1) {
    return rawContent.slice(0, headerStart) + properHeader + rawContent.slice(headerEnd);
  }
  
  return properHeader + rawContent;
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
