import DxfParser from 'dxf-parser';

export interface RenderDxfOptions {
  selectedLayers: string[];
  keepColors: boolean;
}

const ACI_COLORS: Record<number, string> = {
  1: '#FF0000', 2: '#FFFF00', 3: '#00FF00', 4: '#00FFFF',
  5: '#0000FF', 6: '#FF00FF', 7: '#000000', 8: '#808080', 9: '#C0C0C0'
};

function getAciColor(aci?: number): string | null {
  if (aci && ACI_COLORS[aci]) return ACI_COLORS[aci];
  return null;
}

export function parseDxfFile(fileContent: string) {
  const parser = new DxfParser();
  try {
    return parser.parseSync(fileContent);
  } catch (err) {
    console.error("Błąd parsowania DXF", err);
    return null;
  }
}

export async function renderDxfToDataUrl(dxf: any, options: RenderDxfOptions): Promise<{ dataUrl: string, width: number, height: number } | null> {
  if (!dxf || !dxf.entities) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  const updateBBox = (x: number, y: number) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };

  dxf.entities.forEach((ent: any) => {
    if (!options.selectedLayers.includes(ent.layer)) return; // Pomijanie wyłączonych warstw

    if (ent.type === 'LINE') {
      ent.vertices.forEach((v: any) => updateBBox(v.x, v.y));
    } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
      if (ent.vertices) ent.vertices.forEach((v: any) => updateBBox(v.x, v.y));
    } else if (ent.type === 'CIRCLE') {
      updateBBox(ent.center.x - ent.radius, ent.center.y - ent.radius);
      updateBBox(ent.center.x + ent.radius, ent.center.y + ent.radius);
    } else if (ent.type === 'ARC') {
        updateBBox(ent.center.x - ent.radius, ent.center.y - ent.radius);
        updateBBox(ent.center.x + ent.radius, ent.center.y + ent.radius);
    }
  });

  if (minX === Infinity) return null;

  const padding = 50;
  const dxfWidth = (maxX - minX);
  const dxfHeight = (maxY - minY);
  const width = dxfWidth + padding * 2;
  const height = dxfHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background for DataURL readability
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  ctx.translate(padding, height - padding);
  ctx.scale(1, -1);
  ctx.translate(-minX, -minY);

  ctx.lineWidth = Math.max(dxfWidth, dxfHeight) / 1500;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  dxf.entities.forEach((ent: any) => {
    if (!options.selectedLayers.includes(ent.layer)) return;

    let drawColor = '#94a3b8'; // Domyślny szary
    if (options.keepColors) {
      const layerColor = dxf.tables?.layer?.layers[ent.layer]?.color;
      const entityColor = ent.colorNumber || ent.color;
      const resolvedAci = entityColor ?? layerColor;
      drawColor = getAciColor(resolvedAci) || '#64748b'; // Złagodzony szary dla nieznanych kolorów
    }

    ctx.strokeStyle = drawColor;
    ctx.beginPath();
    
    if (ent.type === 'LINE') {
      ctx.moveTo(ent.vertices[0].x, ent.vertices[0].y);
      ctx.lineTo(ent.vertices[1].x, ent.vertices[1].y);
    } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
      const verts = ent.vertices;
      if (!verts || verts.length === 0) return;
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
      if (ent.shape === true || ent.closed === true) ctx.closePath();
    } else if (ent.type === 'CIRCLE') {
      ctx.arc(ent.center.x, ent.center.y, ent.radius, 0, Math.PI * 2);
    } else if (ent.type === 'ARC') {
      ctx.arc(ent.center.x, ent.center.y, ent.radius, ent.startAngle, ent.endAngle);
    }
    ctx.stroke();
  });

  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}
