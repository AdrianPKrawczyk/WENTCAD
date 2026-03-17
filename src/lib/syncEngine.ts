export function extractAndTransformPolygons(
  dxfData: any,
  targetLayer: string,
  transformFn: (x: number, y: number) => { x: number; y: number }
): Array<{ points: number[]; centerX: number; centerY: number }> {
  const extracted: Array<{ points: number[]; centerX: number; centerY: number }> = [];

  dxfData.entities?.forEach((ent: any) => {
    if (ent.layer !== targetLayer) return;
    
    // Szukamy tylko zamkniętych polilinii
    if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && (ent.shape === true || ent.closed === true)) {
      if (!ent.vertices || ent.vertices.length < 3) return;

      const points: number[] = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      ent.vertices.forEach((v: any) => {
        const transformed = transformFn(v.x, v.y);
        points.push(transformed.x, transformed.y);
        
        if (transformed.x < minX) minX = transformed.x;
        if (transformed.x > maxX) maxX = transformed.x;
        if (transformed.y < minY) minY = transformed.y;
        if (transformed.y > maxY) maxY = transformed.y;
      });

      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;

      extracted.push({ points, centerX, centerY });
    }
  });

  return extracted;
}
