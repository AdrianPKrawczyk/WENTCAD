import { create } from 'zustand';
import type { DuctNode, DuctSegment } from '../types';

interface DuctStore {
  nodes: Record<string, DuctNode>;
  edges: Record<string, DuctSegment>;
  addNode: (node: DuctNode) => void;
  updateNode: (id: string, updates: Partial<DuctNode>) => void;
  removeNode: (id: string) => void;
  
  addEdge: (edge: DuctSegment) => void;
  updateEdge: (id: string, updates: Partial<DuctSegment>) => void;
  removeEdge: (id: string) => void;
}

export const useDuctStore = create<DuctStore>((set) => ({
  nodes: {},
  edges: {},

  addNode: (node) => set((state) => ({ nodes: { ...state.nodes, [node.id]: node } })),
  updateNode: (id, updates) => set((state) => {
    const node = state.nodes[id];
    if (!node) return state;
    return { nodes: { ...state.nodes, [id]: { ...node, ...updates } } };
  }),
  removeNode: (id) => set((state) => {
    const newNodes = { ...state.nodes };
    delete newNodes[id];
    return { nodes: newNodes };
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
}));
