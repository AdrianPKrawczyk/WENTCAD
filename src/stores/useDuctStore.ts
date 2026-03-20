import { create } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware';
import type { DuctNode, DuctSegment } from '../types';

interface DuctStore {
  nodes: Record<string, DuctNode>;
  edges: Record<string, DuctSegment>;
  
  // Drawing state (ephemeral, not persisted)
  drawingSystemId: string | null;
  activeNodeId: string | null; // Ostatnio kliknięty węzeł, od którego rysujemy

  // Actions
  setDrawingSystemId: (id: string | null) => void;
  setActiveNodeId: (id: string | null) => void;
  
  addNode: (node: DuctNode) => void;
  updateNode: (id: string, updates: Partial<DuctNode>) => void;
  removeNode: (id: string) => void;
  
  addEdge: (edge: DuctSegment) => void;
  updateEdge: (id: string, updates: Partial<DuctSegment>) => void;
  removeEdge: (id: string) => void;
}

export const useDuctStore = create<DuctStore>()(
  temporal(
    persist(
      (set) => ({
        nodes: {},
        edges: {},
        
        drawingSystemId: null,
        activeNodeId: null,

        setDrawingSystemId: (id) => set({ drawingSystemId: id }),
        setActiveNodeId: (id) => set({ activeNodeId: id }),

        addNode: (node) => set((state) => ({ nodes: { ...state.nodes, [node.id]: node } })),
        updateNode: (id, updates) => set((state) => {
          const node = state.nodes[id];
          if (!node) return state;
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
          
          return { nodes: newNodes, edges: newEdges, activeNodeId: state.activeNodeId === id ? null : state.activeNodeId };
        }),

        addEdge: (edge) => set((state) => ({ edges: { ...state.edges, [edge.id]: edge } })),
        updateEdge: (id, updates) => set((state) => {
          const edge = state.edges[id];
          if (!edge) return state;
          return { edges: { ...state.edges, [id]: { ...edge, ...updates } } };
        }),
        removeEdge: (id) => set((state) => {
          const newEdges = { ...state.edges };
          delete newEdges[id];
          return { edges: newEdges };
        })
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
