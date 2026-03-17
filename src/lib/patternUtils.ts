/**
 * Utility for creating Konva compatible hatch patterns
 */

export function createPatternImage(patternType: string, color: string): HTMLCanvasElement | undefined {
  if (typeof document === 'undefined') return undefined;

  const size = 20;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return undefined;

  // Clear or set transparent background
  ctx.clearRect(0, 0, size, size);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';

  // Map Polish names from UI to technical IDs
  let type = patternType.toUpperCase();
  if (type === 'UKOŚNE') type = 'DIAGONAL';
  if (type === 'KRATKA') type = 'GRID';
  if (type === 'KROPKI') type = 'DOTS';
  if (type === 'PODWÓJNE UKOŚNE') type = 'DIAGONAL_DOUBLE';

  switch (type) {
    case 'DIAGONAL':
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(size, 0);
      ctx.stroke();
      break;

    case 'GRID':
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.stroke();
      break;

    case 'DOTS':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    
    case 'DIAGONAL_DOUBLE':
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.stroke();
      break;

    default:
      // Fallback empty pattern
      return undefined;
  }

  return canvas;
}
