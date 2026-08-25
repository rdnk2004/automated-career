import { create } from 'zustand';

export type ProfileEditorViewMode = 'visual' | 'raw';

interface ProfileStore {
  activeSectionId: string | null;
  activeSectionType: string | null;
  viewMode: ProfileEditorViewMode;
  expandedSections: Record<string, boolean>;
  draftEdits: Record<string, any>; // maps section_id -> pending JSON content

  // Actions
  setActiveSection: (id: string | null, type?: string | null) => void;
  setViewMode: (mode: ProfileEditorViewMode) => void;
  setDraftContent: (sectionId: string, content: any) => void;
  clearDraft: (sectionId: string) => void;
  clearAllDrafts: () => void;
  toggleSectionExpanded: (sectionId: string) => void;
  setAllSectionsExpanded: (expanded: boolean, sectionIds: string[]) => void;
  isSectionDirty: (sectionId: string, originalContent: any) => boolean;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  activeSectionId: null,
  activeSectionType: null,
  viewMode: 'visual',
  expandedSections: {},
  draftEdits: {},

  setActiveSection: (id, type = null) =>
    set({ activeSectionId: id, activeSectionType: type }),

  setViewMode: (mode) =>
    set({ viewMode: mode }),

  setDraftContent: (sectionId, content) =>
    set((state) => ({
      draftEdits: {
        ...state.draftEdits,
        [sectionId]: content,
      },
    })),

  clearDraft: (sectionId) =>
    set((state) => {
      const next = { ...state.draftEdits };
      delete next[sectionId];
      return { draftEdits: next };
    }),

  clearAllDrafts: () =>
    set({ draftEdits: {} }),

  toggleSectionExpanded: (sectionId) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [sectionId]: !(state.expandedSections[sectionId] ?? true),
      },
    })),

  setAllSectionsExpanded: (expanded, sectionIds) =>
    set({
      expandedSections: sectionIds.reduce((acc, id) => {
        acc[id] = expanded;
        return acc;
      }, {} as Record<string, boolean>),
    }),

  isSectionDirty: (sectionId, originalContent) => {
    const draft = get().draftEdits[sectionId];
    if (draft === undefined) return false;
    try {
      return JSON.stringify(draft) !== JSON.stringify(originalContent);
    } catch {
      return true;
    }
  },
}));
