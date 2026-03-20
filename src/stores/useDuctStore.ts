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
  mergeNodeToEdge: (nodeId: string, edgeId: string, x: number, y: number, scaleFactor: number) => void;
  mergeNodes: (sourceId: string, targetId: string) => void;
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
        }
      }),
      {
        name: 'wentcad-duct-storage',
        version: 1,
        partialize: (state) => ({
          nodes: state.nodes || {},
          edges: state.edges || {}
        })
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
