import { create } from 'zustand';

interface JobStore {
  activeTitle: string;
  setActiveTitle: (title: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  activeTitle: 'AI Engineer',
  setActiveTitle: (title) => set({ activeTitle: title })
}));
