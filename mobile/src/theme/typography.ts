export const typography = {
  display: { fontSize: 28, fontWeight: "800" as const },
  title: { fontSize: 20, fontWeight: "700" as const },
  subtitle: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  bodyBold: { fontSize: 14, fontWeight: "600" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
  label: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.4 },
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Subtle floating-card shadow used across StatTile/ItemCard/CategoryCard
// for the elevated, glowing look. shadowColor is set per-theme by callers
// (black in light mode, the accent color in dark mode reads better), so
// this only carries the shape values.
export const cardElevation = {
  shadowOpacity: 0.25,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};
