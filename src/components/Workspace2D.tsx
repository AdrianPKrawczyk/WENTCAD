import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Label, Tag, Group } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore, type Point, type FloorCanvasState } from '../stores/useCanvasStore';
import { useZoneStore } from '../stores/useZoneStore';
import { resolveZoneStyle } from '../lib/VisualStyles';
import { calculatePolygonArea } from '../lib/geometryUtils';
import { createPatternImage } from '../lib/patternUtils';
import { ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize2, Move, Loader2, Ruler, PencilRuler, Crosshair, Hexagon, X, Eye, EyeOff, Layers } from 'lucide-react';
import { CalibrationModal } from './CalibrationModal';
import { toast } from 'sonner';
import { renderDxfToDataUrl } from '../lib/dxfUtils';
import { DxfUnitModal } from './DxfUnitModal';

// PDF.js configuration
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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

  // Floor context from Project/Zone store
  const activeFloorId = useZoneStore((s) => s.activeFloorId || 'floor-parter');

  // Canvas store - Global/Ephemeral state
  const isCalibrating = useCanvasStore((s) => s.isCalibrating);
  const calibrationPoints = useCanvasStore((s) => s.calibrationPoints);
  const isMeasuring = useCanvasStore((s) => s.isMeasuring);
  const isSettingOrigin = useCanvasStore((s) => s.isSettingOrigin);

  const setIsCalibrating = useCanvasStore((s) => s.setIsCalibrating);
  const setCalibrationPoints = useCanvasStore((s) => s.setCalibrationPoints);
  const setIsMeasuring = useCanvasStore((s) => s.setIsMeasuring);
  const setIsSettingOrigin = useCanvasStore((s) => s.setIsSettingOrigin);
  const isDrawingPolygon = useCanvasStore((s) => s.isDrawingPolygon);
  const currentPolygonPoints = useCanvasStore((s) => s.currentPolygonPoints);
  const setIsDrawingPolygon = useCanvasStore((s) => s.setIsDrawingPolygon);
  const setCurrentPolygonPoints = useCanvasStore((s) => s.setCurrentPolygonPoints);

  // Canvas store - Floor specific state
  const activeFloorIdFromZone = useZoneStore((state) => state.activeFloorId); // Renamed to avoid conflict
  const floors = useZoneStore((state) => state.floors); // Floor metadata
  const activeFloorMetadata = floors[activeFloorIdFromZone];

  const canvasFloors = useCanvasStore((state) => state.floors);
  const activeCanvasFloor = canvasFloors[activeFloorIdFromZone];
  const { currentTool, redefiningZoneId } = activeCanvasFloor || { currentTool: null, redefiningZoneId: null };
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool);
  const setRedefiningZoneId = useCanvasStore((state) => state.setRedefiningZoneId);
  const updateFloorState = useCanvasStore((s) => s.updateFloorState);
  const clearUnderlay = useCanvasStore((s) => s.clearUnderlay);

  // Zone store - Floor definitions
  const projectFloors = useZoneStore((s) => s.floors);
  const setActiveFloor = useZoneStore((s) => s.setActiveFloor);
  const selectedZoneId = useZoneStore((s) => s.selectedZoneId);
  const zones = useZoneStore((s) => s.zones);
  const systems = useZoneStore((s) => s.systems);
  const updateZone = useZoneStore((s) => s.updateZone);
  const updateFloor = useZoneStore((s) => s.updateFloor);
  const checkedZoneIds = useZoneStore((s) => s.checkedZoneIds);
  const showZonesOnCanvas = useZoneStore((s) => s.showZonesOnCanvas);
  const toggleShowZonesOnCanvas = useZoneStore((s) => s.toggleShowZonesOnCanvas);
  const hiddenSystemIdsOnCanvas = useZoneStore((s) => s.hiddenSystemIdsOnCanvas);
  const toggleSystemVisibility = useZoneStore((s) => s.toggleSystemVisibility);
  const isZoneFilterPanelOpen = useZoneStore((s) => s.isZoneFilterPanelOpen);
  const setZoneFilterPanelOpen = useZoneStore((s) => s.setZoneFilterPanelOpen);
  const isSystemColoringEnabled = useZoneStore((s) => s.isSystemColoringEnabled);
  const globalSystemOpacity = useZoneStore((s) => s.globalSystemOpacity);
  const globalPatternScale = useZoneStore((s) => s.globalPatternScale) || 1.0;
  const setGlobalPatternScale = useZoneStore((s) => s.setGlobalPatternScale);

  const sortedFloors = Object.values(projectFloors).sort((a, b) => a.order - b.order);

  // Current floor computed state
  const floorState: FloorCanvasState = canvasFloors[activeFloorId] || {
    underlayUrl: null,
    underlaySize: null,
    underlayName: null,
    referenceOrigin: null,
    panPosition: { x: 0, y: 0 },
    zoomLevel: 1,
    polygons: []
  };

  const {
    underlayUrl,
    underlaySize,
    underlayName,
    scaleFactor,
    referenceOrigin,
    panPosition: position,
    zoomLevel: scale,
    polygons = []
  } = floorState;

  // Local state for UI feedback
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [pixelDistance, setPixelDistance] = useState(0);
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [underlayImage, setUnderlayImage] = useState<HTMLImageElement | null>(null);
  const [dxfModalOpen, setDxfModalOpen] = useState(false);
  const [pendingDxfContent, setPendingDxfContent] = useState<string | null>(null);
  const [pendingDxfFile, setPendingDxfFile] = useState<File | null>(null);

  // Update floor-specific state helpers
  const setFloorPositionAndScale = useCallback((zoomLevel: number, panPosition: Point) => {
    updateFloorState(activeFloorId, { zoomLevel, panPosition });
  }, [activeFloorId, updateFloorState]);

  const setUnderlay = useCallback((url: string | null, size: { width: number; height: number } | null, name: string | null) => {
    updateFloorState(activeFloorId, { underlayUrl: url, underlaySize: size, underlayName: name });
  }, [activeFloorId, updateFloorState]);

  const setScaleFactor = useCallback((factor: number | null) => {
    updateFloorState(activeFloorId, { scaleFactor: factor });
  }, [activeFloorId, updateFloorState]);

  const setReferenceOrigin = useCallback((point: Point | null) => {
    updateFloorState(activeFloorId, { referenceOrigin: point });
  }, [activeFloorId, updateFloorState]);

  // Hatch Pattern Cache (Dynamic on-the-fly generation)
  const patternCache = useRef<Record<string, HTMLCanvasElement>>({});

  useEffect(() => {
    if (!underlayUrl) {
      setUnderlayImage(null);
      return;
    }
    const img = new window.Image();
    img.src = underlayUrl;
    img.onload = () => setUnderlayImage(img);
  }, [underlayUrl]);

  const fitUnderlayToScreen = useCallback(() => {
    if (!underlaySize) return;
    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / underlaySize.width;
    const scaleY = (containerHeight - padding * 2) / underlaySize.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    const newX = (containerWidth - underlaySize.width * newScale) / 2;
    const newY = (containerHeight - underlaySize.height * newScale) / 2;
    setFloorPositionAndScale(newScale, { x: newX, y: newY });
  }, [underlaySize, containerWidth, containerHeight, setFloorPositionAndScale]);

  const addPolygon = useCallback((floorId: string, zoneId: string, points: Point[]) => {
    const flatPoints = points.flatMap(p => [p.x, p.y]);
    const newPolygon = { id: `poly-${Date.now()}`, zoneId, points: flatPoints };
    updateFloorState(floorId, { 
      polygons: [...(canvasFloors[floorId]?.polygons || []), newPolygon]
    });
    return newPolygon;
  }, [canvasFloors, updateFloorState]);

  // Fit underlay to screen when it loads, or when container resizes
  useEffect(() => {
    if (!underlayImage || !underlaySize) return;
    fitUnderlayToScreen();
  }, [underlayImage, containerWidth, containerHeight, fitUnderlayToScreen]);

  const fitToScreen = useCallback(() => {
    if (underlaySize) {
      fitUnderlayToScreen();
    } else {
      setFloorPositionAndScale(1, { x: 0, y: 0 });
    }
  }, [underlaySize, fitUnderlayToScreen, setFloorPositionAndScale]);

  // Pan state
  const isPanning = useRef(false);
  const isSpaceDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

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

    setFloorPositionAndScale(newScale, newPos);
  }, [scale, position, setFloorPositionAndScale]);

  // Pan via middle button or Space + Left click
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const stagePos = stage.getPointerPosition();
    if (!stagePos) return;

    let canvasPos = {
      x: (stagePos.x - position.x) / scale,
      y: (stagePos.y - position.y) / scale,
    };

    // SNAP TO 0,0
    if (referenceOrigin) {
      const snapThreshold = 15 / scale;
      const distToOrigin = Math.sqrt(Math.pow(canvasPos.x - referenceOrigin.x, 2) + Math.pow(canvasPos.y - referenceOrigin.y, 2));
      if (distToOrigin < snapThreshold) {
        canvasPos = { x: referenceOrigin.x, y: referenceOrigin.y };
      }
    }

    if (isCalibrating) {
      if (calibrationPoints.length < 2) {
        const newPoints = [...calibrationPoints, canvasPos];
        setCalibrationPoints(newPoints);

        if (newPoints.length === 2) {
          const dx = newPoints[1].x - newPoints[0].x;
          const dy = newPoints[1].y - newPoints[0].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          setPixelDistance(dist);
          setShowCalibrationModal(true);
        }
      }
      return;
    }

    if (isDrawingPolygon) {
      if (e.evt.button === 0) {
        if (currentTool === 'RECT') {
          if (currentPolygonPoints.length === 0) {
            setCurrentPolygonPoints([canvasPos]);
          } else {
            // Finish rectangle
            const p1 = currentPolygonPoints[0];
            const p2 = canvasPos;
            // Create 4 points for the rectangle
            const points = [
              { x: p1.x, y: p1.y },
              { x: p2.x, y: p1.y },
              { x: p2.x, y: p2.y },
              { x: p1.x, y: p2.y }
            ];
            const poly = addPolygon(activeFloorId, selectedZoneId!, points);
            const areaPx = calculatePolygonArea(poly.points);
            const areaM2 = areaPx * Math.pow(scaleFactor || 0, 2);
            
            updateZone(selectedZoneId!, { 
              geometryArea: areaM2,
              area: zones[selectedZoneId!]?.isAreaManual ? zones[selectedZoneId!]?.area : Math.round(areaM2 * 100) / 100
            });
            
            setIsDrawingPolygon(false);
            setCurrentPolygonPoints([]);
            toast.success('Narysowano prostokąt.');
          }
        } else {
          // PEN tool logic
          if (currentPolygonPoints.length > 2) {
            const firstPoint = currentPolygonPoints[0];
            const dist = Math.sqrt(Math.pow(canvasPos.x - firstPoint.x, 2) + Math.pow(canvasPos.y - firstPoint.y, 2));
            if (dist < 15 / scale) {
              const poly = addPolygon(activeFloorId, selectedZoneId!, currentPolygonPoints);
              const areaPx = calculatePolygonArea(poly.points);
              const areaM2 = areaPx * Math.pow(scaleFactor || 0, 2);
              
              updateZone(selectedZoneId!, { 
                geometryArea: areaM2,
                area: zones[selectedZoneId!]?.isAreaManual ? zones[selectedZoneId!]?.area : Math.round(areaM2 * 100) / 100
              });
              
              setIsDrawingPolygon(false);
              setCurrentPolygonPoints([]);
              toast.success('Pomyślnie narysowano obrys strefy.');
              return;
            }
          }
          setCurrentPolygonPoints([...currentPolygonPoints, canvasPos]);
        }
      }
      return;
    }

    if (isMeasuring) {
      if (measurePoints.length === 0 || measurePoints.length === 2) {
        setMeasurePoints([canvasPos]);
      } else if (measurePoints.length === 1) {
        setMeasurePoints([...measurePoints, canvasPos]);
      }
      return;
    }

    if (isSettingOrigin) {
      const oldOrigin = referenceOrigin || { x: 0, y: 0 };
      const dx = canvasPos.x - oldOrigin.x;
      const dy = canvasPos.y - oldOrigin.y;

      if (polygons.length > 0) {
        const updatedPolygons = polygons.map(poly => {
          const newPoints = [];
          for (let i = 0; i < poly.points.length; i += 2) {
            newPoints.push(poly.points[i] + dx);
            newPoints.push(poly.points[i + 1] + dy);
          }
          return { ...poly, points: newPoints };
        });
        
        updateFloorState(activeFloorId, { 
          referenceOrigin: canvasPos, 
          polygons: updatedPolygons 
        });
      } else {
        updateFloorState(activeFloorId, { referenceOrigin: canvasPos });
      }

      setIsSettingOrigin(false);
      toast.success('Punkt 0,0 zaktualizowany. Geometria stref została dopasowana do nowego punktu.');
      return;
    }

    if (e.evt.button === 1 || (e.evt.button === 0 && isSpaceDown.current)) {
      e.evt.preventDefault();
      isPanning.current = true;
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      const container = stageRef.current?.container();
      if (container) container.style.cursor = 'grabbing';
    }
  }, [
    isCalibrating, calibrationPoints, setCalibrationPoints, 
    position, scale, 
    isMeasuring, measurePoints, 
    isSettingOrigin, setIsSettingOrigin, setReferenceOrigin,
    isDrawingPolygon, currentPolygonPoints, setCurrentPolygonPoints,
    activeFloorId, selectedZoneId, addPolygon, calculatePolygonArea, scaleFactor, updateZone, setIsDrawingPolygon, zones,
    referenceOrigin, updateFloorState, polygons
  ]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const stagePos = stage.getPointerPosition();
    if (!stagePos) return;

    let canvasPos = {
      x: (stagePos.x - position.x) / scale,
      y: (stagePos.y - position.y) / scale,
    };

    // SNAP TO 0,0 (Preview)
    if (referenceOrigin && (isDrawingPolygon || isMeasuring)) {
      const snapThreshold = 15 / scale;
      const distToOrigin = Math.sqrt(Math.pow(canvasPos.x - referenceOrigin.x, 2) + Math.pow(canvasPos.y - referenceOrigin.y, 2));
      if (distToOrigin < snapThreshold) {
        canvasPos = { x: referenceOrigin.x, y: referenceOrigin.y };
      }
    }

    if (isCalibrating || isMeasuring || isSettingOrigin || isDrawingPolygon) {
      setMousePos(canvasPos);
      return;
    }

    if (!isPanning.current) return;
    const dx = e.evt.clientX - lastPointerPos.current.x;
    const dy = e.evt.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
    setFloorPositionAndScale(scale, { x: position.x + dx, y: position.y + dy });
  }, [isPanning, scale, position, setFloorPositionAndScale, isCalibrating, isMeasuring, isSettingOrigin, isDrawingPolygon]);

  const handleMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      isPanning.current = false;
      const container = stageRef.current?.container();
      if (container) container.style.cursor = isSpaceDown.current ? 'grab' : 'default';
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        isSpaceDown.current = true;
        const container = stageRef.current?.container();
        if (container) container.style.cursor = 'grab';
      }
      if (e.code === 'Escape') {
        if (isCalibrating) {
          setIsCalibrating(false);
          setCalibrationPoints([]);
        }
        if (isMeasuring) {
          setIsMeasuring(false);
          setMeasurePoints([]);
        }
        if (isSettingOrigin) {
          setIsSettingOrigin(false);
        }
        if (isDrawingPolygon) {
          setIsDrawingPolygon(false);
          setCurrentPolygonPoints([]);
        }
      }
      if (e.code === 'Enter' && isDrawingPolygon && currentPolygonPoints.length > 2) {
        // Close polygon via Enter
        const poly = addPolygon(activeFloorId, selectedZoneId!, currentPolygonPoints);
        const areaPx = calculatePolygonArea(poly.points);
        const areaM2 = areaPx * Math.pow(scaleFactor || 0, 2);
        
        const activeZone = zones[selectedZoneId!];
        const updates: any = { geometryArea: areaM2 };
        
        if (!activeZone?.isAreaManual) {
          updates.area = areaM2;
        }
        
        updateZone(selectedZoneId!, updates);
        
        setIsDrawingPolygon(false);
        setCurrentPolygonPoints([]);
        toast.success('Pomyślnie narysowano obrys strefy.');
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
  }, [
    isCalibrating, isMeasuring, isSettingOrigin, setIsCalibrating, setCalibrationPoints, setIsMeasuring, setIsSettingOrigin,
    isDrawingPolygon, currentPolygonPoints, setCurrentPolygonPoints,
    activeFloorId, selectedZoneId, addPolygon, scaleFactor, updateZone, setIsDrawingPolygon, zones, currentTool, updateFloorState, setRedefiningZoneId
  ]);

  // Update cursor
  useEffect(() => {
    const container = stageRef.current?.container();
    if (container) {
      if (isCalibrating || isMeasuring || isSettingOrigin || isDrawingPolygon) {
        container.style.cursor = 'crosshair';
      } else if (isSpaceDown.current) {
        container.style.cursor = 'grab';
      } else {
        container.style.cursor = 'default';
      }
    }
  }, [isCalibrating, isMeasuring, isSettingOrigin, isDrawingPolygon]);

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
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Could not create canvas context');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
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
          console.error('Błąd PDF:', error);
          toast.error('Wystąpił błąd podczas przetwarzania pliku PDF.');
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.toLowerCase().endsWith('.dxf')) {
      const readerDxf = new FileReader();
      readerDxf.onload = (ev) => {
        const content = ev.target?.result as string;
        setPendingDxfContent(content);
        setPendingDxfFile(file);
        setDxfModalOpen(true);
        setIsLoading(false);
      };
      readerDxf.readAsText(file);
    } else {
      reader.onload = (ev) => {
        try {
          const url = ev.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            setUnderlay(url, { width: img.naturalWidth, height: img.naturalHeight }, file.name);
            setIsLoading(false);
          };
          img.onerror = () => {
            toast.error('Błąd wczytywania obrazu.');
            setIsLoading(false);
          };
          img.src = url;
        } catch (error) {
          console.error('Błąd obrazu:', error);
          toast.error('Wystąpił błąd podczas wczytywania obrazu.');
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [setUnderlay]);

  const zoomPercent = Math.round(scale * 100);

  const drawGrid = () => {
    const gridSize = 50;
    const lines = [];
    const startX = Math.floor(-position.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-position.y / scale / gridSize) * gridSize;
    const endX = startX + containerWidth / scale + gridSize * 2;
    const endY = startY + containerHeight / scale + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      lines.push(<Line key={`v${x}`} points={[x, startY, x, endY]} stroke="#e5e7eb" strokeWidth={1 / scale} />);
    }
    for (let y = startY; y < endY; y += gridSize) {
      lines.push(<Line key={`h${y}`} points={[startX, y, endX, y]} stroke="#e5e7eb" strokeWidth={1 / scale} />);
    }
    return lines;
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-[#f0f2f5] overflow-hidden select-none ${className ?? ''}`}>
      {/* FLOATING FLOOR SWITCHER */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl pointer-events-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase px-1 tracking-wider">Kondygnacje</span>
        <div className="flex flex-col gap-1">
          {sortedFloors.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFloor(f.id)}
              className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFloorId === f.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{f.name}</span>
              </div>
              {canvasFloors[f.id]?.underlayUrl && (
                <div className={`w-1.5 h-1.5 rounded-full ${activeFloorId === f.id ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
              )}
            </button>
          ))}
        </div>
      </div>
      {/* FLOATING FILTER PANEL */}
      {isZoneFilterPanelOpen && (
        <div className="absolute top-4 right-4 z-20 w-64 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Widoczność Stref
            </h3>
            <button 
              onClick={() => setZoneFilterPanelOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                {showZonesOnCanvas ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                <span className={`text-xs ${showZonesOnCanvas ? 'font-bold text-slate-700' : 'text-slate-400'}`}>Wszystkie strefy</span>
              </div>
              <input 
                type="checkbox" 
                checked={showZonesOnCanvas} 
                onChange={() => toggleShowZonesOnCanvas()}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
              />
            </label>

            <div className="h-px bg-slate-100 my-1" />
            
            <div className="px-2 py-2 mb-1 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skala Deseniu</label>
                <span className="text-xs font-mono text-indigo-600 font-bold">{globalPatternScale.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="15.0" 
                step="0.05" 
                value={globalPatternScale}
                onChange={(e) => setGlobalPatternScale(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Systemy Wentylacyjne</span>

            {systems.map((sys) => (
              <label key={sys.id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: sys.color || '#cbd5e1' }} />
                  <span className={`text-xs ${!hiddenSystemIdsOnCanvas.includes(sys.id) ? 'font-medium text-slate-700' : 'text-slate-400 italic'}`}>
                    {sys.name}
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={!hiddenSystemIdsOnCanvas.includes(sys.id)} 
                  onChange={() => toggleSystemVisibility(sys.id)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                />
              </label>
            ))}

            <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-sm border border-dashed border-slate-300" />
                <span className={`text-xs ${!hiddenSystemIdsOnCanvas.includes('none') ? 'font-medium text-slate-700' : 'text-slate-400 italic'}`}>Brak systemu</span>
              </div>
              <input 
                type="checkbox" 
                checked={!hiddenSystemIdsOnCanvas.includes('none')} 
                onChange={() => toggleSystemVisibility('none')}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
              />
            </label>
          </div>
        </div>
      )}

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
        <Layer name="background">
          {drawGrid()}
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

          {/* Reference Origin Marker */}
          {referenceOrigin && (
            <>
              {/* Origin Axis */}
              <Line 
                points={[referenceOrigin.x - 200/scale, referenceOrigin.y, referenceOrigin.x + 200/scale, referenceOrigin.y]} 
                stroke="#6366f1" 
                strokeWidth={1 / scale} 
                dash={[5 / scale, 5 / scale]}
                opacity={0.5}
              />
              <Line 
                points={[referenceOrigin.x, referenceOrigin.y - 200/scale, referenceOrigin.x, referenceOrigin.y + 200/scale]} 
                stroke="#6366f1" 
                strokeWidth={1 / scale} 
                dash={[5 / scale, 5 / scale]}
                opacity={0.5}
              />
              <Circle x={referenceOrigin.x} y={referenceOrigin.y} radius={8 / scale} stroke="#6366f1" strokeWidth={2 / scale} />
              <Text 
                x={referenceOrigin.x + 10 / scale} 
                y={referenceOrigin.y + 10 / scale} 
                text={`PUNKT 0,0${activeFloorMetadata?.originDescription ? `\n(${activeFloorMetadata.originDescription})` : ''}`} 
                fontSize={10 / scale} 
                fill="#6366f1" 
                fontStyle="bold" 
              />
            </>
          )}

          {/* Setting Origin Visual */}
          {isSettingOrigin && (
            <>
              <Line points={[mousePos.x - 10 / scale, mousePos.y, mousePos.x + 10 / scale, mousePos.y]} stroke="#ef4444" strokeWidth={2 / scale} />
              <Line points={[mousePos.x, mousePos.y - 10 / scale, mousePos.x, mousePos.y + 10 / scale]} stroke="#ef4444" strokeWidth={2 / scale} />
            </>
          )}

          {/* Calibration Line Visual */}
          {isCalibrating && calibrationPoints.length > 0 && (
            <Line
              points={[
                calibrationPoints[0].x,
                calibrationPoints[0].y,
                calibrationPoints.length === 2 ? calibrationPoints[1].x : mousePos.x,
                calibrationPoints.length === 2 ? calibrationPoints[1].y : mousePos.y
              ]}
              stroke="#4f46e5"
              strokeWidth={2 / scale}
              dash={[5 / scale, 5 / scale]}
            />
          )}
          {isCalibrating && calibrationPoints.map((p, i) => (
            <Circle key={i} x={p.x} y={p.y} radius={4 / scale} fill="#4f46e5" stroke="white" strokeWidth={1 / scale} />
          ))}
          {/* Polygons */}
          {showZonesOnCanvas && polygons.map((poly) => {
            const zone = zones[poly.zoneId];
            if (!zone) return null;
            
            // System Filtering Logic
            const isSupplyHidden = zone.systemSupplyId ? hiddenSystemIdsOnCanvas.includes(zone.systemSupplyId) : false;
            const isExhaustHidden = zone.systemExhaustId ? hiddenSystemIdsOnCanvas.includes(zone.systemExhaustId) : false;
            const isNoneHidden = (!zone.systemSupplyId && !zone.systemExhaustId) ? hiddenSystemIdsOnCanvas.includes('none') : false;

            // If any associated system is hidden, or if no system and 'none' is hidden
            if (isSupplyHidden || isExhaustHidden || isNoneHidden) return null;

            // Resolve base color and patterns using dedicated algorithm
            const style = resolveZoneStyle(zone, systems, globalSystemOpacity);
            const shouldUseSystemStyle = isSystemColoringEnabled && style.color;
            const baseColor = shouldUseSystemStyle ? (style.color || '#0ea5e9') : '#0ea5e9';
            
            const isRedefining = redefiningZoneId === poly.zoneId;
            const isChecked = checkedZoneIds.includes(zone.id);
            const isSelected = selectedZoneId === zone.id;

            let currentFill = isRedefining ? '#ef444460' : baseColor;
            
            // Adjust opacity based on state to ensure underlay is visible
            if (!isRedefining && !isChecked && !isSelected) {
               if (shouldUseSystemStyle && style.color) {
                  // If we have a system color (rgba), it should already have some opacity from resolveZoneStyle
                  currentFill = style.color; 
               } else {
                  currentFill = baseColor + '40';
               }
            }

            let currentStroke = isRedefining ? '#ef4444' : baseColor;
            let currentStrokeWidth = (isRedefining ? 3 : 2) / scale;
            let shadowProps: any = {};

            if (!isRedefining) {
              if (isChecked) {
                currentFill = '#f59e0b80'; // Amber/orange 50% opacity
                currentStroke = '#d97706';
                currentStrokeWidth = 4 / scale;
                shadowProps = { shadowColor: '#f59e0b', shadowBlur: 15 / scale, shadowOpacity: 0.8 };
              } else if (isSelected) {
                currentFill = '#4f46e560'; // Indigo 35% opacity
                currentStroke = '#4338ca';
                currentStrokeWidth = 3 / scale;
              }
            }

            // Pobranie oryginalnego systemu, by bezpiecznie wyciągnąć patternId z pominięciem resolveZoneStyle
            const targetSystem = (systems as any[]).find(s => s.id === zone.systemSupplyId) || (systems as any[]).find(s => s.id === zone.systemExhaustId);
            const activePatternId = (style as any).patternId || targetSystem?.patternId;

            // Wyciągnięcie solidnego koloru (usunięcie przezroczystości z rgba) dla ostrego deseniu
            const solidColor = style.color ? style.color.replace(/, [\d\.]+\)$/, ', 1)') : '#0ea5e9';

            // === GENERATE PATTERN IMAGE FROM CACHE ON THE FLY ===
            let patternImg: HTMLCanvasElement | null = null;
            if (shouldUseSystemStyle && activePatternId) {
              const cacheKey = `${activePatternId}-${solidColor}`;
              if (!patternCache.current[cacheKey]) {
                const newPattern = createPatternImage(activePatternId as string, solidColor);
                if (newPattern) patternCache.current[cacheKey] = newPattern;
              }
              patternImg = patternCache.current[cacheKey] || null;
            }
            
            return (
              <Group key={poly.id}>
                {/* Background Layer */}
                <Line
                  points={poly.points}
                  closed={true}
                  fill={currentFill}
                  stroke={currentStroke}
                  strokeWidth={currentStrokeWidth}
                  dash={isRedefining ? [5 / scale, 5 / scale] : []}
                  opacity={isRedefining ? 0.8 : 1}
                  {...shadowProps}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      if (currentTool === 'ERASER') container.style.cursor = 'crosshair';
                      else container.style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                  onClick={(e) => {
                    if (currentTool === 'ERASER') {
                      if (window.confirm("Czy na pewno usunąć obrys tej strefy?")) {
                        const updatedPolygons = polygons.filter(p => p.id !== poly.id);
                        updateFloorState(activeFloorId, { polygons: updatedPolygons });
                        updateZone(poly.zoneId, { geometryArea: null });
                        toast.success('Usunięto obrys.');
                      }
                      return;
                    }
                    if (e.evt.shiftKey) {
                      const updatedPolygons = polygons.filter(p => p.id !== poly.id);
                      updateFloorState(activeFloorId, { polygons: updatedPolygons });
                      toast.success('Usunięto obrys strefy.');
                    } else {
                      useZoneStore.getState().setSelectedZone(poly.zoneId);
                      toast.info(`Wybrano strefę: ${zone.nr} - ${zone.name}`);
                    }
                  }}
                />
                
                {/* Hatch Pattern Layer (System View Only) */}
                {!isRedefining && patternImg && (
                  <Line
                    points={poly.points}
                    closed={true}
                    fillPatternImage={patternImg as any}
                    fillPatternRepeat="repeat"
                    fillPatternScale={{ 
                      x: (1 / scale) * globalPatternScale, 
                      y: (1 / scale) * globalPatternScale 
                    }}
                    listening={false}
                  />
                )}
              </Group>
            );
          })}

          {/* Current Drawing Polygon (PEN) */}
          {(isDrawingPolygon && currentTool === 'PEN') && currentPolygonPoints.length > 0 && (
            <>
              <Line
                points={[...currentPolygonPoints.flatMap(p => [p.x, p.y]), mousePos.x, mousePos.y]}
                stroke="#0ea5e9"
                strokeWidth={2 / scale}
                dash={[5 / scale, 5 / scale]}
              />
              {currentPolygonPoints.map((p, i) => (
                <Circle 
                  key={i} 
                  x={p.x} 
                  y={p.y} 
                  radius={4 / scale} 
                  fill="#0ea5e9" 
                  stroke="white" 
                  strokeWidth={1 / scale} 
                />
              ))}
            </>
          )}

          {/* Current Drawing Rectangle (RECT) */}
          {(isDrawingPolygon && currentTool === 'RECT') && currentPolygonPoints.length === 1 && (
            <Line
              points={[
                currentPolygonPoints[0].x, currentPolygonPoints[0].y,
                mousePos.x, currentPolygonPoints[0].y,
                mousePos.x, mousePos.y,
                currentPolygonPoints[0].x, mousePos.y
              ]}
              closed={true}
              stroke="#0ea5e9"
              strokeWidth={2 / scale}
              fill="#0ea5e920"
              dash={[5 / scale, 5 / scale]}
            />
          )}

          {/* Measuring Line Visual */}
          {(isMeasuring || measurePoints.length === 2) && measurePoints.length > 0 && (
            <>
              <Line
                points={[
                  measurePoints[0].x,
                  measurePoints[0].y,
                  measurePoints.length === 2 ? measurePoints[1].x : mousePos.x,
                  measurePoints.length === 2 ? measurePoints[1].y : mousePos.y
                ]}
                stroke="#f97316"
                strokeWidth={2 / scale}
                dash={[5 / scale, 5 / scale]}
              />
              <Circle x={measurePoints[0].x} y={measurePoints[0].y} radius={4 / scale} fill="#f97316" stroke="white" strokeWidth={1 / scale} />
              {measurePoints.length === 2 && (
                <Circle x={measurePoints[1].x} y={measurePoints[1].y} radius={4 / scale} fill="#f97316" stroke="white" strokeWidth={1 / scale} />
              )}
              {(() => {
                const p1 = measurePoints[0];
                const p2 = measurePoints.length === 2 ? measurePoints[1] : mousePos;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distPx = Math.sqrt(dx * dx + dy * dy);
                const distM = scaleFactor ? distPx * scaleFactor : 0;
                
                return (
                  <Label x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2} listening={false}>
                    <Tag fill="rgba(249, 115, 22, 0.9)" pointerDirection="down" pointerWidth={10 / scale} pointerHeight={10 / scale} lineJoin="round" shadowColor="black" shadowBlur={10} shadowOpacity={0.2} cornerRadius={4 / scale} />
                    <Text text={`${distM.toFixed(2)} m`} fontFamily="monospace" fontSize={14 / scale} padding={5 / scale} fill="white" fontStyle="bold" />
                  </Label>
                );
              })()}
            </>
          )}
        </Layer>
        <Layer name="content" />
      </Stage>

      {/* TOOLBAR */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 z-10">
        <button onClick={() => fileInputRef.current?.click()} title="Wczytaj podkład" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
          <ImageIcon className="w-4 h-4" />
          Podkład
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <button
          onClick={() => {
            if (isCalibrating) {
              setIsCalibrating(false);
              setCalibrationPoints([]);
            } else {
              setIsCalibrating(true);
              setCalibrationPoints([]);
              toast.info('Tryb kalibracji: Kliknij dwa punkty na podkładzie.');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCalibrating ? 'bg-indigo-600 text-white shadow-inner' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
        >
          <Ruler className="w-4 h-4" />
          Kalibruj
        </button>

        <button
          onClick={() => {
            if (!scaleFactor && !isMeasuring) {
              toast.error('Skalibruj podkład przed wykonaniem pomiaru.');
              return;
            }
            if (isMeasuring) {
              setIsMeasuring(false);
              setMeasurePoints([]);
            } else {
              setIsMeasuring(true);
              setMeasurePoints([]);
              toast.info('Tryb pomiaru: Kliknij dwa punkty.');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isMeasuring ? 'bg-orange-600 text-white shadow-inner' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'}`}
        >
          <PencilRuler className="w-4 h-4" />
          Zmierz
        </button>

        <button
          onClick={() => {
            if (isSettingOrigin) {
              setIsSettingOrigin(false);
            } else {
              setIsSettingOrigin(true);
              toast.info('Ustaw Punkt Bazowy budynku.');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSettingOrigin ? 'bg-red-600 text-white shadow-inner' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}
        >
          <Crosshair className="w-4 h-4" />
          Punkt 0,0
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setCurrentTool(activeFloorId, 'PEN')}
            className={`p-1.5 rounded-md transition-all ${currentTool === 'PEN' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Pióro (Poligon)"
          >
            <Hexagon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentTool(activeFloorId, 'RECT')}
            className={`p-1.5 rounded-md transition-all ${currentTool === 'RECT' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Prostokąt"
          >
            <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
          </button>
          <button
            onClick={() => setCurrentTool(activeFloorId, 'ERASER')}
            className={`p-1.5 rounded-md transition-all ${currentTool === 'ERASER' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Gumka"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          disabled={!selectedZoneId || !scaleFactor}
          onClick={() => {
            if (isDrawingPolygon) {
              setIsDrawingPolygon(false);
              setCurrentPolygonPoints([]);
              setRedefiningZoneId(activeFloorId, null);
            } else {
              setIsDrawingPolygon(true);
              setCurrentPolygonPoints([]);
              if (!currentTool) setCurrentTool(activeFloorId, 'PEN');
              toast.info(`Rysowanie strefy: ${zones[selectedZoneId!]?.name || 'Nieznana'}.`);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            isDrawingPolygon ? 'bg-sky-600 text-white shadow-inner' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isDrawingPolygon ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
          {isDrawingPolygon ? 'Anuluj' : 'Rysuj'}
        </button>

        {isDrawingPolygon && currentPolygonPoints.length > 2 && (
          <button
            onClick={() => {
              const poly = addPolygon(activeFloorId, selectedZoneId!, currentPolygonPoints);
              const areaPx = calculatePolygonArea(poly.points);
              const areaM2 = areaPx * Math.pow(scaleFactor || 0, 2);
              
              const activeZone = zones[selectedZoneId!];
              const updates: any = { geometryArea: areaM2 };
              
              // area sync logic is now handled in resolveZonesState in store, 
              // so we don't strictly need to do it here, but it's good for immediate UI feedback.
              if (!activeZone?.isAreaManual) {
                updates.area = Math.round(areaM2 * 100) / 100;
              }
              
              updateZone(selectedZoneId!, updates);
              setRedefiningZoneId(activeFloorId, null);
              
              setIsDrawingPolygon(false);
              setCurrentPolygonPoints([]);
              toast.success('Pomyślnie narysowano obrys strefy.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white shadow-lg animate-bounce"
          >
            Zakończ obrys
          </button>
        )}

        {selectedZoneId && (
          <div className="flex items-center px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700">
              Strefa: {zones[selectedZoneId]?.nr || '?'} - {zones[selectedZoneId]?.name || '?'}
              {zones[selectedZoneId]?.geometryArea !== null && !zones[selectedZoneId]?.isAreaManual && ' (Połączona)'}
              {zones[selectedZoneId]?.isAreaManual && ' (Manual)'}
            </span>
          </div>
        )}

        {referenceOrigin && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-indigo-100 shadow-sm">
            <Crosshair className="w-3 h-3 text-indigo-500" />
            <input 
              type="text" 
              className="text-[10px] w-48 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400"
              placeholder="Opis punktu 0,0 (np. Przecięcie osi A-1)"
              value={activeFloorMetadata?.originDescription || ""}
              onChange={(e) => updateFloor(activeFloorId, { originDescription: e.target.value })}
            />
          </div>
        )}

        {underlayName && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-gray-500 max-w-[120px] truncate" title={underlayName}>{underlayName}</span>
            <button onClick={() => clearUnderlay(activeFloorId)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all" title="Usuń podkład (Rysunki zostaną)">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <div className="h-4 w-px bg-gray-200" />

        <button onClick={() => {
          const newScale = Math.max(scale / ZOOM_SENSITIVITY, MIN_SCALE);
          const cx = containerWidth / 2;
          const cy = containerHeight / 2;
          const newPos = { x: cx - (cx - position.x) * (newScale / scale), y: cy - (cy - position.y) * (newScale / scale) };
          setFloorPositionAndScale(newScale, newPos);
        }} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-gray-600 w-12 text-center">{zoomPercent}%</span>

        <button onClick={() => {
          const newScale = Math.min(scale * ZOOM_SENSITIVITY, MAX_SCALE);
          const cx = containerWidth / 2;
          const cy = containerHeight / 2;
          const newPos = { x: cx - (cx - position.x) * (newScale / scale), y: cy - (cy - position.y) * (newScale / scale) };
          setFloorPositionAndScale(newScale, newPos);
        }} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
          <ZoomIn className="w-4 h-4" />
        </button>

        <button onClick={fitToScreen} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1 px-1 py-1 text-[10px] text-gray-400">
          <Move className="w-3 h-3" />
          <span>Scroll=Zoom, MMB=Pan</span>
        </div>
      </div>

      {!underlayImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <div className="text-6xl mb-3">🗺️</div>
            <p className="text-sm font-bold text-gray-500">Kondygnacja: {activeFloorId}</p>
            <p className="text-xs text-gray-400 mt-1">Wczytaj podkład dla tego piętra</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,.pdf" className="hidden" onChange={handleFileChange} />

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="font-semibold text-gray-900">Renderowanie...</p>
          </div>
        </div>
      )}

      <CalibrationModal
        isOpen={showCalibrationModal}
        pixelDistance={pixelDistance}
        onConfirm={(realMeters) => {
          const factor = realMeters / pixelDistance;
          setScaleFactor(factor);
          setShowCalibrationModal(false);
          setIsCalibrating(false);
          setCalibrationPoints([]);
          toast.success(`Skalibrowano: 1px = ${(factor * 1000).toFixed(2)}mm`);
        }}
        onCancel={() => {
          setShowCalibrationModal(false);
          setCalibrationPoints([]);
        }}
      />

      <DxfUnitModal 
        isOpen={dxfModalOpen}
        fileName={pendingDxfFile?.name || ''}
        onCancel={() => {
          setDxfModalOpen(false);
          setPendingDxfContent(null);
          setPendingDxfFile(null);
        }}
        onConfirm={async (multiplier, unitLabel) => {
          if (!pendingDxfContent) return;
          setIsLoading(true);
          try {
            const result = await renderDxfToDataUrl(pendingDxfContent);
            if (result) {
              setUnderlay(
                result.dataUrl, 
                { width: result.width, height: result.height }, 
                `[DXF] ${pendingDxfFile?.name}`
              );
              setScaleFactor(multiplier);
              toast.success(`Zaimportowano DXF. Jednostki: ${unitLabel}`);
            } else {
              toast.error("Błąd podczas renderowania pliku DXF.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Wystąpił nieoczekiwany błąd podczas importu DXF.");
          }
          setDxfModalOpen(false);
          setPendingDxfContent(null);
          setPendingDxfFile(null);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
