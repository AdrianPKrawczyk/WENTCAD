import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { Project, ProjectVersion, SyncStatus, ProjectStateData } from '../types';

interface ProjectStore {
  activeProject: Project | null;
  projects: Project[];
  versions: ProjectVersion[];
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  createProject: (name: string) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
  
  // Snapshots
  fetchVersions: (projectId: string) => Promise<void>;
  saveSnapshot: (name: string, state: ProjectStateData) => Promise<void>;
  restoreSnapshot: (version: ProjectVersion) => Promise<void>;
  
  // Sync
  setSyncStatus: (status: SyncStatus) => void;
  updateProjectState: (projectId: string, state: ProjectStateData) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeProject: null,
  projects: [],
  versions: [],
  syncStatus: 'SAVED',
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      // Ensure session exists for RLS
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ projects: data || [] });
    } catch (err: any) {
      console.error('Fetch projects error:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project, versions: [] });
    if (project) {
      get().fetchVersions(project.id);
    }
  },

  createProject: async (name) => {
    set({ isLoading: true, error: null });
    try {
      let { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
        user = signInData.user;
      }
      
      if (!user) throw new Error('Nie udało się uzyskać tożsamości użytkownika.');

      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, user_id: user.id, state_data: { zones: {}, floors: {}, systems: [] } }])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ projects: [data, ...state.projects] }));
      return data;
    } catch (err: any) {
      console.error('Create project error:', err);
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ 
        projects: state.projects.filter(p => p.id !== id),
        activeProject: state.activeProject?.id === id ? null : state.activeProject 
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchVersions: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ versions: data || [] });
    } catch (err: any) {
      console.error('Error fetching versions:', err.message);
    }
  },

  saveSnapshot: async (name, stateData) => {
    const { activeProject } = get();
    if (!activeProject) return;

    set({ syncStatus: 'SAVING' });
    try {
      const { error } = await supabase.from('project_versions').insert([{
        project_id: activeProject.id,
        name,
        state_data: stateData
      }]);

      if (error) throw error;
      await get().fetchVersions(activeProject.id);
      set({ syncStatus: 'SAVED' });
    } catch (err: any) {
      set({ syncStatus: 'ERROR', error: err.message });
    }
  },

  restoreSnapshot: async (version) => {
    const { activeProject } = get();
    if (!activeProject) return;

    // This data flow: Snapshot -> activeProject.state_data -> triggers store updates (handled in component)
    set({ syncStatus: 'SAVING' });
    try {
      const { error } = await supabase
        .from('projects')
        .update({ state_data: version.state_data })
        .eq('id', activeProject.id);

      if (error) throw error;
      
      set((state) => ({
        activeProject: state.activeProject ? { ...state.activeProject, state_data: version.state_data } : null,
        syncStatus: 'SAVED'
      }));
    } catch (err: any) {
      set({ syncStatus: 'ERROR', error: err.message });
    }
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  updateProjectState: async (projectId, stateData) => {
    set({ syncStatus: 'SAVING' });
    try {
      const { error } = await supabase
        .from('projects')
        .update({ state_data: stateData })
        .eq('id', projectId);

      if (error) throw error;
      
      set((state) => ({
        activeProject: state.activeProject?.id === projectId 
          ? { ...state.activeProject, state_data: stateData } 
          : state.activeProject,
        syncStatus: 'SAVED'
      }));
    } catch (err: any) {
      set({ syncStatus: 'ERROR' });
      console.error('Sync error:', err.message);
    }
  }
}));
