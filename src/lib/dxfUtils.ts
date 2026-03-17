import DxfParser from 'dxf-parser';

export async function renderDxfToDataUrl(fileContent: string): Promise<{ dataUrl: string, width: number, height: number } | null> {
  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(fileContent);
  } catch (err) {
    console.error("Błąd parsowania DXF", err);
    return null;
  }

  if (!dxf || !dxf.entities) return null;

  // 1. Znajdź Bounding Box (minX, maxX, minY, maxY) wszystkich encji (LINE, LWPOLYLINE, POLYLINE)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  const updateBBox = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  dxf.entities.forEach((ent: any) => {
    if (ent.type === 'LINE') {
      ent.vertices.forEach((v: any) => updateBBox(v.x, v.y));
    } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
      if (ent.vertices) {
        ent.vertices.forEach((v: any) => updateBBox(v.x, v.y));
      }
    } else if (ent.type === 'CIRCLE') {
      updateBBox(ent.center.x - ent.radius, ent.center.y - ent.radius);
      updateBBox(ent.center.x + ent.radius, ent.center.y + ent.radius);
    } else if (ent.type === 'ARC') {
        // Simplified BBox for ARC - center +/- radius
        updateBBox(ent.center.x - ent.radius, ent.center.y - ent.radius);
        updateBBox(ent.center.x + ent.radius, ent.center.y + ent.radius);
    }
  });

  if (minX === Infinity) return null; // Brak prawidłowej geometrii

  // Dodaj margines (padding)
  const padding = 50;
  const dxfWidth = (maxX - minX);
  const dxfHeight = (maxY - minY);
  
  const width = dxfWidth + padding * 2;
  const height = dxfHeight + padding * 2;

  // 2. Utwórz Offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Tło canvasa (opcjonalnie białe dla czytelności DataURL)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // 3. Transformacja układu współrzędnych (KRYTYCZNE)
  // Przesuwamy o padding, ustawiamy środek rzutu
  // W CAD Y rośnie w górę. W Canvas Y rośnie w dół.
  ctx.translate(padding, height - padding);
  ctx.scale(1, -1);
  ctx.translate(-minX, -minY);

  // 4. Rysowanie
  ctx.strokeStyle = '#94a3b8'; // Szary kolor dla podkładu CAD (slate-400)
  ctx.lineWidth = Math.max(dxfWidth, dxfHeight) / 1500; // Inteligenta grubość linii
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  dxf.entities.forEach((ent: any) => {
    ctx.beginPath();
    if (ent.type === 'LINE') {
      ctx.moveTo(ent.vertices[0].x, ent.vertices[0].y);
      ctx.lineTo(ent.vertices[1].x, ent.vertices[1].y);
    } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
      const verts = ent.vertices;
      if (!verts || verts.length === 0) return;
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      if (ent.shape === true || ent.closed === true) {
        ctx.closePath();
      }
    } else if (ent.type === 'CIRCLE') {
      ctx.arc(ent.center.x, ent.center.y, ent.radius, 0, Math.PI * 2);
    } else if (ent.type === 'ARC') {
      ctx.arc(ent.center.x, ent.center.y, ent.radius, ent.startAngle, ent.endAngle);
    }
    ctx.stroke();
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}
