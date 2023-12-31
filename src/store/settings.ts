import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Models } from "@interface/openai";

type SettingsType = {
  model: {
    keywords: {
      main: Models;
      secondary: Models;
    };
    outline: Models;
  };
};

type Settings = {
  settings: SettingsType;
  setSettings: (settings?: SettingsType) => void;
};

export const useSettings = create<Settings>()(
  persist(
    set => ({
      settings: {
        model: {
          keywords: {
            main: "gpt-3.5-turbo",
            secondary: "gpt-3.5-turbo"
          },
          outline: "gpt-3.5-turbo"
        }
      },
      setSettings: settings => set({ settings })
    }),
    {
      name: "settings"
    }
  )
);
