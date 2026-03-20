import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Label, Tag, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore, type Point, type FloorCanvasState } from '../stores/useCanvasStore';
import { useZoneStore } from '../stores/useZoneStore';
import { useDuctStore } from '../stores/useDuctStore';
import { useUIStore } from '../stores/useUIStore';
import { resolveZoneStyle } from '../lib/VisualStyles';
import { calculatePolygonArea, calculatePolygonCentroid, getClosestPointOnSegment } from '../lib/geometryUtils';
import { createPatternImage } from '../lib/patternUtils';
import { ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize2, Move, Loader2, Ruler, PencilRuler, Crosshair, Hexagon, X, Eye, EyeOff, Layers, Link, Tag as TagIcon, Download, Crop, Route, MousePointer2 } from 'lucide-react';
import { CalibrationModal } from './CalibrationModal';
import { SmartTagModal } from './SmartTagModal';
import { toast } from 'sonner';
import { renderDxfToDataUrl, parseDxfFile } from '../lib/dxfUtils';
import { DxfUnitModal } from './DxfUnitModal';
import { LinkOutlineModal } from './LinkOutlineModal';
import { ExportModal } from './ExportModal';
import { exportToDXF, downloadDXF } from '../lib/dxfExport';

// PDF.js configuration
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 1.12;

const measureTextWidth = (text: string, fontSize: number): number => {
  if (!text) return 0;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.font = `${fontSize}px sans-serif`;
    const lines = text.split('\n');
    return Math.max(...lines.map(line => context.measureText(line).width));
  }
  return 0;
};

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
  const currentStage = useUIStore((s) => s.currentStage);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const uiLayerRef = useRef<Konva.Layer>(null);
  const contentLayerRef = useRef<Konva.Layer>(null);
  const uiOverlayLayerRef = useRef<Konva.Layer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  // Floor context from Project/Zone store
  const activeFloorId = useZoneStore((s) => s.activeFloorId || Object.keys(s.floors)[0]);

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
  const addZone = useZoneStore((s) => s.addZone);
  const updateFloor = useZoneStore((s) => s.updateFloor);
  const checkedZoneIds = useZoneStore((s) => s.checkedZoneIds);
  const showZonesOnCanvas = useZoneStore((s) => s.showZonesOnCanvas);
  const toggleShowZonesOnCanvas = useZoneStore((s) => s.toggleShowZonesOnCanvas);
  const hiddenSystemIdsOnCanvas = useZoneStore((s) => s.hiddenSystemIdsOnCanvas);
  const toggleSystemVisibility = useZoneStore((s) => s.toggleSystemVisibility);
  const isZoneFilterPanelOpen = useZoneStore((s) => s.isZoneFilterPanelOpen);
  const setZoneFilterPanelOpen = useZoneStore((s) => s.setZoneFilterPanelOpen);
  const globalSystemOpacity = useZoneStore((s) => s.globalSystemOpacity);
  const globalPatternScale = useZoneStore((s) => s.globalPatternScale) || 1.0;
  const globalTagSettings = useZoneStore((s) => s.globalTagSettings);
  const dxfExportSettings = useZoneStore((s) => s.dxfExportSettings);
  const setGlobalPatternScale = useZoneStore((s) => s.setGlobalPatternScale);

  // Duct store
  const ductNodes = useDuctStore((s) => s.nodes || {});
  const ductEdges = useDuctStore((s) => s.edges || {});
  const drawingSystemId = useDuctStore((s) => s.drawingSystemId);
  const activeNodeId = useDuctStore((s) => s.activeNodeId);
  const selectedNodeId = useDuctStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDuctStore((s) => s.selectedEdgeId);
  const setDrawingSystemId = useDuctStore((s) => s.setDrawingSystemId);
  const setActiveNodeId = useDuctStore((s) => s.setActiveNodeId);
  const setSelectedNodeId = useDuctStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useDuctStore((s) => s.setSelectedEdgeId);
  const addDuctNode = useDuctStore((s) => s.addNode);
  const updateDuctNode = useDuctStore((s) => s.updateNode);
  const addDuctEdge = useDuctStore((s) => s.addEdge);
  const updateDuctEdge = useDuctStore((s) => s.updateEdge);

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
  const [pendingDxf, setPendingDxf] = useState<any>(null); // przechowuje zdekodowany obiekt
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [pendingDxfLayers, setPendingDxfLayers] = useState<string[]>([]);
  const [pendingDxfFile, setPendingDxfFile] = useState<File | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [forceHideUnderlay, setForceHideUnderlay] = useState(false);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);

  const linkingZoneId = useZoneStore((s) => s.linkingZoneId);
  const setLinkingZoneId = useZoneStore((s) => s.setLinkingZoneId);
  const selectedDxfOutlineId = useZoneStore((s) => s.selectedDxfOutlineId);
  const setSelectedDxfOutlineId = useZoneStore((s) => s.setSelectedDxfOutlineId);

  const generateTagText = useCallback((zoneId: string) => {
    const zone = zones[zoneId];
    if (!zone) return { col1: '', col2: '' };

    const activeFields = globalTagSettings.fields
      .filter(f => f.enabled)
      .sort((a, b) => a.order - b.order);

    const getColumnText = (col: 1 | 2) => activeFields
      .filter(f => f.column === col)
      .map(f => {
        let val: string | number = '--';
        switch (f.type) {
          case 'ROOM_NR_NAME': val = `${zone.nr} ${zone.name}`; break;
          case 'AREA': val = (zone.area || 0).toFixed(2); break;
          case 'VOLUME': val = (zone.calculatedVolume || 0).toFixed(2); break;
          case 'FLOW_SUPPLY': val = Math.round(zone.calculatedVolume || 0); break;
          case 'FLOW_EXHAUST': val = Math.round(zone.calculatedExhaust || 0); break;
          case 'FLOW_SUPPLY_WITH_SYSTEM': {
            const flow = Math.round(zone.calculatedVolume || 0);
            const system = systems.find(s => s.id === zone.systemSupplyId)?.id || '--';
            val = `${system}: ${flow}`;
            break;
          }
          case 'FLOW_EXHAUST_WITH_SYSTEM': {
            const flow = Math.round(zone.calculatedExhaust || 0);
            const system = systems.find(s => s.id === zone.systemExhaustId)?.id || '--';
            val = `${system}: ${flow}`;
            break;
          }
          case 'REAL_ACH': val = (zone.realACH || 0).toFixed(1); break;
          case 'ACOUSTICS': val = zone.maxAllowedDbA || '--'; break;
          case 'SUPPLY_SYSTEM_NAME': val = systems.find(s => s.id === zone.systemSupplyId)?.name || '--'; break;
          case 'EXHAUST_SYSTEM_NAME': val = systems.find(s => s.id === zone.systemExhaustId)?.name || '--'; break;
          case 'INTERNAL_TEMP': val = zone.roomTemp || '--'; break;
          case 'OCCUPANTS': val = zone.occupants || 0; break;
          case 'HEAT_GAINS': val = zone.totalHeatGain || 0; break;
        }
        return `${f.prefix}${val}${f.suffix}`;
      })
      .join('\n');

    return {
      col1: getColumnText(1),
      col2: getColumnText(2)
    };
  }, [zones, globalTagSettings, systems]);

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

    if (currentTool === 'DRAW_DUCT') {
      if (e.evt.button === 0) {
        if (!drawingSystemId) {
          toast.error("Wybierz system z paska przed rysowaniem!");
          return;
        }
        
        let finalPos = { ...canvasPos };
        // Ortho
        if (e.evt.shiftKey && activeNodeId) {
          const prevNode = ductNodes[activeNodeId];
          if (prevNode) {
            const dx = Math.abs(canvasPos.x - prevNode.x);
            const dy = Math.abs(canvasPos.y - prevNode.y);
            if (dx > dy) {
              finalPos.y = prevNode.y;
            } else {
              finalPos.x = prevNode.x;
            }
          }
        }
        
        // Snapping do innych węzłów (na tej kondygnacji)
        const snapThreshold = 15 / scale;
        let snappedNodeId = null;
        for (const nodeId in ductNodes) {
          const node = ductNodes[nodeId];
          if (node.floorId !== activeFloorId) continue;
          if (node.id === activeNodeId) continue; // nie snapuj do siebie
          
          const dist = Math.sqrt(Math.pow(finalPos.x - node.x, 2) + Math.pow(finalPos.y - node.y, 2));
          if (dist < snapThreshold) {
            finalPos = { x: node.x, y: node.y };
            snappedNodeId = node.id;
            break;
          }
        }

        let targetNodeId = snappedNodeId;

        // Jeśli nie było snapa do węzła, próbujemy snapować do krawędzi (odcinka)
        if (!targetNodeId) {
          for (const edgeId in ductEdges) {
            const edge = ductEdges[edgeId];
            const source = ductNodes[edge.sourceNodeId];
            const target = ductNodes[edge.targetNodeId];
            if (!source || !target || source.floorId !== activeFloorId) continue;
            
            // nie snapuj do krawędzi, z których właśnie wychodzimy
            if (activeNodeId === source.id || activeNodeId === target.id) continue;
            
            const closest = getClosestPointOnSegment(finalPos, { x: source.x, y: source.y }, { x: target.x, y: target.y });
            const dist = Math.sqrt(Math.pow(finalPos.x - closest.x, 2) + Math.pow(finalPos.y - closest.y, 2));
            
            if (dist < snapThreshold) {
              finalPos = closest;
              targetNodeId = useDuctStore.getState().splitEdge(edge.id, closest.x, closest.y, scaleFactor || 0);
              break;
            }
          }
        }

        // Jeśli nie było snapa, tworzymy nowy swobodny węzeł
        if (!targetNodeId) {
          targetNodeId = `node-${crypto.randomUUID()}`;
          addDuctNode({
            id: targetNodeId,
            type: 'BRANCH',
            systemId: drawingSystemId,
            ahuId: '',
            x: finalPos.x,
            y: finalPos.y,
            floorId: activeFloorId,
            flow: 0,
            pressureDropLocal: 0,
            soundPowerLevel: [0,0,0,0,0,0,0,0]
          });
        } else {
          // Jeśli snapowaliśmy do istniejącego węzła (lub z niego ruszamy), przełącz system rysowania na jego system
          const snappedNode = useDuctStore.getState().nodes[targetNodeId];
          if (snappedNode && snappedNode.systemId !== drawingSystemId) {
            setDrawingSystemId(snappedNode.systemId);
          }
        }

        // Jeśli mamy poprzedni aktywny węzeł, łączymy je
        if (activeNodeId) {
          // Unikaj pętli (ten sam węzeł)
          if (activeNodeId !== targetNodeId) {
            const edgeId = `edge-${crypto.randomUUID()}`;
            const p1 = ductNodes[activeNodeId] || finalPos;
            const p2 = ductNodes[targetNodeId] || finalPos;
            const lengthPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const lengthM = scaleFactor ? lengthPx * scaleFactor : 0;
            
            addDuctEdge({
              id: edgeId,
              sourceNodeId: activeNodeId,
              targetNodeId: targetNodeId,
              systemId: drawingSystemId,
              ahuId: '',
              length: lengthM,
              shape: 'CIRCULAR',
              roughness: 0.00015,
              internalInsulationThickness: 0,
              externalInsulationThickness: 0,
              velocity: 0,
              pressureDropLin: 0
            });
          }
        }
        
        // Zawsze kontynuujemy rysowanie z tego nowego punktu
        setActiveNodeId(targetNodeId);
      } else if (e.evt.button === 2) {
        // Prawy klik kończy trasę
        setActiveNodeId(null);
      }
      return;
    }

    if (currentTool === null) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
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
        } else if (currentTool === 'CROP') {
          if (currentPolygonPoints.length === 0) {
            setCurrentPolygonPoints([canvasPos]);
          } else {
            const p1 = currentPolygonPoints[0];
            const p2 = canvasPos;
            const x = Math.min(p1.x, p2.x);
            const y = Math.min(p1.y, p2.y);
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);

            if (width > 5 && height > 5) {
              const existingRegions = activeFloorMetadata?.exportRegions || [];
              
              if (editingRegionId) {
                const oldRegion = existingRegions.find(r => r.id === editingRegionId);
                const updatedRegions = existingRegions.map(r => 
                  r.id === editingRegionId 
                    ? { ...r, x, y, width, height }
                    : r
                );
                updateFloor(activeFloorId, { exportRegions: updatedRegions });
                toast.success(`Zaktualizowano kadr: ${oldRegion?.name || 'Edycja'}`);
              } else {
                // Zrezygnowano z window.prompt na rzecz automatycznego nazywania (lepsze UX i brak blokowania wątku)
                const regionName = `Kadr ${(existingRegions.length + 1)}`;
                const newRegion = {
                  id: `crop-${Date.now()}`,
                  name: regionName,
                  x, y, width, height
                };
                updateFloor(activeFloorId, {
                  exportRegions: [...existingRegions, newRegion]
                });
                toast.success(`Zapisano kadr: ${regionName}`);
              }
            }
            
            setIsDrawingPolygon(false);
            setCurrentPolygonPoints([]);
            setCurrentTool(activeFloorId, null);
            setEditingRegionId(null);
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
    referenceOrigin, updateFloorState, polygons,
    currentTool, ductNodes, drawingSystemId, activeNodeId, addDuctNode, addDuctEdge, setActiveNodeId
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

    if (isCalibrating || isMeasuring || isSettingOrigin || isDrawingPolygon || currentTool === 'DRAW_DUCT') {
      if (currentTool === 'DRAW_DUCT' && activeNodeId) {
        if (e.evt.shiftKey) {
          const prevNode = ductNodes[activeNodeId];
          if (prevNode) {
            const dx = Math.abs(canvasPos.x - prevNode.x);
            const dy = Math.abs(canvasPos.y - prevNode.y);
            if (dx > dy) {
              canvasPos.y = prevNode.y;
            } else {
              canvasPos.x = prevNode.x;
            }
          }
        }
        
        // Visual Snapping preview
        const snapThreshold = 15 / scale;
        for (const nodeId in ductNodes) {
          const node = ductNodes[nodeId];
          if (node.floorId !== activeFloorId || node.id === activeNodeId) continue;
          
          const dist = Math.sqrt(Math.pow(canvasPos.x - node.x, 2) + Math.pow(canvasPos.y - node.y, 2));
          if (dist < snapThreshold) {
            canvasPos = { x: node.x, y: node.y };
            break;
          }
        }
      }
      setMousePos(canvasPos);
      return;
    }

    if (!isPanning.current) return;
    const dx = e.evt.clientX - lastPointerPos.current.x;
    const dy = e.evt.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
    setFloorPositionAndScale(scale, { x: position.x + dx, y: position.y + dy });
  }, [
    isPanning, scale, position, setFloorPositionAndScale, isCalibrating, isMeasuring, isSettingOrigin, isDrawingPolygon,
    currentTool, activeNodeId, ductNodes, activeFloorId, referenceOrigin
  ]);

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
        if (currentTool === 'DRAW_DUCT') {
          setActiveNodeId(null);
          setCurrentTool(activeFloorId, null);
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
        const parsedDxf = parseDxfFile(content);
        if (parsedDxf) {
          const layers = parsedDxf.tables?.layer?.layers 
            ? Object.keys(parsedDxf.tables.layer.layers) 
            : Array.from(new Set(parsedDxf.entities.map((e: any) => e.layer)));
            
          setPendingDxf(parsedDxf);
          setPendingDxfLayers(layers as string[]);
          setPendingDxfFile(file);
          setDxfModalOpen(true);
        } else {
          toast.error("Plik DXF jest uszkodzony lub nieobsługiwany.");
        }
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

  const handleExportPNG = useCallback(async (regionId: string, includeBackground: boolean) => {
    const region = activeFloorMetadata?.exportRegions?.find(r => r.id === regionId);
    if (!region || !stageRef.current) return;

    const stage = stageRef.current!;

    try {
      const oldScale = stage.scaleX();
      const oldPos = stage.position();
      const oldStageWidth = stage.width();
      const oldStageHeight = stage.height();

      if (uiLayerRef.current) uiLayerRef.current.hide();
      if (uiOverlayLayerRef.current) uiOverlayLayerRef.current.hide();

      const hideUnderlay = !includeBackground;
      if (hideUnderlay) setForceHideUnderlay(true);

      await new Promise(resolve => setTimeout(resolve, 100));
      stage.draw();

      // OBLICZ CAŁKOWITY BOUNDING BOX SCENY
      // Uwzględnij: podkład + wszystkie kadry + punkt zero + wszystkie poligony
      let minX = 0, minY = 0, maxX = 0, maxY = 0;

      if (underlaySize) {
        maxX = underlaySize.width;
        maxY = underlaySize.height;
      }

      activeFloorMetadata?.exportRegions?.forEach(r => {
        if (r.x + r.width > maxX) maxX = r.x + r.width;
        if (r.y + r.height > maxY) maxY = r.y + r.height;
        if (r.x < minX) minX = r.x;
        if (r.y < minY) minY = r.y;
      });

      polygons.forEach(poly => {
        for (let i = 0; i < poly.points.length; i += 2) {
          const px = poly.points[i];
          const py = poly.points[i + 1];
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
        }
      });

      floorState.dxfOutlines?.forEach(outline => {
        for (let i = 0; i < outline.points.length; i += 2) {
          const px = outline.points[i];
          const py = outline.points[i + 1];
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
        }
      });

      if (referenceOrigin) {
        if (referenceOrigin.x < minX) minX = referenceOrigin.x - 200;
        if (referenceOrigin.y < minY) minY = referenceOrigin.y - 200;
        if (referenceOrigin.x > maxX) maxX = referenceOrigin.x + 200;
        if (referenceOrigin.y > maxY) maxY = referenceOrigin.y + 200;
      }

      // Dodaj margines 50px
      const padding = 50;
      const fullSceneWidth = Math.max(maxX - minX + padding * 2, 100);
      const fullSceneHeight = Math.max(maxY - minY + padding * 2, 100);

      // Przesuń scenę tak, aby minX,minY było w (0,0) nowego układu
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: -minX + padding, y: -minY + padding });
      stage.width(fullSceneWidth);
      stage.height(fullSceneHeight);
      stage.draw();

      // Oblicz pozycję kadru w nowym układzie współrzędnych
      const regionX = region.x - minX + padding;
      const regionY = region.y - minY + padding;

      // Waliduj - jeśli kadr jest całkowicie poza sceną, przerwij
      if (regionX + region.width < 0 || regionY + region.height < 0 ||
          regionX > fullSceneWidth || regionY > fullSceneHeight) {
        toast.error('Kadr znajduje się poza obszarem sceny.');
        throw new Error('Kadr poza sceną');
      }

      // Ogranicz eksport do kadru
      const exportX = Math.max(0, regionX);
      const exportY = Math.max(0, regionY);
      const exportWidth = Math.min(region.width - (exportX - regionX), fullSceneWidth - exportX);
      const exportHeight = Math.min(region.height - (exportY - regionY), fullSceneHeight - exportY);

      if (exportWidth <= 0 || exportHeight <= 0) {
        toast.error('Kadr ma zerową powierzchnię eksportową.');
        throw new Error('Kadr pusty');
      }

      const dataUrl = stage.toDataURL({
        x: exportX,
        y: exportY,
        width: exportWidth,
        height: exportHeight,
        pixelRatio: 2
      });

      stage.width(oldStageWidth);
      stage.height(oldStageHeight);
      stage.scale({ x: oldScale, y: oldScale });
      stage.position(oldPos);

      if (uiLayerRef.current) uiLayerRef.current.show();
      if (uiOverlayLayerRef.current) uiOverlayLayerRef.current.show();
      if (hideUnderlay) setForceHideUnderlay(false);

      stage.draw();

      const link = document.createElement('a');
      link.download = `${underlayName || 'WENTCAD'}_${region.name}_export.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Wyeksportowano kadr: ${region.name}`);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas generowania PNG.');

      if (stageRef.current) {
        stageRef.current.draw();
      }
      if (uiLayerRef.current) uiLayerRef.current.show();
      if (uiOverlayLayerRef.current) uiOverlayLayerRef.current.show();
      setForceHideUnderlay(false);
    }
  }, [activeFloorMetadata, underlaySize, underlayName, polygons, floorState, referenceOrigin]);

  const handleExportDXF = useCallback((regionId: string) => {
    const region = activeFloorMetadata?.exportRegions?.find(r => r.id === regionId);
    if (!region) return;

    try {
      const dxfString = exportToDXF(
        floorState,
        zones,
        systems,
        generateTagText,
        region,
        dxfExportSettings.fontHeight,
        dxfExportSettings.lineSpacing,
        dxfExportSettings.paddingX,
        dxfExportSettings.paddingY
      );
      
      if (!dxfString || dxfString.length === 0) {
        throw new Error('Wygenerowany plik DXF jest pusty');
      }
      
      const filename = `${underlayName || 'WENTCAD'}_${region.name}_export.dxf`;
      
      // Zamknij modal PRZED pobraniem
      setIsExportModalOpen(false);
      
      // Opóźnij pobieranie żeby React mógł się ustabilizować
      setTimeout(() => {
        downloadDXF(dxfString, filename);
        toast.success(`Wyeksportowano DXF: ${region.name}`);
      }, 100);
    } catch (err) {
      console.error('DXF Export Error:', err);
      toast.error(`Błąd eksportu DXF: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
    }
  }, [activeFloorId, activeFloorMetadata, zones, systems, generateTagText, underlayName, dxfExportSettings]);

  const handleEditRegion = useCallback((region: { id: string; name: string; x: number; y: number; width: number; height: number }) => {
    setIsExportModalOpen(false);
    
    if (activeFloorId) {
      setEditingRegionId(region.id);
      setCurrentTool(activeFloorId, 'CROP');
      setCurrentPolygonPoints([{ x: region.x, y: region.y }]);
      setIsDrawingPolygon(true);
      
      toast.info(`Edytujesz kadr "${region.name}". Przeciągnij, aby zmienić rozmiar.`);
    }
  }, [activeFloorId]);

  const handleDeleteRegion = useCallback((regionId: string) => {
    if (!activeFloorMetadata?.exportRegions) return;
    
    const region = activeFloorMetadata.exportRegions.find(r => r.id === regionId);
    if (region && confirm(`Czy na pewno usunąć kadr "${region.name}"?`)) {
      const filtered = activeFloorMetadata.exportRegions.filter(r => r.id !== regionId);
      updateFloor(activeFloorId, { exportRegions: filtered });
      toast.success(`Usunięto kadr: ${region.name}`);
    }
  }, [activeFloorId, activeFloorMetadata, updateFloor]);

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
        onClick={() => setSelectedDxfOutlineId(null)}
        style={{ background: '#f0f2f5' }}
      >
        <Layer ref={uiLayerRef} name="ui">
          {/* === SIATKA === */}
          {drawGrid()}

          {/* === WSPÓŁRZĘDNE POCZĄTKOWE === */}
          {referenceOrigin && (
            <>
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

          {/* === USTAWIANIE ORIGINU - WIZUALIZACJA === */}
          {isSettingOrigin && (
            <>
              <Line points={[mousePos.x - 10 / scale, mousePos.y, mousePos.x + 10 / scale, mousePos.y]} stroke="#ef4444" strokeWidth={2 / scale} />
              <Line points={[mousePos.x, mousePos.y - 10 / scale, mousePos.x, mousePos.y + 10 / scale]} stroke="#ef4444" strokeWidth={2 / scale} />
            </>
          )}

          {/* === KALIBRACJA - LINIA === */}
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

          {/* === POMIAR - LINIA I ETYKIETA === */}
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

        {/* === WARSTWA ZAWARTOŚCI - EKSportowANA === */}
        <Layer ref={contentLayerRef} name="content">
          {/* === PODKŁAD (PDF/IMG) === */}
          {underlayImage && underlaySize && !forceHideUnderlay && (
            <KonvaImage
              image={underlayImage}
              x={0}
              y={0}
              width={underlaySize.width}
              height={underlaySize.height}
              listening={false}
            />
          )}

          {/* === OBRYSY CAD (SZUFLADA DXF) === */}
          {floorState.dxfOutlines?.map((outline: any) => {
            const isSelected = selectedDxfOutlineId === outline.id;
            return (
              <Line
                key={outline.id}
                points={outline.points}
                closed={true}
                fill={isSelected ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.1)'}
                stroke={isSelected ? '#475569' : '#94a3b8'}
                strokeWidth={isSelected ? 3 / scale : 2 / scale}
                dash={[10 / scale, 10 / scale]}
                onMouseEnter={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
                onClick={(e: any) => {
                  e.cancelBubble = true;
                  if (linkingZoneId) {
                    const newPoly = { id: crypto.randomUUID(), zoneId: linkingZoneId, points: outline.points };
                    const filteredOutlines = (floorState.dxfOutlines || []).filter(o => o.id !== outline.id);
                    const filteredPolys = (polygons || []).filter(p => p.zoneId !== linkingZoneId);
                    updateFloorState(activeFloorId, { 
                       dxfOutlines: filteredOutlines,
                       polygons: [...filteredPolys, newPoly] 
                    });
                    const floorScale = scaleFactor || 1;
                    const areaSqM = calculatePolygonArea(outline.points) * (floorScale ** 2);
                    updateZone(linkingZoneId, { 
                      geometryArea: areaSqM,
                      isAreaManual: false
                    });
                    setLinkingZoneId(null);
                    useZoneStore.getState().setSelectedZone(null);
                    toast.success("Pomyślnie przypisano obrys do pomieszczenia.");
                    return;
                  } else {
                    setSelectedDxfOutlineId(outline.id);
                  }
                }}
              />
            );
          })}

          {/* === POLIGONY (STREFY) === */}
          {showZonesOnCanvas && polygons.map((poly) => {
            const zone = zones[poly.zoneId];
            if (!zone) return null;
            
            const isSupplyHidden = zone.systemSupplyId ? hiddenSystemIdsOnCanvas.includes(zone.systemSupplyId) : false;
            const isExhaustHidden = zone.systemExhaustId ? hiddenSystemIdsOnCanvas.includes(zone.systemExhaustId) : false;
            const isNoneHidden = (!zone.systemSupplyId && !zone.systemExhaustId) ? hiddenSystemIdsOnCanvas.includes('none') : false;
            if (isSupplyHidden || isExhaustHidden || isNoneHidden) return null;

            const style = resolveZoneStyle(zone, systems, globalSystemOpacity);
            const baseColor = style.color || '#0ea5e9';
            
            const isRedefining = redefiningZoneId === poly.zoneId;
            const isChecked = checkedZoneIds.includes(zone.id);
            const isSelected = selectedZoneId === zone.id;

            let currentFill = isRedefining ? '#ef444460' : baseColor;
            if (!isRedefining && !isChecked && !isSelected) {
               if (style.color) {
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
                currentFill = '#f59e0b80';
                currentStroke = '#d97706';
                currentStrokeWidth = 4 / scale;
                shadowProps = { shadowColor: '#f59e0b', shadowBlur: 15 / scale, shadowOpacity: 0.8 };
              } else if (isSelected) {
                currentFill = '#4f46e560';
                currentStroke = '#4338ca';
                currentStrokeWidth = 3 / scale;
              }
            }

            if (linkingZoneId) {
              shadowProps = { 
                shadowColor: '#f59e0b', 
                shadowBlur: 10 / scale, 
                shadowOpacity: 0.6 
              };
              currentStroke = '#d97706';
              currentStrokeWidth = (isSelected ? 4 : 2) / scale;
            }

            const targetSystem = (systems as any[]).find(s => s.id === zone.systemSupplyId) || (systems as any[]).find(s => s.id === zone.systemExhaustId);
            const activePatternId = (style as any).patternId || targetSystem?.patternId;
            const solidColor = style.color ? style.color.replace(/, [\d\.]+\)$/, ', 1)') : '#0ea5e9';

            let patternImg: HTMLCanvasElement | null = null;
            if (activePatternId) {
              const cacheKey = `${activePatternId}-${solidColor}`;
              if (!patternCache.current[cacheKey]) {
                const newPattern = createPatternImage(activePatternId as string, solidColor);
                if (newPattern) patternCache.current[cacheKey] = newPattern;
              }
              patternImg = patternCache.current[cacheKey] || null;
            }
            
            return (
              <Group key={poly.id} listening={currentTool !== 'DRAW_DUCT'}>
                <Line
                  points={poly.points}
                  closed={true}
                  fill={currentFill}
                  stroke={currentStroke}
                  strokeWidth={currentStrokeWidth}
                  dash={isRedefining ? [5 / scale, 5 / scale] : []}
                  opacity={isRedefining ? 0.8 : 1}
                  {...shadowProps}
                  onMouseEnter={(e: any) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      if (linkingZoneId) container.style.cursor = 'copy';
                      else if (currentTool === 'ERASER') container.style.cursor = 'crosshair';
                      else container.style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                  onClick={(e: any) => {
                    if (linkingZoneId) {
                      e.cancelBubble = true;
                      const clickedPoly = polygons.find(p => p.zoneId === poly.zoneId);
                      if (!clickedPoly) return;
                      const newPoints = [...clickedPoly.points];
                      const filteredPolygons = polygons.filter(p => p.zoneId !== poly.zoneId);
                      const finalPolygons = filteredPolygons.filter(p => p.zoneId !== linkingZoneId);
                      const updatedPolygons = [...finalPolygons, { id: crypto.randomUUID(), zoneId: linkingZoneId, points: newPoints }];
                      updateFloorState(activeFloorId, { polygons: updatedPolygons });
                      const floorScale = useCanvasStore.getState().getFloorState(activeFloorId).scaleFactor || 1;
                      const areaSqM = calculatePolygonArea(newPoints) * (floorScale ** 2);
                      updateZone(linkingZoneId, { 
                        geometryArea: areaSqM,
                        isAreaManual: false
                      });
                      setLinkingZoneId(null);
                      useZoneStore.getState().setSelectedZone(null);
                      toast.success("Pomyślnie przypisano obrys do pomieszczenia.");
                      return;
                    }
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

          {/* === PRZEWODY (DUCT EDGES) === */}
          {Object.values(ductEdges).map(edge => {
            const source = ductNodes[edge.sourceNodeId];
            const target = ductNodes[edge.targetNodeId];
            if (!source || !target || source.floorId !== activeFloorId || target.floorId !== activeFloorId) return null;

            const system = systems.find(s => s.id === edge.systemId);
            const edgeColor = system?.color || '#94a3b8';
            const isSelected = selectedEdgeId === edge.id;

            return (
              <Group key={edge.id}>
                {/* Hit area (wider invisible line for easier selection) */}
                <Line
                  points={[source.x, source.y, target.x, target.y]}
                  stroke="transparent"
                  strokeWidth={15 / scale}
                  onMouseEnter={(e: any) => {
                    const container = e.target.getStage()?.container();
                    if (container && (currentTool === 'ERASER' || currentTool === null)) container.style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e: any) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                  onClick={(e: any) => {
                    e.cancelBubble = true;
                    if (currentTool === 'ERASER') {
                      useDuctStore.getState().removeEdge(edge.id);
                    } else if (currentTool === null) {
                      setSelectedEdgeId(edge.id);
                    } else if (currentTool === 'DRAW_DUCT') {
                      // SPLIT EDGE
                      const stage = e.target.getStage();
                      const pointerPos = stage?.getPointerPosition();
                      if (pointerPos) {
                        const canvasClickPos = {
                          x: (pointerPos.x - stage.x()) / stage.scaleX(),
                          y: (pointerPos.y - stage.y()) / stage.scaleY(),
                        };
                        const newNodeId = useDuctStore.getState().splitEdge(edge.id, canvasClickPos.x, canvasClickPos.y, scaleFactor || 0);
                        if (newNodeId) {
                          setActiveNodeId(newNodeId);
                        }
                      }
                    }
                  }}
                />
                {/* Visible line */}
                <Line
                  points={[source.x, source.y, target.x, target.y]}
                  stroke={edgeColor}
                  strokeWidth={(isSelected ? 7 : 5) / scale}
                  lineCap="round"
                  lineJoin="round"
                  opacity={1}
                  shadowColor={isSelected ? '#4f46e5' : 'transparent'}
                  shadowBlur={isSelected ? 10 / scale : 0}
                  shadowOpacity={0.8}
                  listening={false}
                />
              </Group>
            );
          })}

          {/* === WĘZŁY (DUCT NODES) === */}
          {Object.values(ductNodes).map(node => {
            if (node.floorId !== activeFloorId) return null;
            const system = systems.find(s => s.id === node.systemId);
            const nodeColor = system?.color || '#94a3b8';
            const isActive = activeNodeId === node.id;
            const isSelected = selectedNodeId === node.id;

            return (
              <Circle
                key={node.id}
                x={node.x}
                y={node.y}
                radius={(isActive || isSelected ? 7 : 5) / scale}
                fill={isActive || isSelected ? '#ffffff' : nodeColor}
                stroke={nodeColor}
                strokeWidth={(isActive || isSelected ? 3 : 2) / scale}
                draggable={currentTool === null}
                onMouseEnter={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    if (currentTool === 'ERASER') container.style.cursor = 'crosshair';
                    else if (currentTool === 'DRAW_DUCT') container.style.cursor = 'crosshair';
                    else if (currentTool === null) container.style.cursor = 'move';
                  }
                }}
                onMouseLeave={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
                onDragMove={(e) => {
                  if (currentTool === null) {
                    const newX = e.target.x();
                    const newY = e.target.y();
                    updateDuctNode(node.id, { x: newX, y: newY });
                    
                    // Recalculate lengths of connected edges
                    Object.values(ductEdges).forEach(edge => {
                      if (edge.sourceNodeId === node.id || edge.targetNodeId === node.id) {
                        const s = edge.sourceNodeId === node.id ? { x: newX, y: newY } : ductNodes[edge.sourceNodeId];
                        const t = edge.targetNodeId === node.id ? { x: newX, y: newY } : ductNodes[edge.targetNodeId];
                        if (s && t) {
                          const lengthPx = Math.sqrt(Math.pow(t.x - s.x, 2) + Math.pow(t.y - s.y, 2));
                          const lengthM = scaleFactor ? lengthPx * scaleFactor : 0;
                          updateDuctEdge(edge.id, { length: lengthM });
                        }
                      }
                    });
                  }
                }}
                onDragEnd={(e) => {
                  if (currentTool === null) {
                    const newX = e.target.x();
                    const newY = e.target.y();
                    const state = useDuctStore.getState();
                    const edges = state.edges;
                    const nodes = state.nodes;
                    
                    const snapThreshold = 15 / scale;
                    // Check for SNAP TO OTHER NODES
                     let snappedToNode = false;
                     for (const targetId in nodes) {
                        if (targetId === node.id) continue;
                        const target = nodes[targetId];
                        if (target.floorId !== activeFloorId) continue;

                        const dist = Math.sqrt(Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2));
                        if (dist < snapThreshold) {
                           state.mergeNodes(node.id, targetId);
                           snappedToNode = true;
                           break;
                        }
                     }

                     if (!snappedToNode) {
                        // Check if dropped on an edge
                        for (const edgeId in edges) {
                          const edge = edges[edgeId];
                          if (edge.sourceNodeId === node.id || edge.targetNodeId === node.id) continue;
                          
                          const source = nodes[edge.sourceNodeId];
                          const target = nodes[edge.targetNodeId];
                          if (!source || !target || source.floorId !== activeFloorId) continue;
                          
                          const closest = getClosestPointOnSegment({ x: newX, y: newY }, { x: source.x, y: source.y }, { x: target.x, y: target.y });
                          const dist = Math.sqrt(Math.pow(newX - closest.x, 2) + Math.pow(newY - closest.y, 2));
                          
                          if (dist < snapThreshold) {
                             state.mergeNodeToEdge(node.id, edgeId, closest.x, closest.y, scaleFactor || 0);
                             break;
                          }
                        }
                     }
                  }
                }}
                onClick={(e: any) => {
                  e.cancelBubble = true;
                  if (currentTool === 'ERASER') {
                    useDuctStore.getState().removeNode(node.id);
                  } else if (currentTool === 'DRAW_DUCT') {
                    // Snapping logic handled in handleMouseDown
                  } else if (currentTool === null) {
                    setSelectedNodeId(node.id);
                  }
                }}
              />
            );
          })}

          {/* === METKI SMART TAG === */}
          {showZonesOnCanvas && polygons.map((poly) => {
            const zone = zones[poly.zoneId];
            if (!zone) return null;

            const isSupplyHidden = zone.systemSupplyId ? hiddenSystemIdsOnCanvas.includes(zone.systemSupplyId) : false;
            const isExhaustHidden = zone.systemExhaustId ? hiddenSystemIdsOnCanvas.includes(zone.systemExhaustId) : false;
            const isNoneHidden = (!zone.systemSupplyId && !zone.systemExhaustId) ? hiddenSystemIdsOnCanvas.includes('none') : false;
            if (isSupplyHidden || isExhaustHidden || isNoneHidden) return null;

            const tagPos = zone.tagPosition || calculatePolygonCentroid(poly.points);
            const texts = generateTagText(zone.id);
            if (!texts.col1 && !texts.col2) return null;

            const fontSize = globalTagSettings.fontSize;
            const lineHeight = 1.2;
            const padding = 8;
            const gap = 15;

            const col1Width = measureTextWidth(texts.col1, fontSize);
            const col2Width = measureTextWidth(texts.col2, fontSize);
            
            const col1Lines = texts.col1 ? texts.col1.split('\n').length : 0;
            const col2Lines = texts.col2 ? texts.col2.split('\n').length : 0;
            const maxLines = Math.max(col1Lines, col2Lines);

            const totalWidth = (texts.col1 ? col1Width : 0) + 
                               (texts.col2 ? col2Width : 0) + 
                               (texts.col1 && texts.col2 ? gap : 0) + 
                               padding * 2;
            const totalHeight = (maxLines * fontSize * lineHeight) + padding * 2;

            const tagScale = globalTagSettings.isFixedSize ? (1 / scale) : 1;

            return (
              <Group
                key={`tag-${zone.id}`}
                x={tagPos.x}
                y={tagPos.y}
                draggable={currentTool !== 'DRAW_DUCT'}
                listening={currentTool !== 'DRAW_DUCT'}
                scaleX={tagScale}
                scaleY={tagScale}
                onDragEnd={(e) => {
                  updateZone(zone.id, { 
                    tagPosition: { x: e.target.x(), y: e.target.y() } 
                  });
                }}
                onClick={(e) => e.cancelBubble = true}
              >
                <Rect
                  width={totalWidth}
                  height={totalHeight}
                  fill={globalTagSettings.fillColor}
                  stroke={globalTagSettings.strokeColor}
                  strokeWidth={1}
                  cornerRadius={4}
                  shadowColor="black"
                  shadowBlur={5}
                  shadowOpacity={0.2}
                  shadowOffsetY={2}
                />
                {texts.col1 && (
                  <Text
                    x={padding}
                    y={padding}
                    width={col1Width}
                    text={texts.col1}
                    fontSize={fontSize}
                    fill="#1e293b"
                    fontFamily="Segoe UI, Arial, sans-serif"
                  />
                )}
                {texts.col2 && (
                  <Text
                    x={texts.col1 ? padding + col1Width + gap : padding}
                    y={padding}
                    width={col2Width}
                    text={texts.col2}
                    fontSize={fontSize}
                    fill="#64748b"
                    fontFamily="Segoe UI, Arial, sans-serif"
                  />
                )}
              </Group>
            );
          })}
        </Layer>

        {/* === WARSTWA UI NAD ZAWARTOŚCIĄ (ramki kadru - UKRYWANA PRZED EKSPORTEM) === */}
        <Layer ref={uiOverlayLayerRef} name="ui-overlay">
          {/* Current Drawing Duct (DRAW_DUCT) */}
          {(currentTool === 'DRAW_DUCT') && activeNodeId && ductNodes[activeNodeId] && (
            <Line
              points={[ductNodes[activeNodeId].x, ductNodes[activeNodeId].y, mousePos.x, mousePos.y]}
              stroke={drawingSystemId ? (systems.find(s => s.id === drawingSystemId)?.color || '#0ea5e9') : '#0ea5e9'}
              strokeWidth={4 / scale}
              dash={[10 / scale, 5 / scale]}
              opacity={0.7}
              lineCap="round"
            />
          )}

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

          {/* Current Drawing Crop (CROP) */}
          {(isDrawingPolygon && currentTool === 'CROP') && currentPolygonPoints.length === 1 && (
            <Line
              points={[
                currentPolygonPoints[0].x, currentPolygonPoints[0].y,
                mousePos.x, currentPolygonPoints[0].y,
                mousePos.x, mousePos.y,
                currentPolygonPoints[0].x, mousePos.y
              ]}
              closed={true}
              stroke="#10b981"
              strokeWidth={2 / scale}
              fill="#10b98120"
              dash={[5 / scale, 5 / scale]}
            />
          )}

          {/* Render Saved Export Regions (UKRYWANE PRZED EKSPORTEM) */}
          {activeFloorMetadata?.exportRegions?.map((region) => (
            <Group key={region.id}>
              <Rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                stroke="#10b981"
                strokeWidth={1 / scale}
                dash={[10 / scale, 10 / scale]}
                opacity={0.6}
                listening={false}
              />
              <Text
                x={region.x}
                y={region.y - 12 / scale}
                text={`📷 ${region.name}`}
                fontSize={10 / scale}
                fill="#059669"
                fontStyle="bold"
              />
              <Group
                x={region.x + region.width - 32 / scale}
                y={region.y}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (window.confirm(`Czy usunąć kadr "${region.name}"?`)) {
                    const filtered = (activeFloorMetadata.exportRegions || []).filter(r => r.id !== region.id);
                    updateFloor(activeFloorId, { exportRegions: filtered });
                  }
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (window.confirm(`Czy usunąć kadr "${region.name}"?`)) {
                    const filtered = (activeFloorMetadata.exportRegions || []).filter(r => r.id !== region.id);
                    updateFloor(activeFloorId, { exportRegions: filtered });
                  }
                }}
                onMouseEnter={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e: any) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'default';
                }}
              >
                 {/* Hit area slightly expanded by the rect size */}
                 <Rect width={32 / scale} height={32 / scale} fill="#fee2e2" cornerRadius={4 / scale} />
                 <Text text="×" x={10 / scale} y={4 / scale} fontSize={24 / scale} fill="#ef4444" fontStyle="bold" />
              </Group>
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* DXF OUTLINE PANEL */}
      {selectedDxfOutlineId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">Nieprzypisany Obrys CAD</span>
            <span className="text-xs text-slate-500">
              Pow.: {floorState.dxfOutlines?.find(o => o.id === selectedDxfOutlineId)?.area?.toFixed(2) || 0} m²
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95"
            onClick={() => {
              const outline = floorState.dxfOutlines?.find(o => o.id === selectedDxfOutlineId);
              if (!outline) return;
              
              const newZoneId = crypto.randomUUID();
              const nextNumber = Object.keys(zones).length + 1;
              addZone({
                id: newZoneId,
                nr: `P-${nextNumber.toString().padStart(2, '0')}`,
                name: "Nowe Pomieszczenie",
                activityType: 'CUSTOM',
                calculationMode: 'AUTO_MAX',
                systemSupplyId: '',
                systemExhaustId: '',
                area: 0,
                manualArea: 0,
                height: 3,
                geometryArea: outline.area,
                isAreaManual: false,
                occupants: 1,
                dosePerOccupant: 30,
                isTargetACHManual: false,
                manualTargetACH: null,
                targetACH: 0,
                normativeVolume: 0,
                normativeExhaust: 0,
                totalHeatGain: 0,
                roomTemp: 24,
                roomRH: 50,
                supplyTemp: 16,
                supplyRH: 80,
                acousticAbsorption: 'MEDIUM',
                maxAllowedDbA: 35,
                isMaxDbAManual: false,
                manualMaxAllowedDbA: null,
                transferIn: [],
                transferOut: [],
                calculatedVolume: 0,
                calculatedExhaust: 0,
                transferInSum: 0,
                transferOutSum: 0,
                netBalance: 0,
                realACH: 0,
                floorId: activeFloorId,
              });

              const newPoly = { id: crypto.randomUUID(), zoneId: newZoneId, points: outline.points };
              const filteredOutlines = (floorState.dxfOutlines || []).filter(o => o.id !== selectedDxfOutlineId);
              updateFloorState(activeFloorId, { 
                 dxfOutlines: filteredOutlines,
                 polygons: [...(polygons || []), newPoly] 
              });

              setSelectedDxfOutlineId(null);
              toast.success("Utworzono nowe pomieszczenie na podstawie obrysu!");
            }}
          >
            + Utwórz Pomieszczenie
          </button>
          <button 
            className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 active:scale-95"
            onClick={() => setIsLinkModalOpen(true)}
          >
            <Link className="w-4 h-4" />
            Przyłącz istniejące
          </button>
          <button 
            className="text-red-600 hover:bg-red-50 text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95"
            onClick={() => {
              const filteredOutlines = (floorState.dxfOutlines || []).filter(o => o.id !== selectedDxfOutlineId);
              updateFloorState(activeFloorId, { dxfOutlines: filteredOutlines });
              setSelectedDxfOutlineId(null);
            }}
          >
            Usuń Obrys
          </button>
        </div>
      )}

      {/* TOOLBAR ETAP 2: PODKŁADY */}
      {currentStage === 2 && (
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
            <button
              onClick={() => {
                setCurrentTool(activeFloorId, 'CROP');
                setIsDrawingPolygon(true);
                setCurrentPolygonPoints([]);
                toast.info('Tryb kadrowania: Narysuj prostokąt eksportu.');
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all ${currentTool === 'CROP' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Kadrowanie (Eksport)"
            >
              <Crop className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Kadr</span>
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <button
            disabled={!scaleFactor}
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

          <button
            onClick={() => setIsTagModalOpen(true)}
            title="Konfiguracja metek"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <TagIcon className="w-4 h-4 text-slate-500" />
            Metki
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            title="Eksportuj do PNG/DXF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            Eksport
          </button>

          {isDrawingPolygon && currentPolygonPoints.length > 2 && (
            <button
              onClick={() => {
                const poly = addPolygon(activeFloorId, selectedZoneId!, currentPolygonPoints);
                const areaPx = calculatePolygonArea(poly.points);
                const areaM2 = areaPx * Math.pow(scaleFactor || 0, 2);

                const activeZone = zones[selectedZoneId!];
                const updates: any = { geometryArea: areaM2 };

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
      )}

      {/* TOOLBAR ETAP 3: INSTALACJE */}
      {currentStage === 3 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 z-10">
          <button onClick={() => fileInputRef.current?.click()} title="Wczytaj podkład" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-all">
            <ImageIcon className="w-4 h-4" />
            Podkład
          </button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => {
                setCurrentTool(activeFloorId, null);
                setActiveNodeId(null);
              }}
              className={`p-1.5 rounded-md transition-all ${!currentTool ? 'bg-white shadow-sm text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Wybierz / Modyfikuj (SELECT)"
            >
              <MousePointer2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentTool(activeFloorId, 'ERASER');
                setActiveNodeId(null);
              }}
              className={`p-1.5 rounded-md transition-all ${currentTool === 'ERASER' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Usuń element (Gumka)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-1 bg-orange-50/50 p-0.5 rounded-lg border border-orange-200">
            <button
              onClick={() => {
                if (currentTool === 'DRAW_DUCT') {
                  setCurrentTool(activeFloorId, null);
                  setActiveNodeId(null);
                } else {
                  setCurrentTool(activeFloorId, 'DRAW_DUCT');
                  setIsDrawingPolygon(false);
                  if (!drawingSystemId && systems.length > 0) {
                    setDrawingSystemId(systems[0].id);
                  }
                  toast.info('Rysowanie tras: kliknij, aby utworzyć węzeł. Shift = Ortho.');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${currentTool === 'DRAW_DUCT' ? 'bg-orange-600 shadow-sm text-white' : 'text-orange-700 hover:bg-orange-100'}`}
              title="Rysuj trasy wentylacyjne"
            >
              <Route className="w-4 h-4" />
              <span className="text-xs font-bold">Rysuj Trasy</span>
            </button>

            <select 
              className="text-xs bg-transparent border-none focus:ring-0 text-orange-900 font-bold py-1 w-32 truncate cursor-pointer"
              value={drawingSystemId || ''}
              onChange={(e) => setDrawingSystemId(e.target.value)}
            >
              <option value="" disabled>Wybierz system...</option>
              {systems.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

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
        </div>
      )}
      {!underlayImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <div className="text-6xl mb-3">🗺️</div>
            <p className="text-sm font-bold text-gray-500">Kondygnacja: {activeFloorId}</p>
            <p className="text-xs text-gray-400 mt-1">Wczytaj podkład dla tego piętra</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,.pdf,.dxf" className="hidden" onChange={handleFileChange} />

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
        availableLayers={pendingDxfLayers}
        onCancel={() => {
          setDxfModalOpen(false);
          setPendingDxf(null);
          setPendingDxfFile(null);
        }}
        onConfirm={async (multiplier, unitLabel, selectedLayers, ignoreBlocks) => {
          if (!pendingDxf) return;
          setIsLoading(true);
          setDxfModalOpen(false);
          
          // Asynchroniczne renderowanie by nie zablokować UI
          setTimeout(async () => {
            try {
              const result = await renderDxfToDataUrl(pendingDxf, { selectedLayers, ignoreBlocks });
              if (result) {
                setUnderlay(
                  result.dataUrl, 
                  { width: result.width, height: result.height }, 
                  `[DXF] ${pendingDxfFile?.name}`
                );
                setScaleFactor(multiplier);
                toast.success(`Zaimportowano DXF. Jednostki: ${unitLabel}`);
              } else {
                toast.error("Błąd renderowania lub wybrano puste warstwy.");
              }
            } catch (err) {
              console.error(err);
              toast.error("Wystąpił nieoczekiwany błąd podczas importu DXF.");
            }
            setIsLoading(false);
            setPendingDxf(null);
            setPendingDxfFile(null);
          }, 50);
        }}
      />

      {isLinkModalOpen && selectedDxfOutlineId && (
        <LinkOutlineModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          outlineId={selectedDxfOutlineId}
        />
      )}

      <SmartTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPNG={handleExportPNG}
        onExportDXF={handleExportDXF}
        onEditRegion={handleEditRegion}
        onDeleteRegion={handleDeleteRegion}
      />
    </div>
  );
}
