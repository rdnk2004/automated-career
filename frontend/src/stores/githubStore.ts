import { create } from 'zustand';

export type RepoFilter = 'all' | 'needs_readme' | 'has_secrets';
export type RepoSortBy = 'health' | 'stars' | 'name' | 'pushed';
export type StudioTab = 'overview' | 'security' | 'readme';
export type ReadmeTab = 'preview' | 'edit' | 'diff';

interface GithubStore {
  selectedRepoId: string | null;
  selectedRepoFullName: string | null;
  selectedRepoFullNames: string[]; // for multi-select batch actions
  filter: RepoFilter;
  languageFilter: string | null;
  searchQuery: string;
  studioTab: StudioTab;
  readmeTab: ReadmeTab;
  sortBy: RepoSortBy;
  sortOrder: 'asc' | 'desc';

  // Actions
  setSelectedRepo: (id: string | null, fullName?: string | null) => void;
  toggleSelectRepo: (fullName: string) => void;
  selectAllRepos: (fullNames: string[]) => void;
  clearSelectedRepos: () => void;
  setFilter: (filter: RepoFilter) => void;
  setLanguageFilter: (lang: string | null) => void;
  setSearchQuery: (query: string) => void;
  setStudioTab: (tab: StudioTab) => void;
  setReadmeTab: (tab: ReadmeTab) => void;
  setSorting: (sortBy: RepoSortBy, order?: 'asc' | 'desc') => void;
}

export const useGithubStore = create<GithubStore>((set) => ({
  selectedRepoId: null,
  selectedRepoFullName: null,
  selectedRepoFullNames: [],
  filter: 'all',
  languageFilter: null,
  searchQuery: '',
  studioTab: 'overview',
  readmeTab: 'preview',
  sortBy: 'health',
  sortOrder: 'desc',

  setSelectedRepo: (id, fullName = null) =>
    set({ selectedRepoId: id, selectedRepoFullName: fullName }),

  toggleSelectRepo: (fullName) =>
    set((state) => {
      const exists = state.selectedRepoFullNames.includes(fullName);
      return {
        selectedRepoFullNames: exists
          ? state.selectedRepoFullNames.filter((n) => n !== fullName)
          : [...state.selectedRepoFullNames, fullName],
      };
    }),

  selectAllRepos: (fullNames) =>
    set((state) => {
      const allSelected =
        fullNames.length > 0 &&
        fullNames.every((name) => state.selectedRepoFullNames.includes(name));
      return {
        selectedRepoFullNames: allSelected ? [] : [...fullNames],
      };
    }),

  clearSelectedRepos: () =>
    set({ selectedRepoFullNames: [] }),

  setFilter: (filter) =>
    set({ filter }),

  setLanguageFilter: (languageFilter) =>
    set({ languageFilter }),

  setSearchQuery: (searchQuery) =>
    set({ searchQuery }),

  setStudioTab: (studioTab) =>
    set({ studioTab }),

  setReadmeTab: (readmeTab) =>
    set({ readmeTab }),

  setSorting: (sortBy, order) =>
    set((state) => ({
      sortBy,
      sortOrder: order ?? (state.sortBy === sortBy && state.sortOrder === 'desc' ? 'asc' : 'desc'),
    })),
}));
