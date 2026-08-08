import { CategoryKey } from "./models";

export type IconLib = "Ionicons" | "MaterialCommunityIcons";

export interface CategoryIconSpec {
  lib: IconLib;
  name: string;
}

// Vector icon per category — replaces the plain-emoji `icon` column from the
// database (still seeded there for reference/fallback, but the UI renders
// from this mapping instead of that text column).
export const CATEGORY_ICON: Record<CategoryKey, CategoryIconSpec> = {
  currency: { lib: "Ionicons", name: "cash-outline" },
  coins: { lib: "MaterialCommunityIcons", name: "circle-multiple-outline" },
  pokemon: { lib: "Ionicons", name: "flash-outline" },
  hotwheels: { lib: "Ionicons", name: "car-sport-outline" },
  tradingcards: { lib: "MaterialCommunityIcons", name: "cards-outline" },
  stamps: { lib: "Ionicons", name: "mail-outline" },
  toys: { lib: "Ionicons", name: "cube-outline" },
  diecast: { lib: "Ionicons", name: "car-outline" },
  watches: { lib: "Ionicons", name: "watch-outline" },
  medals: { lib: "Ionicons", name: "ribbon-outline" },
  souvenirs: { lib: "Ionicons", name: "globe-outline" },
  other: { lib: "Ionicons", name: "ellipsis-horizontal-circle-outline" },
};
