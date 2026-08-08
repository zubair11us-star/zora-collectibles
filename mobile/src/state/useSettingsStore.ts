import { create } from "zustand";

import { Settings } from "@/types/models";
import { getAllSettings, setSetting } from "@/db/repositories/settingsRepo";

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (key: keyof Settings, value: string) => Promise<void>;
}

const defaultSettings: Settings = {
  name: "Collector",
  baseCurrency: "AED",
  theme: "system",
  aiServerUrl: "http://localhost:4000",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loaded: false,
  load: async () => {
    const settings = await getAllSettings();
    set({ settings, loaded: true });
  },
  update: async (key, value) => {
    await setSetting(key, value);
    set({ settings: { ...get().settings, [key]: value } });
  },
}));
