import DxfParser from 'dxf-parser';

export interface RenderDxfOptions {
  selectedLayers: string[];
}

export function parseDxfFile(fileContent: string) {
  // Hack: Podmiana ATTRIB i ATTDEF na TEXT dla metek
  const processedContent = fileContent
    .replace(/^[ \t]*0\r?\n[ \t]*ATTRIB\r?\n/gm, '  0\nTEXT\n')
    .replace(/^[ \t]*0\r?\n[ \t]*ATTDEF\r?\n/gm, '  0\nTEXT\n');

  const parser = new DxfParser();
  try {
    return parser.parseSync(processedContent);
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
      } else if (['TEXT', 'MTEXT'].includes(ent.type)) {
        const pt = ent.startPoint || ent.position || ent.endPoint;
        if (pt) updateBBox(pt.x + offsetX, pt.y + offsetY);
      }
    });
  };

  processBBox(dxf.entities);
  if (minX === Infinity) return null;

  const dxfWidth = (maxX - minX);
  const dxfHeight = (maxY - minY);
  
  const MAX_CANVAS_SIZE = 4000; 
  const scale = Math.min(MAX_CANVAS_SIZE / dxfWidth, MAX_CANVAS_SIZE / dxfHeight, 200); 
  const padding = 50; 
  
  const canvasWidth = Math.floor(dxfWidth * scale) + padding * 2;
  const canvasHeight = Math.floor(dxfHeight * scale) + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.translate(padding, canvasHeight - padding);
  ctx.scale(scale, -scale);
  ctx.translate(-minX, -minY);

  const baseLineWidth = 1.5 / scale; 
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const drawEntities = (entities: any[], currentScale: number = 1) => {
    entities.forEach((ent: any) => {
      if (ent.layer !== '0' && !options.selectedLayers.includes(ent.layer)) return;

      const drawColor = '#94a3b8'; 
      ctx.strokeStyle = drawColor;
      ctx.fillStyle = drawColor;
      
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
      } else if (['TEXT', 'MTEXT'].includes(ent.type)) {
         const pt = ent.startPoint || ent.position || ent.endPoint;
         const textValue = ent.text || ent.tag || ent.value || '';
         if (pt && textValue) {
           ctx.save();
           ctx.translate(pt.x, pt.y);
           if (ent.rotation) ctx.rotate(ent.rotation * Math.PI / 180);
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
            if (ent.rotation) ctx.rotate(ent.rotation * Math.PI / 180);
            
            const scaleX = ent.scaleX !== undefined ? ent.scaleX : (ent.xScale !== undefined ? ent.xScale : 1);
            const scaleY = ent.scaleY !== undefined ? ent.scaleY : (ent.yScale !== undefined ? ent.yScale : 1);
            ctx.scale(scaleX, scaleY);
            
            drawEntities(block.entities, currentScale * Math.abs(scaleX));
            ctx.restore();
         }
      }
    });
  };

  drawEntities(dxf.entities);

  return { 
    dataUrl: canvas.toDataURL('image/png'), 
    width: canvasWidth / scale, 
    height: canvasHeight / scale 
  };
}
