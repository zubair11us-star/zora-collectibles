import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";

import { darkColors, lightColors, ThemeColors } from "./colors";
import { useSettingsStore } from "@/state/useSettingsStore";

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  scheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { settings, loaded, load } = useSettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const scheme: "light" | "dark" = useMemo(() => {
    if (settings.theme === "light") return "light";
    if (settings.theme === "dark") return "dark";
    return systemScheme === "dark" ? "dark" : "light";
  }, [settings.theme, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: scheme === "dark" ? darkColors : lightColors, scheme }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}
