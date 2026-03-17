import { create } from 'zustand';

export type ViewMode = 'table' | 'canvas' | 'split-vertical' | 'split-horizontal' | 'split-vertical-reversed';

interface UIState {
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

// UI State Store - Not synchronized with project data, not in undo history
export const useUIStore = create<UIState>((set) => ({
  currentStage: 2,
  setCurrentStage: (currentStage) => set({ currentStage }),
  viewMode: 'split-horizontal',
  setViewMode: (viewMode) => set({ viewMode }),
}));
