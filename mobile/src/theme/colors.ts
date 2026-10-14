export const palette = {
  // Primary accent — bright azure blue (the "A" logo's crystal blue)
  azure: "#2F8EFF",
  azureDeep: "#1D5FD1",
  azureBright: "#5FACFF",
  // Secondary accent — warm gold (the logo's swoosh/star)
  gold: "#F5A623",
  goldBright: "#FFC74D",
  emerald: "#22C55E",
  rose: "#F2495C",
  sky: "#38BDF8",
  // Deep navy neutrals — the reference app's near-black card backgrounds
  navy950: "#060B14",
  navy900: "#0A1220",
  navy850: "#0D1826",
  navy800: "#11213A",
  navy700: "#16304F",
  navy600: "#223E63",
  slate50: "#F7F9FC",
  slate100: "#EDF1F8",
  slate200: "#DCE4F0",
  slate300: "#AEBBD4",
  slate400: "#7E8EAD",
  slate500: "#5A6B8C",
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
  gold: string;
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
  textPrimary: "#0E1626",
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  accent: palette.azure,
  accentAlt: palette.azureDeep,
  gold: "#C9820A",
  success: palette.emerald,
  warning: palette.gold,
  danger: palette.rose,
  info: palette.sky,
  tabBarBackground: palette.white,
};

export const darkColors: ThemeColors = {
  background: palette.navy900,
  surface: palette.navy850,
  surfaceAlt: palette.navy800,
  border: palette.navy700,
  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
  accent: palette.azure,
  accentAlt: palette.azureBright,
  gold: palette.goldBright,
  success: palette.emerald,
  warning: palette.gold,
  danger: palette.rose,
  info: palette.sky,
  tabBarBackground: palette.navy950,
};
