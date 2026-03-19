import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { ColumnState } from 'ag-grid-community';

export interface ColumnFilterProfile {
  id: string;
  name: string;
  state: ColumnState[];
}

interface SettingsState {
  savedColumnProfiles: ColumnFilterProfile[];
  defaultProfileId: string | null;
  
  saveColumnProfile: (name: string, state: ColumnState[]) => void;
  deleteColumnProfile: (id: string) => void;
  setDefaultProfile: (id: string | null) => void;
}

const storage = {
  getItem: async (name: string): Promise<StorageValue<SettingsState> | null> => {
    const str = await get(name);
    return str ? JSON.parse(str) : null;
  },
  setItem: async (name: string, value: StorageValue<SettingsState>): Promise<void> => {
    await set(name, JSON.stringify(value));
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      savedColumnProfiles: [],
      defaultProfileId: null,

      saveColumnProfile: (name, state) => {
        const id = crypto.randomUUID();
        set((prev) => ({
          savedColumnProfiles: [...prev.savedColumnProfiles, { id, name, state }],
        }));
      },
      
      deleteColumnProfile: (id) => {
        set((prev) => ({
          savedColumnProfiles: prev.savedColumnProfiles.filter((p) => p.id !== id),
          defaultProfileId: prev.defaultProfileId === id ? null : prev.defaultProfileId,
        }));
      },

      setDefaultProfile: (id) => {
        set({ defaultProfileId: id });
      },
    }),
    {
      name: 'wentcad-global-settings',
      storage,
    }
  )
);
