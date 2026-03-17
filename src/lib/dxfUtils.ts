import DxfParser from 'dxf-parser';

export interface RenderDxfOptions {
  selectedLayers: string[];
  keepColors: boolean;
}

// Podstawowa paleta AutoCAD Color Index (ACI)
const ACI_COLORS: Record<number, string> = {
  1: '#FF0000', 2: '#FFFF00', 3: '#00FF00', 4: '#00FFFF',
  5: '#0000FF', 6: '#FF00FF', 7: '#000000', 8: '#808080', 9: '#C0C0C0',
  10: '#FF0000', 11: '#FFAA00', 12: '#AA0000', 250: '#333333', 
  251: '#555555', 252: '#777777', 253: '#999999', 254: '#BBBBBB', 255: '#FFFFFF'
};

function getAciColor(aci?: number): string | null {
  if (aci === undefined || aci === null) return null;
  if (ACI_COLORS[aci]) return ACI_COLORS[aci];
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

  // 1. Rekurencyjne wyliczanie Bounding Boxa (wspiera Bloki / INSERT)
  const processBBox = (entities: any[], offsetX = 0, offsetY = 0) => {
    entities.forEach((ent: any) => {
      // W DXF warstwa '0' wewnątrz bloku dziedziczy warstwę bloku. Uprośćmy to dla bezpieczeństwa.
      if (ent.layer !== '0' && !options.selectedLayers.includes(ent.layer)) return;
      
      if (ent.type === 'LINE') {
        ent.vertices.forEach((v: any) => updateBBox(v.x + offsetX, v.y + offsetY));
      } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
        if (ent.vertices) ent.vertices.forEach((v: any) => updateBBox(v.x + offsetX, v.y + offsetY));
      } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
        updateBBox(ent.center.x + offsetX - ent.radius, ent.center.y + offsetY - ent.radius);
        updateBBox(ent.center.x + offsetX + ent.radius, ent.center.y + offsetY + ent.radius);
      } else if (ent.type === 'INSERT') {
        const block = dxf.blocks[ent.name];
        const pos = ent.position || { x: 0, y: 0 };
        if (block && block.entities) {
           processBBox(block.entities, offsetX + pos.x, offsetY + pos.y);
        }
      } else if (ent.type === 'TEXT' || ent.type === 'MTEXT') {
        const pt = ent.startPoint || ent.position;
        if (pt) updateBBox(pt.x + offsetX, pt.y + offsetY);
      }
    });
  };

  processBBox(dxf.entities);
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

  // Globalna transformacja na środek i odwrócenie osi Y
  ctx.translate(padding, height - padding);
  ctx.scale(1, -1);
  ctx.translate(-minX, -minY);

  ctx.lineWidth = Math.max(dxfWidth, dxfHeight) / 1500;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Inteligentne pobieranie kolorów ACI / ByLayer
  const getColor = (ent: any, parentLayer?: string) => {
    let drawColor = '#94a3b8'; // Domyślny slate-400
    if (options.keepColors) {
      const activeLayer = ent.layer === '0' && parentLayer ? parentLayer : ent.layer;
      const layerColorIndex = dxf.tables?.layer?.layers[activeLayer]?.colorNumber;
      const entityColorIndex = ent.colorIndex !== undefined ? ent.colorIndex : ent.colorNumber;
      
      // 256 oznacza 'ByLayer' (Z warstwy)
      const resolvedAci = (entityColorIndex !== undefined && entityColorIndex !== 256) 
        ? entityColorIndex 
        : layerColorIndex;
      
      if (resolvedAci === 7) {
         drawColor = '#000000'; // Kolor 7 w CAD to biały/czarny (na białym tle rysujemy na czarno)
      } else {
         drawColor = getAciColor(resolvedAci) || '#64748b';
      }
    }
    return drawColor;
  };

  // 2. Rekurencyjne Rysowanie Encji
  const drawEntities = (entities: any[], parentLayer?: string) => {
    entities.forEach((ent: any) => {
      if (ent.layer !== '0' && !options.selectedLayers.includes(ent.layer)) return;

      const drawColor = getColor(ent, parentLayer);
      ctx.strokeStyle = drawColor;
      ctx.fillStyle = drawColor;

      if (ent.type === 'LINE') {
        ctx.beginPath();
        ctx.moveTo(ent.vertices[0].x, ent.vertices[0].y);
        ctx.lineTo(ent.vertices[1].x, ent.vertices[1].y);
        ctx.stroke();
      } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
        const verts = ent.vertices;
        if (!verts || verts.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
        if (ent.shape === true || ent.closed === true) ctx.closePath();
        ctx.stroke();
      } else if (ent.type === 'CIRCLE') {
        ctx.beginPath();
        ctx.arc(ent.center.x, ent.center.y, ent.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ent.type === 'ARC') {
        ctx.beginPath();
        ctx.arc(ent.center.x, ent.center.y, ent.radius, ent.startAngle, ent.endAngle);
        ctx.stroke();
      } else if (ent.type === 'TEXT' || ent.type === 'MTEXT') {
         const pt = ent.startPoint || ent.position;
         if (pt && ent.text) {
           ctx.save();
           ctx.translate(pt.x, pt.y);
           ctx.scale(1, -1); // Odwrócenie Y tylko dla tekstu, żeby dało się czytać
           const tHeight = ent.textHeight || (Math.max(dxfWidth, dxfHeight) / 150);
           ctx.font = `${tHeight}px sans-serif`;
           ctx.fillText(ent.text, 0, 0);
           ctx.restore();
         }
      } else if (ent.type === 'INSERT') {
         const block = dxf.blocks[ent.name];
         if (block && block.entities) {
            ctx.save();
            const pos = ent.position || { x: 0, y: 0 };
            ctx.translate(pos.x, pos.y);
            
            if (ent.rotation) {
               ctx.rotate(ent.rotation * Math.PI / 180);
            }
            
            const scaleX = ent.scaleX !== undefined ? ent.scaleX : (ent.xScale !== undefined ? ent.xScale : 1);
            const scaleY = ent.scaleY !== undefined ? ent.scaleY : (ent.yScale !== undefined ? ent.yScale : 1);
            ctx.scale(scaleX, scaleY);
            
            drawEntities(block.entities, ent.layer);
            
            ctx.restore();
         }
      }
    });
  };

  drawEntities(dxf.entities);

  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}
