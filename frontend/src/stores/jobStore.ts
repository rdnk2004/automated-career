import { create } from 'zustand';

interface JobStore {
  activeTitle: string;
  activeLocation: string;
  searchHistory: string[];
  selectedKeyword: string | null;
  keywordTypeFilter: 'all' | 'technical' | 'general';
  minFrequencyThreshold: number;
  heatmapFilterMode: 'all' | 'matched' | 'missing';

  // Actions
  setActiveTitle: (title: string) => void;
  setActiveLocation: (loc: string) => void;
  addToHistory: (role: string) => void;
  removeFromHistory: (role: string) => void;
  clearHistory: () => void;
  setSelectedKeyword: (keyword: string | null) => void;
  setKeywordTypeFilter: (filter: 'all' | 'technical' | 'general') => void;
  setMinFrequencyThreshold: (min: number) => void;
  setHeatmapFilterMode: (mode: 'all' | 'matched' | 'missing') => void;
}

export const useJobStore = create<JobStore>((set) => ({
  activeTitle: 'AI Engineer',
  activeLocation: 'Remote',
  searchHistory: ['AI Engineer', 'Senior Frontend Engineer', 'Full Stack Developer', 'MLOps Engineer'],
  selectedKeyword: null,
  keywordTypeFilter: 'all',
  minFrequencyThreshold: 1,
  heatmapFilterMode: 'all',

  setActiveTitle: (title) =>
    set((state) => {
      const trimmed = title.trim();
      const updatedHistory = trimmed && !state.searchHistory.includes(trimmed)
        ? [trimmed, ...state.searchHistory].slice(0, 8)
        : state.searchHistory;
      return { activeTitle: trimmed, searchHistory: updatedHistory };
    }),

  setActiveLocation: (loc) =>
    set({ activeLocation: loc.trim() }),

  addToHistory: (role) =>
    set((state) => {
      const trimmed = role.trim();
      if (!trimmed || state.searchHistory.includes(trimmed)) return state;
      return { searchHistory: [trimmed, ...state.searchHistory].slice(0, 8) };
    }),

  removeFromHistory: (role) =>
    set((state) => ({
      searchHistory: state.searchHistory.filter((r) => r !== role),
    })),

  clearHistory: () =>
    set({ searchHistory: [] }),

  setSelectedKeyword: (keyword) =>
    set({ selectedKeyword: keyword }),

  setKeywordTypeFilter: (keywordTypeFilter) =>
    set({ keywordTypeFilter }),

  setMinFrequencyThreshold: (minFrequencyThreshold) =>
    set({ minFrequencyThreshold }),

  setHeatmapFilterMode: (heatmapFilterMode) =>
    set({ heatmapFilterMode }),
}));
