export const palette = {
  indigo: "#6366F1",
  indigoDark: "#4F46E5",
  emerald: "#22C55E",
  amber: "#F59E0B",
  rose: "#F43F5E",
  sky: "#0EA5E9",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  slate950: "#0B1120",
  white: "#FFFFFF",
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentAlt: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  tabBarBackground: string;
}

export const lightColors: ThemeColors = {
  background: palette.slate50,
  surface: palette.white,
  surfaceAlt: palette.slate100,
  border: palette.slate200,
  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  accent: palette.indigo,
  accentAlt: palette.indigoDark,
  success: palette.emerald,
  warning: palette.amber,
  danger: palette.rose,
  info: palette.sky,
  tabBarBackground: palette.white,
};

export const darkColors: ThemeColors = {
  background: palette.slate950,
  surface: palette.slate900,
  surfaceAlt: palette.slate800,
  border: palette.slate700,
  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate500,
  accent: palette.indigo,
  accentAlt: "#818CF8",
  success: palette.emerald,
  warning: palette.amber,
  danger: palette.rose,
  info: palette.sky,
  tabBarBackground: palette.slate900,
};
