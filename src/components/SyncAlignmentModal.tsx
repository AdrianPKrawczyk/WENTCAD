import { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Group, Image as KonvaImage, Text } from 'react-konva';
import { X, Check, LayoutTemplate, Info } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface SyncAlignmentModalProps {
  isOpen: boolean;
  dxfData: any; // Parsed DXF from dxf-parser
  selectedLayer: string; // Filter geometry to this layer
  underlayUrl: string | null;
  zones: any[]; // Existing zones to display on the project side
  onConfirm: (alignment: { transformFn: (x: number, y: number) => Point, pxPerUnit: number }) => void;
  onCancel: () => void;
}

const CROSS_SIZE = 10;

export function SyncAlignmentModal({ isOpen, dxfData, selectedLayer, underlayUrl, zones, onConfirm, onCancel }: SyncAlignmentModalProps) {
  const [mode, setMode] = useState<'1-point' | '3-point'>('1-point');
  
  // Alignment points
  const [dxfPoints, setDxfPoints] = useState<Point[]>([]);
  const [canvasPoints, setCanvasPoints] = useState<Point[]>([]);
  
  // View states for both sides
  const [dxfView, setDxfView] = useState({ x: 0, y: 0, scale: 1 });
  const [canvasView, setCanvasView] = useState({ x: 0, y: 0, scale: 0.5 });
  
  const [underlayImg, setUnderlayImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (underlayUrl) {
      const img = new window.Image();
      img.onload = () => setUnderlayImg(img);
      img.src = underlayUrl;
    } else {
      setUnderlayImg(null);
    }
  }, [underlayUrl]);

  // Container refs for sizing
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [leftSize, setLeftSize] = useState({ width: 0, height: 0 });
  const [rightSize, setRightSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      const updateSizes = () => {
        if (leftContainerRef.current) setLeftSize({ width: leftContainerRef.current.offsetWidth, height: leftContainerRef.current.offsetHeight });
        if (rightContainerRef.current) setRightSize({ width: rightContainerRef.current.offsetWidth, height: rightContainerRef.current.offsetHeight });
      };
      window.addEventListener('resize', updateSizes);
      updateSizes();
      // Delay auto-center to ensure containers have size
      setTimeout(() => {
        updateSizes();
        if (dxfData && leftContainerRef.current) {
           zoomToDxfExtents();
        }
      }, 150);
      return () => window.removeEventListener('resize', updateSizes);
    }
  }, [isOpen, dxfData]);

  const zoomToDxfExtents = () => {
    if (!dxfData || !dxfData.entities || !leftContainerRef.current) return;
    
    // Calculate BBox
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const processEntities = (ents: any[], blocks: any, offX: number, offY: number) => {
      ents.forEach(ent => {
        if (ent.type === 'LINE' && ent.vertices) {
          ent.vertices.forEach((v: any) => {
            if (v.x + offX < minX) minX = v.x + offX; if (v.x + offX > maxX) maxX = v.x + offX;
            if (v.y + offY < minY) minY = v.y + offY; if (v.y + offY > maxY) maxY = v.y + offY;
          });
        } else if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
          ent.vertices.forEach((v: any) => {
            if (v.x + offX < minX) minX = v.x + offX; if (v.x + offX > maxX) maxX = v.x + offX;
            if (v.y + offY < minY) minY = v.y + offY; if (v.y + offY > maxY) maxY = v.y + offY;
          });
        } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
          const cx = (ent.center?.x || 0) + offX;
          const cy = (ent.center?.y || 0) + offY;
          const r = ent.radius || 0;
          if (cx - r < minX) minX = cx - r; if (cx + r > maxX) maxX = cx + r;
          if (cy - r < minY) minY = cy - r; if (cy + r > maxY) maxY = cy + r;
        } else if (ent.type === 'INSERT') {
          const block = blocks[ent.name];
          if (block && block.entities) {
            processEntities(block.entities, blocks, offX + (ent.position?.x || 0), offY + (ent.position?.y || 0));
          }
        }
      });
    };

    processEntities(dxfData.entities, dxfData.blocks || {}, 0, 0);

    if (minX === Infinity) return;

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 40;
    
    const containerW = leftContainerRef.current.offsetWidth;
    const containerH = leftContainerRef.current.offsetHeight;
    
    const scale = Math.min(
      (containerW - padding * 2) / (width || 1),
      (containerH - padding * 2) / (height || 1)
    );

    // Initial scale cap to avoid zooming in too much on tiny drawings
    const finalScale = Math.min(scale, 50);

    setDxfView({
      x: (containerW / 2) - ((minX + width / 2) * finalScale),
      y: (containerH / 2) + ((minY + height / 2) * finalScale), // Y is flipped
      scale: finalScale
    });
  };

  // Reset points when mode changes
  useEffect(() => {
    setDxfPoints([]);
    setCanvasPoints([]);
  }, [mode]);

  // Transformation logic
  const alignment = useMemo(() => {
    if (mode === '1-point') {
      const p1Dxf = dxfPoints[0];
      const p1Canvas = canvasPoints[0];
      if (!p1Dxf || !p1Canvas) return null;
      const dx = p1Canvas.x - p1Dxf.x;
      const dy = p1Canvas.y - p1Dxf.y;
      return {
        transformFn: (x: number, y: number) => ({ x: x + dx, y: y + dy }),
        pxPerUnit: 1.0
      };
    } 

    if (mode === '3-point') {
      if (dxfPoints.length < 3 || canvasPoints.length < 3) return null;
      
      const p1Dxf = dxfPoints[0], p2Dxf = dxfPoints[1], p3Dxf = dxfPoints[2];
      const p1Canvas = canvasPoints[0], p2Canvas = canvasPoints[1], p3Canvas = canvasPoints[2];
      
      // Obliczanie wyznacznika głównego macierzy (Det)
      const det = p1Dxf.x * (p2Dxf.y - p3Dxf.y) - p1Dxf.y * (p2Dxf.x - p3Dxf.x) + (p2Dxf.x * p3Dxf.y - p3Dxf.x * p2Dxf.y);

      if (Math.abs(det) < 1e-6) {
        console.warn("Punkty są współliniowe - transformacja niemożliwa.");
        return {
          transformFn: (x: number, y: number) => ({ x, y }),
          pxPerUnit: 1.0
        };
      }

      // Wyliczanie współczynników macierzy afinicznej
      const a = (p1Canvas.x * (p2Dxf.y - p3Dxf.y) - p1Dxf.y * (p2Canvas.x - p3Canvas.x) + (p2Canvas.x * p3Dxf.y - p3Canvas.x * p2Dxf.y)) / det;
      const b = (p1Dxf.x * (p2Canvas.x - p3Canvas.x) - p1Canvas.x * (p2Dxf.x - p3Dxf.x) + (p2Dxf.x * p3Canvas.x - p3Dxf.x * p2Canvas.x)) / det;
      const c = (p1Dxf.x * (p2Dxf.y * p3Canvas.x - p3Dxf.y * p2Canvas.x) - p1Dxf.y * (p2Dxf.x * p3Canvas.x - p3Dxf.x * p2Canvas.x) + p1Canvas.x * (p2Dxf.x * p3Dxf.y - p3Dxf.x * p2Dxf.y)) / det;

      const d = (p1Canvas.y * (p2Dxf.y - p3Dxf.y) - p1Dxf.y * (p2Canvas.y - p3Canvas.y) + (p2Canvas.y * p3Dxf.y - p3Canvas.y * p2Dxf.y)) / det;
      const e = (p1Dxf.x * (p2Canvas.y - p3Canvas.y) - p1Canvas.y * (p2Dxf.x - p3Dxf.x) + (p2Dxf.x * p3Canvas.y - p3Dxf.x * p2Canvas.y)) / det;
      const f = (p1Dxf.x * (p2Dxf.y * p3Canvas.y - p3Dxf.y * p2Canvas.y) - p1Dxf.y * (p2Dxf.x * p3Canvas.y - p3Dxf.x * p2Canvas.y) + p1Canvas.y * (p2Dxf.x * p3Dxf.y - p3Dxf.x * p2Dxf.y)) / det;

      return {
        transformFn: (x: number, y: number) => ({
          x: a * x + b * y + c,
          y: d * x + e * y + f
        }),
        pxPerUnit: Math.sqrt(a * a + d * d)
      };
    }
    return null;
  }, [mode, dxfPoints, canvasPoints]);

  const canConfirm = (mode === '1-point' && dxfPoints.length >= 1 && canvasPoints.length >= 1) ||
                    (mode === '3-point' && dxfPoints.length >= 3 && canvasPoints.length >= 3);

  if (!isOpen) return null;

  // Handlers for clicks
  const handleDxfClick = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;
    
    if (mode === '1-point') {
      setDxfPoints([pos]);
    } else {
      if (dxfPoints.length >= 3) setDxfPoints([pos]);
      else setDxfPoints((prev: Point[]) => [...prev, pos]);
    }
  };

  const handleCanvasClick = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    if (mode === '1-point') {
      setCanvasPoints([pos]);
    } else {
      if (canvasPoints.length >= 3) setCanvasPoints([pos]);
      else setCanvasPoints((prev: Point[]) => [...prev, pos]);
    }
  };

  // Simplified DXF entity rendering for preview
  const renderDxfEntities = (entities: any[], isGhost = false) => {
    if (!entities) return null;
    return entities.map((ent, idx) => {
      // Filter by layer if specified (only for source view, not ghost)
      if (!isGhost && selectedLayer && ent.layer !== selectedLayer && ent.type !== 'INSERT') {
         return null;
      }

      let points: number[] = [];
      if (ent.type === 'LINE' && ent.vertices) {
        points = [ent.vertices[0].x, ent.vertices[0].y, ent.vertices[1].x, ent.vertices[1].y];
      } else if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && ent.vertices) {
        points = ent.vertices.flatMap((v: any) => [v.x, v.y]);
      } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
        // Draw circles as octagons for preview performance
        const segments = 16;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(ent.center.x + Math.cos(angle) * ent.radius, ent.center.y + Math.sin(angle) * ent.radius);
        }
      } else if (ent.type === 'INSERT') {
        // Recursive block support
        const block = dxfData.blocks[ent.name];
        if (block && block.entities) {
          return (
            <Group 
              key={`block-${idx}`} 
              x={ent.position?.x || 0} 
              y={ent.position?.y || 0}
              rotation={ent.rotation || 0}
              scaleX={ent.scale?.x !== undefined ? ent.scale.x : (ent.xScale !== undefined ? ent.xScale : 1)}
              scaleY={ent.scale?.y !== undefined ? ent.scale.y : (ent.yScale !== undefined ? ent.yScale : 1)}
            >
              {renderDxfEntities(block.entities, isGhost)}
            </Group>
          );
        }
      }

      if (points.length < 4) return null;

      const color = isGhost ? 'rgba(99, 102, 241, 0.4)' : '#64748b';
      const strokeWidth = isGhost ? 2 : 1;

      if (isGhost && alignment) {
        const transformedPoints = [];
        for (let i = 0; i < points.length; i += 2) {
          const p = alignment.transformFn(points[i], points[i+1]);
          if (p) transformedPoints.push(p.x, p.y);
        }
        return <Line key={`ghost-${idx}`} points={transformedPoints} stroke={color} strokeWidth={strokeWidth} />;
      }

      return <Line key={`dxf-${ent.handle || idx}`} points={points} stroke={color} strokeWidth={strokeWidth} />;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <LayoutTemplate className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Smart Sync: Kalibracja</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Synchronizacja stref z DXF</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setMode('1-point')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === '1-point' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            1 PUNKT (Przesunięcie)
          </button>
          <button 
            onClick={() => setMode('3-point')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === '3-point' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            3 PUNKTY (Adaptacja afiniczna)
          </button>
        </div>

        <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - DXF */}
        <div className="flex-1 border-r border-slate-800 flex flex-col relative group" ref={leftContainerRef}>
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold tracking-tighter flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" /> WIDOK DXF (ŹRÓDŁO)
          </div>
          
          <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={zoomToDxfExtents} className="px-3 py-1.5 bg-indigo-600 rounded-lg border border-indigo-500 hover:bg-indigo-500 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20">DOPASUJ WIDOK</button>
             <button onClick={() => setDxfPoints([])} className="px-3 py-1.5 bg-slate-900/90 rounded-lg border border-slate-700 hover:bg-slate-800 text-[10px] font-bold text-slate-400">RESET PUNKTÓW</button>
          </div>

          <Stage 
            width={leftSize.width} 
            height={leftSize.height}
            onClick={handleDxfClick}
            draggable
            onWheel={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;
              const oldScale = stage.scaleX();
              const pointer = stage.getPointerPosition();
              if (!pointer) return;
              
              const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
              const newScale = e.evt.deltaY < 0 ? oldScale * 1.15 : oldScale / 1.15;
              setDxfView({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, scale: newScale });
            }}
            scaleX={dxfView.scale}
            scaleY={-dxfView.scale} 
            x={dxfView.x}
            y={dxfView.y}
          >
            <Layer>
              {dxfData && dxfData.entities && renderDxfEntities(dxfData.entities)}
              
              {dxfPoints.map((p: Point, i: number) => (
                <Group key={`p-dxf-${i}`} x={p.x} y={p.y} scaleX={1/dxfView.scale} scaleY={-1/dxfView.scale}>
                  <Circle radius={CROSS_SIZE + 4} stroke="#f43f5e" strokeWidth={1} dash={[2, 2]} />
                  <Line points={[-CROSS_SIZE, 0, CROSS_SIZE, 0]} stroke="#f43f5e" strokeWidth={2} />
                  <Line points={[0, -CROSS_SIZE, 0, CROSS_SIZE]} stroke="#f43f5e" strokeWidth={2} />
                  <Text text={`P${i+1}`} fill="#f43f5e" y={-25} x={-10} fontSize={12} fontStyle="bold" align="center" />
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Right Side - Project */}
        <div className="flex-1 flex flex-col relative group" ref={rightContainerRef}>
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold tracking-tighter flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> WIDOK PROJEKTU (CEL)
          </div>

          <div className="absolute bottom-4 left-4 z-10 max-w-xs bg-slate-900/90 p-4 rounded-2xl border border-slate-700 text-[11px] leading-relaxed text-slate-400 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-slate-200 font-bold uppercase tracking-wider">
              <Info className="w-4 h-4 text-indigo-400" /> Instrukcja
            </div>
            {mode === '1-point' ? 
              "Znajdź charakterystyczny punkt (np. róg budynku) na podkładzie DXF, a następnie kliknij w to samo miejsce na rzucie projektu." :
              "Wskaż trzy punkty na DXF (p1, p2, p3) oraz ich odpowiedniki na projekcie (p1', p2', p3'). System dopasuje skalę, obrót i odbicie lustrzane."
            }
          </div>

          <Stage 
            width={rightSize.width} 
            height={rightSize.height}
            onClick={handleCanvasClick}
            draggable
            scaleX={canvasView.scale}
            scaleY={canvasView.scale}
            x={canvasView.x}
            y={canvasView.y}
            onWheel={(e) => {
              const stage = e.target.getStage();
              if (!stage) return;
              const oldScale = stage.scaleX();
              const pointer = stage.getPointerPosition();
              if (!pointer) return;
              
              const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
              const newScale = e.evt.deltaY < 0 ? oldScale * 1.15 : oldScale / 1.15;
              setCanvasView({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, scale: newScale });
            }}
          >
            <Layer>
              {underlayImg && (
                <KonvaImage image={underlayImg} />
              )}
              
              {/* Existing Zones Preview */}
              {zones.map(zone => (
                <Line 
                  key={zone.id} 
                  points={zone.points} 
                  closed 
                  stroke="rgba(148, 163, 184, 0.3)" 
                  fill="rgba(148, 163, 184, 0.05)" 
                  strokeWidth={1}
                />
              ))}

              {/* Ghost Layer Preview */}
              {alignment && dxfData && dxfData.entities && renderDxfEntities(dxfData.entities, true)}

              {canvasPoints.map((p: Point, i: number) => (
                <Group key={`p-can-${i}`} x={p.x} y={p.y} scaleX={1/canvasView.scale} scaleY={1/canvasView.scale}>
                  <Circle radius={CROSS_SIZE + 4} stroke="#10b981" strokeWidth={1} dash={[2, 2]} />
                  <Line points={[-CROSS_SIZE, 0, CROSS_SIZE, 0]} stroke="#10b981" strokeWidth={2} />
                  <Line points={[0, -CROSS_SIZE, 0, CROSS_SIZE]} stroke="#10b981" strokeWidth={2} />
                  <Text text={`P${i+1}'`} fill="#10b981" y={-25} x={-10} fontSize={12} fontStyle="bold" />
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-20 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-8">
        <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">PUNKTY KROSTOWE DXF</span>
              <div className="flex gap-2">
                 {[0, 1, 2].map(i => {
                   if (mode === '1-point' && i > 0) return null;
                   return (
                    <div key={`s-dxf-${i}`} className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${dxfPoints[i] ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                        {dxfPoints[i] ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="font-mono text-xs font-bold">{i + 1}</span>}
                    </div>
                   );
                 })}
              </div>
           </div>
           <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">PUNKTY PROJEKTU</span>
              <div className="flex gap-2">
                 {[0, 1, 2].map(i => {
                   if (mode === '1-point' && i > 0) return null;
                   return (
                    <div key={`s-can-${i}`} className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${canvasPoints[i] ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                        {canvasPoints[i] ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="font-mono text-xs font-bold">{i + 1}</span>}
                    </div>
                   );
                 })}
              </div>
           </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            Anuluj
          </button>
          <button 
            onClick={() => alignment && onConfirm(alignment)}
            disabled={!canConfirm}
            className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Zatwierdź dopasowanie
          </button>
        </div>
      </div>
    </div>
  );
}
