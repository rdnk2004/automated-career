import { create } from 'zustand';
interface SettingsStore { targetRole: string; setTargetRole: (role: string) => void; }
export const useSettingsStore = create<SettingsStore>((set) => ({ targetRole: 'AI Engineer', setTargetRole: (role) => set({ targetRole: role }) }));
