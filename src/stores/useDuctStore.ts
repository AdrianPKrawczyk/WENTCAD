import { create } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware';
import type { DuctNode, DuctSegment } from '../types';

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
  splitEdge: (edgeId: string, x: number, y: number, scaleFactor: number) => string; // returns new nodeId
}

/**
 * BFS traversal to find all connected nodes and edges in the same network
 */
function getConnectedNetwork(
  startNodeId: string, 
  nodes: Record<string, DuctNode>, 
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

          const newState = { ...state };
          
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
          const sourceNode = state.nodes[edge.sourceNodeId];
          const targetNode = state.nodes[edge.targetNodeId];
          
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
          const newNode: DuctNode = {
            id: newNodeId,
            type: 'BRANCH',
            systemId: edge.systemId,
            ahuId: edge.ahuId,
            x,
            y,
            floorId: source.floorId,
            flow: 0,
            pressureDropLocal: 0,
            soundPowerLevel: [0,0,0,0,0,0,0,0]
          };

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
        }
      }),
      {
        name: 'wentcad-duct-storage',
        version: 1,
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges
        })
      }
    ),
    {
      limit: 50,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges
      })
    }
  )
);
