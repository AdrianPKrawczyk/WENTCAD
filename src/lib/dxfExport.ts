import { DxfWriter, point3d } from "@tarikjabiri/dxf";
import type { ZoneData, SystemDef } from "../types";
import type { FloorCanvasState, Point } from "../stores/useCanvasStore";

interface ExportFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isValidNumber(val: number): boolean {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

function safeToFixed(val: number, decimals: number = 3): number {
  if (!isValidNumber(val)) return 0;
  const mult = Math.pow(10, decimals);
  return Math.round(val * mult) / mult;
}

// Sanityzacja tekstu DXF - polskie znaki do sekwencji Unicode dla AutoCADa
// oraz usuwanie indeksów górnych/dolnych (DXF nie obsługuje)
const sanitizeDxfText = (str: string): string => {
  if (!str) return '';
  return str
    // Zamień indeksy górne na zwykły tekst
    .replace(/\u00B2/g, '2')   // ² → 2
    .replace(/\u00B3/g, '3')   // ³ → 3
    .replace(/\u2070/g, '0')   // ⁰ → 0
    .replace(/\u00B9/g, '1')   // ¹ → 1
    .replace(/\u2074/g, '4')   // ⁴ → 4
    .replace(/\u2075/g, '5')   // ⁵ → 5
    .replace(/\u2076/g, '6')   // ⁶ → 6
    .replace(/\u2077/g, '7')   // ⁷ → 7
    .replace(/\u2078/g, '8')   // ⁸ → 8
    .replace(/\u2079/g, '9')   // ⁹ → 9
    .replace(/\u207A/g, '+')   // ⁺ → +
    .replace(/\u207B/g, '-')   // ⁻ → -
    // Zamień indeksy dolne
    .replace(/\u2080/g, '0')   // ₀ → 0
    .replace(/\u2081/g, '1')   // ₁ → 1
    .replace(/\u2082/g, '2')   // ₂ → 2
    .replace(/\u2083/g, '3')   // ₃ → 3
    .replace(/\u2084/g, '4')   // ₄ → 4
    .replace(/\u2085/g, '5')   // ₅ → 5
    .replace(/\u2086/g, '6')   // ₆ → 6
    .replace(/\u2087/g, '7')   // ₇ → 7
    .replace(/\u2088/g, '8')   // ₈ → 8
    .replace(/\u2089/g, '9')   // ₉ → 9
    // Zamień polskie znaki na sekwencje Unicode
    .replace(/ą/g, '\\U+0105').replace(/Ą/g, '\\U+0104')
    .replace(/ć/g, '\\U+0107').replace(/Ć/g, '\\U+0106')
    .replace(/ę/g, '\\U+0119').replace(/Ę/g, '\\U+0118')
    .replace(/ł/g, '\\U+0142').replace(/Ł/g, '\\U+0141')
    .replace(/ń/g, '\\U+0144').replace(/Ń/g, '\\U+0143')
    .replace(/ó/g, '\\U+00F3').replace(/Ó/g, '\\U+00D3')
    .replace(/ś/g, '\\U+015B').replace(/Ś/g, '\\U+015A')
    .replace(/ź/g, '\\U+017A').replace(/Ź/g, '\\U+0179')
    .replace(/ż/g, '\\U+017C').replace(/Ż/g, '\\U+017B');
};

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

function measureTextWidth(text: string): number {
  // Usuń sekwencje Unicode \\U+XXXX przed obliczeniem szerokości
  const normalizedText = text.replace(/\\U\+[0-9A-Fa-f]{4}/g, 'W');
  
  // Szerokości znaków dla fontu 0.075m - skalowane dla AutoCAD
  // "Vw: 46 m3/h" = 0.78m w AutoCAD (11 znaków) → ~0.071m/symbol
  const charWidths: Record<string, number> = {
    ' ': 0.04, '.': 0.025, '-': 0.03, ',': 0.025, ':': 0.025, ';': 0.025, '/': 0.025,
    '1': 0.06, '2': 0.06, '3': 0.06, '4': 0.06, '5': 0.06, '6': 0.06, '7': 0.06, '8': 0.06, '9': 0.06, '0': 0.06,
    'A': 0.1, 'B': 0.095, 'C': 0.1, 'D': 0.1, 'E': 0.088, 'F': 0.082, 'G': 0.1, 'H': 0.1, 'I': 0.035,
    'J': 0.06, 'K': 0.1, 'L': 0.082, 'M': 0.123, 'N': 0.1, 'O': 0.112, 'P': 0.096, 'Q': 0.112, 'R': 0.1,
    'S': 0.096, 'T': 0.088, 'U': 0.1, 'V': 0.096, 'W': 0.13, 'X': 0.096, 'Y': 0.096, 'Z': 0.088,
  };
  let width = 0;
  for (const char of normalizedText.toUpperCase()) {
    width += charWidths[char] || 0.094;
  }
  return width;
}

// Wstrzyknięcie definicji stylu Arial do tabeli STYLE

export function exportToDXF(
  floorState: FloorCanvasState,
  zones: Record<string, ZoneData>,
  _systems: SystemDef[],
  getTagText: (zoneId: string) => { col1: string; col2: string },
  exportFrame?: ExportFrame,
  _fontSize: number = 10
): string {
  const dxf = new DxfWriter();

  // ============================================
  // REJESTRACJA CZCIONKI ARIAL (WŁASNY STYL)
  // ============================================
  try {
    (dxf as any).addStyle?.({
      name: 'ARIAL_WENTCAD',
      primaryFontFileName: 'arial.ttf'
    });
  } catch (e) {
    console.warn("Styl ARIAL_WENTCAD już istnieje lub nie mógł zostać dodany:", e);
  }

  // Stały rozmiar tekstu dla DXF (w jednostkach modelu - metry)
  const CAD_FONT_SIZE = 0.1;
  
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
      const fontSize = CAD_FONT_SIZE;
      const lineHeight = fontSize * 1.25;
      const paddingX = 0.015;
      const paddingY = 0.012;
      
      const allLines = [tagText.col1, tagText.col2].filter(l => l).join('\n').split('\n');
      const nonEmptyLines = allLines.filter(l => l.trim().length > 0);
      
      let maxLineWidth = 0;
      nonEmptyLines.forEach(line => {
        maxLineWidth = Math.max(maxLineWidth, measureTextWidth(line));
      });
      
      const tagWidth = maxLineWidth + paddingX * 2;
      const tagHeight = nonEmptyLines.length * lineHeight + paddingY * 2;
      
      const tagX = tagPosCAD.x - tagWidth / 2;
      const tagY = tagPosCAD.y - tagHeight / 2;

      dxf.addLine(point3d(tagX, tagY, 0), point3d(tagX + tagWidth, tagY, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX + tagWidth, tagY, 0), point3d(tagX + tagWidth, tagY + tagHeight, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX + tagWidth, tagY + tagHeight, 0), point3d(tagX, tagY + tagHeight, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      dxf.addLine(point3d(tagX, tagY + tagHeight, 0), point3d(tagX, tagY, 0), { layerName: "WENTCAD_METKI_RAMKI" });
      
      const boxMaxY = tagY + tagHeight;
      const boxMinX = tagX;
      const pad = 0.05;

      let currentY = boxMaxY - pad - fontSize;

      nonEmptyLines.forEach(line => {
        dxf.addText(
          point3d(boxMinX + pad, currentY, 0),
          fontSize,
          sanitizeDxfText(line),
          {
            layerName: "WENTCAD_METKI_TEKST",
            styleName: 'ARIAL_WENTCAD'
          } as any
        );
        currentY -= lineHeight;
      });
    }
  });

  // Generuj DXF
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
