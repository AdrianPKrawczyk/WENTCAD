import { create } from 'zustand';

export type ViewMode = 'table' | 'canvas' | 'split-vertical' | 'split-horizontal';

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// UI State Store - Not synchronized with project data, not in undo history
export const useUIStore = create<UIState>((set) => ({
  viewMode: 'split-horizontal',
  setViewMode: (viewMode) => set({ viewMode }),
}));
