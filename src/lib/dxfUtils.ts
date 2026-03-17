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

  const processBBox = (entities: any[], offsetX = 0, offsetY = 0) => {
    entities.forEach((ent: any) => {
      if (ent.layer !== '0' && !options.selectedLayers.includes(ent.layer)) return;
      
      if (ent.type === 'LINE') {
        ent.vertices?.forEach((v: any) => updateBBox(v.x + offsetX, v.y + offsetY));
      } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
        ent.vertices?.forEach((v: any) => updateBBox(v.x + offsetX, v.y + offsetY));
      } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
        updateBBox(ent.center.x + offsetX - ent.radius, ent.center.y + offsetY - ent.radius);
        updateBBox(ent.center.x + offsetX + ent.radius, ent.center.y + offsetY + ent.radius);
      } else if (ent.type === 'INSERT') {
        const block = dxf.blocks[ent.name];
        const pos = ent.position || { x: 0, y: 0 };
        if (block && block.entities) {
           processBBox(block.entities, offsetX + pos.x, offsetY + pos.y);
        }
      } else if (['TEXT', 'MTEXT', 'ATTRIB', 'ATTDEF'].includes(ent.type)) {
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

  ctx.translate(padding, height - padding);
  ctx.scale(1, -1);
  ctx.translate(-minX, -minY);

  const baseLineWidth = Math.max(dxfWidth, dxfHeight) / 1500;
  ctx.lineWidth = baseLineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const getColor = (ent: any, parentLayer?: string) => {
    let drawColor = '#94a3b8'; // Domyślny szary (slate-400)
    if (options.keepColors) {
      const activeLayer = (ent.layer === '0' && parentLayer) ? parentLayer : ent.layer;
      
      // Bezpieczne wydobycie koloru z warstwy (w dxf-parser to może być layer.color lub layer.colorNumber)
      const layerData = dxf.tables?.layer?.layers[activeLayer];
      const layerColorIndex = layerData?.color !== undefined ? layerData.color : layerData?.colorNumber;
      
      // Bezpieczne wydobycie koloru z encji
      const entityColorIndex = ent.colorIndex !== undefined ? ent.colorIndex 
                             : (ent.colorNumber !== undefined ? ent.colorNumber : ent.color);
      
      const resolvedAci = (entityColorIndex !== undefined && entityColorIndex !== 256) 
        ? entityColorIndex 
        : layerColorIndex;
      
      if (resolvedAci === 7) {
         drawColor = '#000000'; // ACI 7 (czarny/biały) na naszym jasnym tle musi być czarny
      } else {
         drawColor = getAciColor(resolvedAci) || '#64748b'; // Fallback
      }
    }
    return drawColor;
  };

  const drawEntities = (entities: any[], parentLayer?: string, currentScale: number = 1) => {
    entities.forEach((ent: any) => {
      if (ent.layer !== '0' && !options.selectedLayers.includes(ent.layer)) return;

      const drawColor = getColor(ent, parentLayer);
      ctx.strokeStyle = drawColor;
      ctx.fillStyle = drawColor;

      // Naprawa "grubych bloków" - resetujemy grubość linii względem aktualnego skalowania
      ctx.lineWidth = baseLineWidth / currentScale;

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
      } else if (['TEXT', 'MTEXT', 'ATTRIB', 'ATTDEF'].includes(ent.type)) {
         const pt = ent.startPoint || ent.position;
         const textValue = ent.text || ent.tag || '';
         if (pt && textValue) {
           ctx.save();
           ctx.translate(pt.x, pt.y);
           ctx.scale(1, -1);
           const tHeight = ent.textHeight || (Math.max(dxfWidth, dxfHeight) / 150);
           ctx.font = `${tHeight}px sans-serif`;
           ctx.fillText(textValue, 0, 0);
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
            
            // Rekurencyjne rysowanie z podaniem skali, aby wyrównać grubość linii
            drawEntities(block.entities, ent.layer, currentScale * Math.abs(scaleX));
            
            ctx.restore();
         }
      }
    });
  };

  drawEntities(dxf.entities);

  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}
