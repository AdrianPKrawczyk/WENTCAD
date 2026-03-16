import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../stores/useCanvasStore';
import { ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize2, Move, Loader2 } from 'lucide-react';

// PDF.js configuration
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 1.12;

interface Workspace2DProps {
  className?: string;
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(ref.current);
    // Initial size
    setSize({ width: ref.current.clientWidth, height: ref.current.clientHeight });
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export function Workspace2D({ className }: Workspace2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  const scale = useCanvasStore((s) => s.scale);
  const position = useCanvasStore((s) => s.position);
  const underlayUrl = useCanvasStore((s) => s.underlayUrl);
  const underlaySize = useCanvasStore((s) => s.underlaySize);
  const underlayName = useCanvasStore((s) => s.underlayName);
  const setScaleAndPosition = useCanvasStore((s) => s.setScaleAndPosition);
  const setUnderlay = useCanvasStore((s) => s.setUnderlay);
  const clearUnderlay = useCanvasStore((s) => s.clearUnderlay);

  const [isLoading, setIsLoading] = useState(false);
  // Underlay image HTMLImageElement
  const [underlayImage, setUnderlayImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!underlayUrl) {
      setUnderlayImage(null);
      return;
    }
    const img = new window.Image();
    img.src = underlayUrl;
    img.onload = () => setUnderlayImage(img);
  }, [underlayUrl]);

  // Fit underlay to screen when it loads, or when container resizes
  useEffect(() => {
    if (!underlayImage || !underlaySize) return;
    fitUnderlayToScreen();
  }, [underlayImage, containerWidth, containerHeight]);

  // Pan state
  const isPanning = useRef(false);
  const isSpaceDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  const fitUnderlayToScreen = useCallback(() => {
    if (!underlaySize) return;
    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / underlaySize.width;
    const scaleY = (containerHeight - padding * 2) / underlaySize.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    const newX = (containerWidth - underlaySize.width * newScale) / 2;
    const newY = (containerHeight - underlaySize.height * newScale) / 2;
    setScaleAndPosition(newScale, { x: newX, y: newY });
  }, [underlaySize, containerWidth, containerHeight, setScaleAndPosition]);

  const fitToScreen = useCallback(() => {
    if (underlaySize) {
      fitUnderlayToScreen();
    } else {
      setScaleAndPosition(1, { x: 0, y: 0 });
    }
  }, [underlaySize, fitUnderlayToScreen, setScaleAndPosition]);

  // Zoom to pointer
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = direction > 0
      ? Math.min(oldScale * ZOOM_SENSITIVITY, MAX_SCALE)
      : Math.max(oldScale / ZOOM_SENSITIVITY, MIN_SCALE);

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScaleAndPosition(newScale, newPos);
  }, [scale, position, setScaleAndPosition]);

  // Pan via middle button or Space + Left click
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && isSpaceDown.current)) {
      e.evt.preventDefault();
      isPanning.current = true;
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      const container = stageRef.current?.container();
      if (container) container.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning.current) return;
    const dx = e.evt.clientX - lastPointerPos.current.x;
    const dy = e.evt.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
    setScaleAndPosition(scale, { x: position.x + dx, y: position.y + dy });
  }, [isPanning, scale, position, setScaleAndPosition]);

  const handleMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      isPanning.current = false;
      const container = stageRef.current?.container();
      if (container) container.style.cursor = isSpaceDown.current ? 'grab' : 'default';
    }
  }, []);

  // Space key for pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpaceDown.current = true;
        const container = stageRef.current?.container();
        if (container) container.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDown.current = false;
        const container = stageRef.current?.container();
        if (container && !isPanning.current) container.style.cursor = 'default';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      reader.onload = async (ev) => {
        try {
          const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);
          
          // Render at high resolution
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) throw new Error('Could not create canvas context');
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            // @ts-ignore - Some versions of pdfjs-dist types require canvas
            canvas: canvas,
          }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          const img = new window.Image();
          img.onload = () => {
            setUnderlay(dataUrl, { width: img.naturalWidth, height: img.naturalHeight }, file.name);
            setIsLoading(false);
          };
          img.src = dataUrl;
        } catch (error) {
          console.error('Error processing PDF:', error);
          alert('Błąd podczas przetwarzania pliku PDF.');
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          setUnderlay(url, { width: img.naturalWidth, height: img.naturalHeight }, file.name);
          setIsLoading(false);
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    }
    // Reset input so the same file can be re-loaded
    e.target.value = '';
  }, [setUnderlay]);

  const zoomPercent = Math.round(scale * 100);

  // Grid lines for empty canvas
  const drawGrid = () => {
    const gridSize = 50;
    const lines = [];
    const startX = Math.floor(-position.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-position.y / scale / gridSize) * gridSize;
    const endX = startX + containerWidth / scale + gridSize * 2;
    const endY = startY + containerHeight / scale + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      lines.push(
        <Line key={`v${x}`} points={[x, startY, x, endY]} stroke="#e5e7eb" strokeWidth={1 / scale} />
      );
    }
    for (let y = startY; y < endY; y += gridSize) {
      lines.push(
        <Line key={`h${y}`} points={[startX, y, endX, y]} stroke="#e5e7eb" strokeWidth={1 / scale} />
      );
    }
    return lines;
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-[#f0f2f5] overflow-hidden select-none ${className ?? ''}`}>
      {/* CANVAS */}
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ background: '#f0f2f5' }}
      >
        {/* BACKGROUND LAYER */}
        <Layer name="background">
          {/* Grid */}
          {drawGrid()}

          {/* Underlay Image */}
          {underlayImage && underlaySize && (
            <KonvaImage
              image={underlayImage}
              x={0}
              y={0}
              width={underlaySize.width}
              height={underlaySize.height}
              listening={false}
            />
          )}
        </Layer>

        {/* CONTENT LAYER - Reserved for Zones, etc. */}
        <Layer name="content">
          {/* Future zone polygons will go here */}
        </Layer>
      </Stage>

      {/* FLOATING TOOLBAR */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 z-10">
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Wczytaj podkład (PNG/JPG)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
        >
          <ImageIcon className="w-4 h-4" />
          Podkład
        </button>

        {underlayName && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 max-w-[120px] truncate" title={underlayName}>
              {underlayName}
            </span>
            <button
              onClick={clearUnderlay}
              title="Usuń podkład"
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <div className="h-4 w-px bg-gray-200" />

        {/* Zoom controls */}
        <button
          onClick={() => {
            const newScale = Math.max(scale / ZOOM_SENSITIVITY, MIN_SCALE);
            const cx = containerWidth / 2;
            const cy = containerHeight / 2;
            const newPos = {
              x: cx - (cx - position.x) * (newScale / scale),
              y: cy - (cy - position.y) * (newScale / scale),
            };
            setScaleAndPosition(newScale, newPos);
          }}
          title="Oddal"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-gray-600 w-12 text-center">
          {zoomPercent}%
        </span>

        <button
          onClick={() => {
            const newScale = Math.min(scale * ZOOM_SENSITIVITY, MAX_SCALE);
            const cx = containerWidth / 2;
            const cy = containerHeight / 2;
            const newPos = {
              x: cx - (cx - position.x) * (newScale / scale),
              y: cy - (cy - position.y) * (newScale / scale),
            };
            setScaleAndPosition(newScale, newPos);
          }}
          title="Przybliż"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={fitToScreen}
          title="Dopasuj do okna"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1 px-1 py-1 text-[10px] text-gray-400">
          <Move className="w-3 h-3" />
          <span>Scroll=Zoom, MMB/Spacja=Pan</span>
        </div>
      </div>

      {/* Empty state hint */}
      {!underlayImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <div className="text-6xl mb-3">🗺️</div>
            <p className="text-sm font-bold text-gray-500">Przestrzeń Robocza 2D</p>
            <p className="text-xs text-gray-400 mt-1">Wczytaj podkład architektoniczny lub użyj Kreatora Stref</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-gray-900">Przetwarzanie dokumentu...</p>
              <p className="text-sm text-gray-500">Renderowanie strony PDF</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
