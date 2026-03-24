import { create } from 'zustand';

export type ViewMode = 'table' | 'canvas' | 'split-vertical' | 'split-horizontal' | 'split-vertical-reversed';

interface UIState {
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isFloorSwitcherVisible: boolean;
  setIsFloorSwitcherVisible: (visible: boolean) => void;
  floorSwitcherPosition: { x: number, y: number };
  setFloorSwitcherPosition: (pos: { x: number, y: number }) => void;
  isUnderlayVisible: boolean;
  setIsUnderlayVisible: (visible: boolean) => void;
  isWattModalOpen: boolean;
  setIsWattModalOpen: (open: boolean) => void;
  isProjectImportModalOpen: boolean;
  setIsProjectImportModalOpen: (open: boolean) => void;
}

// UI State Store - Not synchronized with project data, not in undo history
export const useUIStore = create<UIState>((set) => ({
  currentStage: 2,
  setCurrentStage: (currentStage) => set({ currentStage }),
  viewMode: 'split-horizontal',
  setViewMode: (viewMode) => set({ viewMode }),
  isFloorSwitcherVisible: true,
  setIsFloorSwitcherVisible: (isFloorSwitcherVisible) => set({ isFloorSwitcherVisible }),
  floorSwitcherPosition: { x: 16, y: 16 },
  setFloorSwitcherPosition: (floorSwitcherPosition) => set({ floorSwitcherPosition }),
  isUnderlayVisible: true,
  setIsUnderlayVisible: (isUnderlayVisible) => set({ isUnderlayVisible }),
  isWattModalOpen: false,
  setIsWattModalOpen: (isWattModalOpen) => set({ isWattModalOpen }),
  isProjectImportModalOpen: false,
  setIsProjectImportModalOpen: (isProjectImportModalOpen) => set({ isProjectImportModalOpen }),
}));
