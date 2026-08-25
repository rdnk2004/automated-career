import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  targetRole: string;
  autoAudit: boolean;
  showEvidenceTags: boolean;
  preferredAtsFormat: 'standard' | 'modern' | 'minimal';
  completedWeeklyActions: number[];

  // Actions
  setTargetRole: (role: string) => void;
  setAutoAudit: (enabled: boolean) => void;
  setShowEvidenceTags: (show: boolean) => void;
  setPreferredAtsFormat: (format: 'standard' | 'modern' | 'minimal') => void;
  toggleWeeklyAction: (index: number) => void;
  clearCompletedWeeklyActions: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      targetRole: 'AI Engineer',
      autoAudit: false,
      showEvidenceTags: true,
      preferredAtsFormat: 'standard',
      completedWeeklyActions: [],

      setTargetRole: (targetRole) =>
        set({ targetRole: targetRole.trim() }),

      setAutoAudit: (autoAudit) =>
        set({ autoAudit }),

      setShowEvidenceTags: (showEvidenceTags) =>
        set({ showEvidenceTags }),

      setPreferredAtsFormat: (preferredAtsFormat) =>
        set({ preferredAtsFormat }),

      toggleWeeklyAction: (index) =>
        set((state) => {
          const exists = state.completedWeeklyActions.includes(index);
          return {
            completedWeeklyActions: exists
              ? state.completedWeeklyActions.filter((i) => i !== index)
              : [...state.completedWeeklyActions, index],
          };
        }),

      clearCompletedWeeklyActions: () =>
        set({ completedWeeklyActions: [] }),
    }),
    {
      name: 'career-os-settings-storage',
    }
  )
);
