import { create } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware';
import type { DuctNode, DuctSegment, ComponentType } from '../types';

interface DuctStore {
  nodes: Record<string, DuctNode>;
  edges: Record<string, DuctSegment>;
  
  // Selection state (ephemeral)
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Drawing state (ephemeral, not persisted)
  drawingSystemId: string | null;
  activeNodeId: string | null; // Ostatnio kliknięty węzeł, od którego rysujemy

  // Actions
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setDrawingSystemId: (id: string | null) => void;
  setActiveNodeId: (id: string | null) => void;
  
  addNode: (node: DuctNode) => void;
  updateNode: (id: string, updates: Partial<DuctNode>) => void;
  removeNode: (id: string) => void;
  
  addEdge: (edge: DuctSegment) => void;
  updateEdge: (id: string, updates: Partial<DuctSegment>) => void;
  removeEdge: (id: string) => void;

  // Advanced topology actions
  splitEdge: (edgeId: string, x: number, y: number, scaleFactor: number) => string;
  insertInlineComponent: (
    edgeId: string, 
    x: number, 
    y: number, 
    scaleFactor: number,
    componentType: ComponentType
  ) => string;
  mergeNodeToEdge: (nodeId: string, edgeId: string, x: number, y: number, scaleFactor: number) => void;
  mergeNodes: (sourceId: string, targetId: string) => void;

  // Utility helpers
  calculateEdgeAngle: (edge: DuctSegment) => number;
  getTerminalsInZone: (zoneId: string, systemId?: string) => DuctNode[];
  getNodesOnFloor: (floorId: string) => DuctNode[];

  // SHAFT management
  getOrphanedShaftNodes: (shaftId: string, shaftRange: { fromFloorId: string; toFloorId: string } | undefined) => DuctNode[];
  getAllShaftsWithSameId: (shaftId: string) => DuctNode[];
  syncShaftToFloors: (sourceNodeId: string) => void;
  removeOrphanedShaftNodes: (shaftId: string, nodeIds: string[]) => void;
  reassignShaftNodes: (nodeIds: string[], targetShaftId?: string, extendTargetRange?: boolean) => string | null;
  createShaftNode: (sourceNode: DuctNode, targetFloorId: string, shaftId: string) => DuctNode;
  syncShaftProperties: (sourceNodeId: string, updates: Partial<DuctNode>) => void;
  resetPositionSync: (sourceNodeId: string) => void;
}

/**
 * BFS traversal to find all connected nodes and edges in the same network
 */
function getConnectedNetwork(
  startNodeId: string, 
  _nodes: Record<string, DuctNode>, 
  edges: Record<string, DuctSegment>
): { nodeIds: string[], edgeIds: string[] } {
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visitedNodes.has(nodeId)) continue;
    visitedNodes.add(nodeId);

    Object.values(edges).forEach(edge => {
      if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
        visitedEdges.add(edge.id);
        const otherNodeId = edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;
        if (!visitedNodes.has(otherNodeId)) {
          queue.push(otherNodeId);
        }
      }
    });
  }

  return { nodeIds: Array.from(visitedNodes), edgeIds: Array.from(visitedEdges) };
}

/**
 * Creates a new DuctNode with all required fields including new typed fields
 */
function createDuctNode(
  data: {
    id: string;
    x: number;
    y: number;
    floorId: string;
    systemId: string;
    ahuId: string;
    type?: DuctNode['type'];
    componentCategory?: DuctNode['componentCategory'];
    componentType?: DuctNode['componentType'];
    flow?: number;
    zoneId?: string;
    rotation?: number;
  }
): DuctNode {
  const node: DuctNode = {
    id: data.id,
    type: data.type || 'BRANCH',
    componentCategory: data.componentCategory || 'JUNCTION',
    componentType: data.componentType || 'TEE',
    systemId: data.systemId,
    ahuId: data.ahuId,
    x: data.x,
    y: data.y,
    floorId: data.floorId,
    flow: data.flow ?? 0,
    zoneId: data.zoneId,
    pressureDropLocal: 0,
    soundPowerLevel: [0, 0, 0, 0, 0, 0, 0, 0],
  };
  if (data.rotation !== undefined) {
    node.rotation = data.rotation;
  }
  return node;
}

export const useDuctStore = create<DuctStore>()(
  temporal(
    persist(
      (set, get) => ({
        nodes: {},
        edges: {},
        
        selectedNodeId: null,
        selectedEdgeId: null,
        drawingSystemId: null,
        activeNodeId: null,

        setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: id ? null : null }),
        setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: id ? null : null }),
        setDrawingSystemId: (id) => set({ drawingSystemId: id }),
        setActiveNodeId: (id) => set({ activeNodeId: id }),

        addNode: (node) => set((state) => ({ nodes: { ...state.nodes, [node.id]: node } })),
        
        updateNode: (id, updates) => set((state) => {
          const node = state.nodes[id];
          if (!node) return state;

          // If systemId is changing, propagate to whole network
          if (updates.systemId && updates.systemId !== node.systemId) {
            const network = getConnectedNetwork(id, state.nodes, state.edges);
            const newNodes = { ...state.nodes };
            const newEdges = { ...state.edges };
            
            network.nodeIds.forEach(nId => {
              newNodes[nId] = { ...newNodes[nId], systemId: updates.systemId! };
            });
            network.edgeIds.forEach(eId => {
              newEdges[eId] = { ...newEdges[eId], systemId: updates.systemId! };
            });
            
            return { nodes: newNodes, edges: newEdges };
          }

          return { nodes: { ...state.nodes, [id]: { ...node, ...updates } } };
        }),

        removeNode: (id) => set((state) => {
          const newNodes = { ...state.nodes };
          delete newNodes[id];
          
          // Also remove connected edges
          const newEdges = { ...state.edges };
          Object.keys(newEdges).forEach(edgeId => {
            if (newEdges[edgeId].sourceNodeId === id || newEdges[edgeId].targetNodeId === id) {
              delete newEdges[edgeId];
            }
          });
          
          return { 
            nodes: newNodes, 
            edges: newEdges, 
            activeNodeId: state.activeNodeId === id ? null : state.activeNodeId,
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
          };
        }),

        addEdge: (edge) => set((state) => {
          // If we connect two systems, we must unify them
          // As per requirement: "Zmiana systemu w jednym punkcie powinna zmienić system w całej instalacji"
          // We'll take the edge.systemId as the truth for the newly formed network
          const network = getConnectedNetwork(edge.sourceNodeId, state.nodes, state.edges);
          const network2 = getConnectedNetwork(edge.targetNodeId, state.nodes, state.edges);
          
          const newNodes = { ...state.nodes };
          const newEdges = { ...state.edges, [edge.id]: edge };
          
          const allNodeIds = [...network.nodeIds, ...network2.nodeIds];
          const allEdgeIds = [...network.edgeIds, edge.id]; // already added to newEdges but for consistency
          
          allNodeIds.forEach(nId => {
            newNodes[nId] = { ...newNodes[nId], systemId: edge.systemId };
          });
          Object.keys(newEdges).forEach(eId => {
            if (allEdgeIds.includes(eId) || network2.edgeIds.includes(eId)) {
              newEdges[eId] = { ...newEdges[eId], systemId: edge.systemId };
            }
          });

          return { nodes: newNodes, edges: newEdges };
        }),

        updateEdge: (id, updates) => set((state) => {
          const edge = state.edges[id];
          if (!edge) return state;

          // If systemId is changing, propagate to whole network (use source node as anchor)
          if (updates.systemId && updates.systemId !== edge.systemId) {
            const network = getConnectedNetwork(edge.sourceNodeId, state.nodes, state.edges);
            const newNodes = { ...state.nodes };
            const newEdges = { ...state.edges };
            
            network.nodeIds.forEach(nId => {
              newNodes[nId] = { ...newNodes[nId], systemId: updates.systemId! };
            });
            network.edgeIds.forEach(eId => {
              newEdges[eId] = { ...newEdges[eId], systemId: updates.systemId! };
            });
            
            return { nodes: newNodes, edges: newEdges };
          }

          return { edges: { ...state.edges, [id]: { ...edge, ...updates } } };
        }),

        removeEdge: (id) => set((state) => {
          const newEdges = { ...state.edges };
          delete newEdges[id];
          return { 
            edges: newEdges,
            selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId
          };
        }),

        splitEdge: (edgeId, x, y, scaleFactor) => {
          const state = get();
          const edge = state.edges[edgeId];
          if (!edge) return '';

          const source = state.nodes[edge.sourceNodeId];
          const target = state.nodes[edge.targetNodeId];
          if (!source || !target) return '';

          const newNodeId = `node-${crypto.randomUUID()}`;
          const newNode = createDuctNode({
            id: newNodeId,
            type: 'BRANCH',
            componentCategory: 'JUNCTION',
            componentType: 'TEE',
            systemId: edge.systemId,
            ahuId: edge.ahuId,
            x,
            y,
            floorId: source.floorId,
          });

          const edge1Id = `edge-${crypto.randomUUID()}`;
          const edge2Id = `edge-${crypto.randomUUID()}`;

          const dist1Px = Math.sqrt(Math.pow(x - source.x, 2) + Math.pow(y - source.y, 2));
          const dist2Px = Math.sqrt(Math.pow(target.x - x, 2) + Math.pow(target.y - y, 2));

          const edge1: DuctSegment = {
            ...edge,
            id: edge1Id,
            targetNodeId: newNodeId,
            length: dist1Px * scaleFactor
          };

          const edge2: DuctSegment = {
            ...edge,
            id: edge2Id,
            sourceNodeId: newNodeId,
            length: dist2Px * scaleFactor
          };

          set((s) => {
            const newEdges = { ...s.edges };
            delete newEdges[edgeId];
            return {
              nodes: { ...s.nodes, [newNodeId]: newNode },
              edges: { ...newEdges, [edge1Id]: edge1, [edge2Id]: edge2 },
              selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId
            };
          });

          return newNodeId;
        },

        mergeNodeToEdge: (nodeId, edgeId, x, y, scaleFactor) => {
          const state = get();
          const node = state.nodes[nodeId];
          const edge = state.edges[edgeId];
          if (!node || !edge) return;

          const source = state.nodes[edge.sourceNodeId];
          const target = state.nodes[edge.targetNodeId];
          if (!source || !target) return;

          // 1. Create the new node on the edge
          const newNodeId = `node-${crypto.randomUUID()}`;
          const newNode = createDuctNode({
            id: newNodeId,
            type: 'BRANCH',
            componentCategory: 'JUNCTION',
            componentType: 'TEE',
            systemId: edge.systemId,
            ahuId: edge.ahuId,
            x,
            y,
            floorId: source.floorId,
          });

          // 2. Split the edge into two
          const edge1Id = `edge-${crypto.randomUUID()}`;
          const edge2Id = `edge-${crypto.randomUUID()}`;
          const dist1Px = Math.sqrt(Math.pow(x - source.x, 2) + Math.pow(y - source.y, 2));
          const dist2Px = Math.sqrt(Math.pow(target.x - x, 2) + Math.pow(target.y - y, 2));

          const edge1: DuctSegment = {
            ...edge,
            id: edge1Id,
            targetNodeId: newNodeId,
            length: dist1Px * scaleFactor
          };
          const edge2: DuctSegment = {
            ...edge,
            id: edge2Id,
            sourceNodeId: newNodeId,
            length: dist2Px * scaleFactor
          };

          set((s) => {
            const newNodes = { ...s.nodes, [newNodeId]: newNode };
            const newEdges = { ...s.edges, [edge1Id]: edge1, [edge2Id]: edge2 };
            delete newEdges[edgeId];

            // 3. Re-route edges pointing to OLD node to the NEW node
            Object.keys(newEdges).forEach(eId => {
              const e = newEdges[eId];
              let changed = false;
              const updates: Partial<DuctSegment> = {};

              if (e.sourceNodeId === nodeId) {
                updates.sourceNodeId = newNodeId;
                changed = true;
              }
              if (e.targetNodeId === nodeId) {
                updates.targetNodeId = newNodeId;
                changed = true;
              }

              if (changed) {
                newEdges[eId] = { ...e, ...updates, systemId: newNode.systemId };
              }
            });

            // 4. Remove the old node
            delete newNodes[nodeId];

            return {
              nodes: newNodes,
              edges: newEdges,
              selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
              selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
              activeNodeId: s.activeNodeId === nodeId ? null : s.activeNodeId
            };
          });
        },

        mergeNodes: (sourceId, targetId) => {
          if (sourceId === targetId) return;
          const state = get();
          const sourceNode = state.nodes[sourceId];
          const targetNode = state.nodes[targetId];
          if (!sourceNode || !targetNode) return;

          set((s) => {
            const newNodes = { ...s.nodes };
            const newEdges = { ...s.edges };

            // 1. Re-route all edges from source to target
            Object.keys(newEdges).forEach(eId => {
              const e = newEdges[eId];
              let changed = false;
              let newSource = e.sourceNodeId;
              let newTarget = e.targetNodeId;

              if (e.sourceNodeId === sourceId) {
                newSource = targetId;
                changed = true;
              }
              if (e.targetNodeId === sourceId) {
                newTarget = targetId;
                changed = true;
              }

              if (changed) {
                // If this re-route creates a zero-length edge (source == target), don't update, we'll delete it later or now
                if (newSource === newTarget) {
                   delete newEdges[eId];
                } else {
                   newEdges[eId] = { ...e, sourceNodeId: newSource, targetNodeId: newTarget };
                }
              }
            });

            // 2. Remove the old node
            delete newNodes[sourceId];

            // 3. Propagate systemId from targetNode to all connected elements
            const network = getConnectedNetwork(targetId, newNodes, newEdges);
            
            network.nodeIds.forEach(nId => {
              newNodes[nId] = { ...newNodes[nId], systemId: targetNode.systemId };
            });
            network.edgeIds.forEach(eId => {
              if (newEdges[eId]) {
                newEdges[eId] = { ...newEdges[eId], systemId: targetNode.systemId };
              }
            });

            return {
              nodes: newNodes,
              edges: newEdges,
              selectedNodeId: s.selectedNodeId === sourceId ? null : s.selectedNodeId,
              activeNodeId: s.activeNodeId === sourceId ? null : s.activeNodeId
            };
          });
        },

        // Insert an inline component (DAMPER, FIRE_DAMPER, SILENCER, etc.) on an existing edge
        insertInlineComponent: (edgeId, x, y, scaleFactor, componentType) => {
          const state = get();
          const edge = state.edges[edgeId];
          if (!edge) return '';

          const source = state.nodes[edge.sourceNodeId];
          const target = state.nodes[edge.targetNodeId];
          if (!source || !target) return '';

          // Determine category based on componentType
          let componentCategory: DuctNode['componentCategory'] = 'INLINE';
          
          const newNodeId = `node-${crypto.randomUUID()}`;
          
          // Calculate rotation based on edge angle
          const angle = Math.atan2(target.y - source.y, target.x - source.x) * (180 / Math.PI);
          
          const newNode = createDuctNode({
            id: newNodeId,
            type: componentType as DuctNode['type'],
            componentCategory,
            componentType,
            systemId: edge.systemId,
            ahuId: edge.ahuId,
            x,
            y,
            floorId: source.floorId,
            rotation: angle,
          });

          const edge1Id = `edge-${crypto.randomUUID()}`;
          const edge2Id = `edge-${crypto.randomUUID()}`;

          const dist1Px = Math.sqrt(Math.pow(x - source.x, 2) + Math.pow(y - source.y, 2));
          const dist2Px = Math.sqrt(Math.pow(target.x - x, 2) + Math.pow(target.y - y, 2));

          const edge1: DuctSegment = {
            ...edge,
            id: edge1Id,
            targetNodeId: newNodeId,
            length: dist1Px * scaleFactor
          };

          const edge2: DuctSegment = {
            ...edge,
            id: edge2Id,
            sourceNodeId: newNodeId,
            length: dist2Px * scaleFactor
          };

          set((s) => {
            const newEdges = { ...s.edges };
            delete newEdges[edgeId];
            return {
              nodes: { ...s.nodes, [newNodeId]: newNode },
              edges: { ...newEdges, [edge1Id]: edge1, [edge2Id]: edge2 },
              selectedNodeId: newNodeId,
              selectedEdgeId: null,
            };
          });

          return newNodeId;
        },

        // Calculate the angle of an edge in degrees (0 = right, 90 = down)
        calculateEdgeAngle: (edge) => {
          const state = get();
          const source = state.nodes[edge.sourceNodeId];
          const target = state.nodes[edge.targetNodeId];
          if (!source || !target) return 0;
          return Math.atan2(target.y - source.y, target.x - source.x) * (180 / Math.PI);
        },

        // Get all terminal nodes in a specific zone, optionally filtered by system
        getTerminalsInZone: (zoneId, systemId) => {
          const state = get();
          return Object.values(state.nodes).filter(node => {
            if (node.zoneId !== zoneId) return false;
            if (node.componentCategory !== 'TERMINAL') return false;
            if (systemId && node.systemId !== systemId) return false;
            return true;
          });
        },

        // Get all nodes on a specific floor
        getNodesOnFloor: (floorId) => {
          const state = get();
          return Object.values(state.nodes).filter(node => node.floorId === floorId);
        },

        // Create a new SHAFT node based on source node
        createShaftNode: (sourceNode, targetFloorId, shaftId) => {
          const nodeId = `node-${crypto.randomUUID()}`;
          return {
            id: nodeId,
            type: sourceNode.type,
            componentCategory: 'SHAFT' as const,
            componentType: sourceNode.componentType,
            systemId: sourceNode.systemId,
            ahuId: sourceNode.ahuId,
            x: sourceNode.x,
            y: sourceNode.y,
            floorId: targetFloorId,
            flow: sourceNode.flow,
            pressureDropLocal: sourceNode.pressureDropLocal,
            shaftId,
            shaftAutoNumber: sourceNode.shaftAutoNumber,
            shaftRange: sourceNode.shaftRange,
            shaftShiftX: sourceNode.shaftShiftX,
            shaftShiftY: sourceNode.shaftShiftY,
            isPositionManuallySet: false,
            soundPowerLevel: [0, 0, 0, 0, 0, 0, 0, 0],
          };
        },

        // Get all SHAFT nodes with the same shaftId
        getAllShaftsWithSameId: (shaftId) => {
          const state = get();
          return Object.values(state.nodes).filter(
            node => node.componentCategory === 'SHAFT' && node.shaftId === shaftId
          );
        },

        // Get orphaned SHAFT nodes (outside the current shaftRange)
        getOrphanedShaftNodes: (shaftId, shaftRange) => {
          const state = get();
          const allShaftsWithId = Object.values(state.nodes).filter(
            node => node.componentCategory === 'SHAFT' && node.shaftId === shaftId
          );

          if (!shaftRange || !shaftRange.fromFloorId || !shaftRange.toFloorId) {
            return allShaftsWithId;
          }

          return allShaftsWithId.filter(node => {
            return node.floorId !== shaftRange.fromFloorId && node.floorId !== shaftRange.toFloorId;
          });
        },

        // Sync SHAFT nodes to all floors in range (create/update nodes and vertical edges)
        syncShaftToFloors: (sourceNodeId) => {
          const state = get();
          const sourceNode = state.nodes[sourceNodeId];
          if (!sourceNode || sourceNode.componentCategory !== 'SHAFT' || !sourceNode.shaftId) return;

          const shaftId = sourceNode.shaftId;
          const shaftRange = sourceNode.shaftRange;
          const shaftShiftX = sourceNode.shaftShiftX || 0;
          const shaftShiftY = sourceNode.shaftShiftY || 0;

          if (!shaftRange || !shaftRange.fromFloorId || !shaftRange.toFloorId) return;

          const sourceFloorId = sourceNode.floorId;
          const targetFloorIds = [shaftRange.fromFloorId, shaftRange.toFloorId].filter(
            (id, idx, arr) => arr.indexOf(id) === idx && id !== sourceFloorId
          );

          const newNodes = { ...state.nodes };
          const newEdges = { ...state.edges };

          // For each target floor, create or update SHAFT node
          for (const floorId of targetFloorIds) {
            // Check if node already exists on this floor
            const existingNode = Object.values(state.nodes).find(
              n => n.componentCategory === 'SHAFT' && n.shaftId === shaftId && n.floorId === floorId
            );

            if (!existingNode) {
              // Create new node on this floor
              const newNode = get().createShaftNode(sourceNode, floorId, shaftId);
              newNode.x = sourceNode.x + shaftShiftX;
              newNode.y = sourceNode.y + shaftShiftY;
              newNodes[newNode.id] = newNode;

              // Create vertical edge between source and new node
              // We don't know the elevation difference here, so we'll set length = 0
              // The actual length calculation will be done when we have access to Floor metadata
              const verticalEdgeId = `edge-${crypto.randomUUID()}`;
              newEdges[verticalEdgeId] = {
                id: verticalEdgeId,
                sourceNodeId: sourceFloorId === shaftRange.fromFloorId ? sourceNode.id : newNode.id,
                targetNodeId: sourceFloorId === shaftRange.fromFloorId ? newNode.id : sourceNode.id,
                systemId: sourceNode.systemId,
                ahuId: sourceNode.ahuId,
                length: 0, // Will be calculated with Floor elevation data
                shape: 'CIRCULAR',
                roughness: 0.00015,
                internalInsulationThickness: 0,
                externalInsulationThickness: 0,
                velocity: 0,
                pressureDropLin: 0,
              };
            } else if (!existingNode.isPositionManuallySet) {
              // Update position only if not manually set
              newNodes[existingNode.id] = {
                ...newNodes[existingNode.id],
                x: sourceNode.x + shaftShiftX,
                y: sourceNode.y + shaftShiftY,
              };
            }
          }

          set({ nodes: newNodes, edges: newEdges });
        },

        // Remove orphaned SHAFT nodes and their vertical edges
        removeOrphanedShaftNodes: (shaftId, nodeIds) => {
          const state = get();
          const newNodes = { ...state.nodes };
          const newEdges = { ...state.edges };

          // Remove nodes
          for (const nodeId of nodeIds) {
            delete newNodes[nodeId];
          }

          // Remove edges connected only to removed nodes
          for (const edgeId of Object.keys(newEdges)) {
            const edge = newEdges[edgeId];
            if (nodeIds.includes(edge.sourceNodeId) || nodeIds.includes(edge.targetNodeId)) {
              // Check if this edge connects only SHAFT nodes with the same shaftId
              const sourceNode = newNodes[edge.sourceNodeId] || state.nodes[edge.sourceNodeId];
              const targetNode = newNodes[edge.targetNodeId] || state.nodes[edge.targetNodeId];
              if (
                (sourceNode?.componentCategory === 'SHAFT' && sourceNode?.shaftId === shaftId) ||
                (targetNode?.componentCategory === 'SHAFT' && targetNode?.shaftId === shaftId)
              ) {
                delete newEdges[edgeId];
              }
            }
          }

          set({ nodes: newNodes, edges: newEdges });
        },

        // Reassign SHAFT nodes to another shaft (or create new)
        reassignShaftNodes: (nodeIds, targetShaftId, _extendTargetRange) => {
          const state = get();
          const newNodes = { ...state.nodes };
          
          // Find or generate target shaftId
          let finalShaftId = targetShaftId;
          if (!finalShaftId) {
            // Generate new shaftId (P1, P2, P3...)
            const existingShaftNumbers = Object.values(state.nodes)
              .filter(n => n.componentCategory === 'SHAFT' && n.shaftAutoNumber)
              .map(n => n.shaftAutoNumber || 0);
            const nextNum = existingShaftNumbers.length > 0 ? Math.max(...existingShaftNumbers) + 1 : 1;
            finalShaftId = `P${nextNum}`;
          }

          // Update nodes with new shaftId
          for (const nodeId of nodeIds) {
            if (newNodes[nodeId]) {
              newNodes[nodeId] = {
                ...newNodes[nodeId],
                shaftId: finalShaftId,
                shaftAutoNumber: parseInt(finalShaftId.replace('P', '')) || undefined,
              };
            }
          }

          set({ nodes: newNodes });
          return finalShaftId;
        },

        // Sync SHAFT properties (shaftId, shaftRange, systemId) across all nodes with same shaftId
        syncShaftProperties: (sourceNodeId, updates) => {
          const state = get();
          const sourceNode = state.nodes[sourceNodeId];
          if (!sourceNode || sourceNode.componentCategory !== 'SHAFT' || !sourceNode.shaftId) return;

          const newNodes = { ...state.nodes };
          const shaftId = updates.shaftId ?? sourceNode.shaftId;

          // Find all SHAFT nodes with the same shaftId
          Object.values(state.nodes).forEach(node => {
            if (node.componentCategory === 'SHAFT' && node.shaftId === shaftId && node.id !== sourceNodeId) {
              newNodes[node.id] = {
                ...newNodes[node.id],
                ...updates,
              };
            }
          });

          set({ nodes: newNodes });
        },

        // Reset position sync for all SHAFT nodes with the same shaftId
        resetPositionSync: (sourceNodeId) => {
          const state = get();
          const sourceNode = state.nodes[sourceNodeId];
          if (!sourceNode || sourceNode.componentCategory !== 'SHAFT' || !sourceNode.shaftId) return;

          const shaftId = sourceNode.shaftId;
          const shaftShiftX = sourceNode.shaftShiftX || 0;
          const shaftShiftY = sourceNode.shaftShiftY || 0;
          const newNodes = { ...state.nodes };

          // Reset isPositionManuallySet on all nodes with the same shaftId
          Object.values(state.nodes).forEach(node => {
            if (node.componentCategory === 'SHAFT' && node.shaftId === shaftId) {
              if (node.id !== sourceNodeId && !node.isPositionManuallySet) {
                // Only sync position if not manually set
                newNodes[node.id] = {
                  ...newNodes[node.id],
                  isPositionManuallySet: false,
                  x: sourceNode.x + shaftShiftX,
                  y: sourceNode.y + shaftShiftY,
                };
              } else {
                newNodes[node.id] = {
                  ...newNodes[node.id],
                  isPositionManuallySet: false,
                };
              }
            }
          });

          set({ nodes: newNodes });
        },
      }),
      {
        name: 'wentcad-duct-storage',
        version: 2,
        partialize: (state) => ({
          nodes: state.nodes || {},
          edges: state.edges || {}
        }),
        migrate: (persistedState: any, version: number) => {
          if (version < 2) {
            // Migrate nodes from old format (without componentCategory/componentType)
            const oldNodes = persistedState.nodes || {};
            const migratedNodes: Record<string, DuctNode> = {};
            
            for (const [id, node] of Object.entries(oldNodes)) {
              const oldNode = node as any;
              // Add new fields with defaults if missing
              migratedNodes[id] = {
                ...oldNode,
                componentCategory: oldNode.componentCategory || 
                  (oldNode.type === 'FAN' ? 'EQUIPMENT' :
                   oldNode.type === 'TERMINAL' ? 'TERMINAL' :
                   oldNode.type === 'DAMPER' || oldNode.type === 'SILENCER' ? 'INLINE' :
                   'JUNCTION'),
                componentType: oldNode.componentType || 
                  (oldNode.type === 'FAN' ? 'FAN' :
                   oldNode.type === 'TERMINAL' ? 'ANEMOSTAT' :
                   oldNode.type === 'DAMPER' ? 'DAMPER' :
                   oldNode.type === 'SILENCER' ? 'SILENCER' :
                   'TEE'),
                flowFraction: oldNode.flowFraction,
                rotation: oldNode.rotation,
                isLocked: oldNode.isLocked || false,
                ratedFlow: oldNode.ratedFlow,
                ratedPressure: oldNode.ratedPressure,
                heatRecoveryType: oldNode.heatRecoveryType,
                efficiency: oldNode.efficiency,
                width: oldNode.width,
                height: oldNode.height,
              };
            }
            
            return {
              ...persistedState,
              nodes: migratedNodes,
            };
          }
          return persistedState;
        },
      }
    ),
    {
      limit: 50,
      partialize: (state) => ({
        nodes: state.nodes || {},
        edges: state.edges || {}
      })
    }
  )
);
