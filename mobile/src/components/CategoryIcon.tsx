import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { CATEGORY_ICON } from "@/types/categoryIcons";
import { CategoryKey } from "@/types/models";

interface CategoryIconProps {
  categoryKey: CategoryKey;
  size?: number;
  color: string;
}

export function CategoryIcon({ categoryKey, size = 20, color }: CategoryIconProps) {
  const spec = CATEGORY_ICON[categoryKey];
  if (spec.lib === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={spec.name as never} size={size} color={color} />;
  }
  return <Ionicons name={spec.name as never} size={size} color={color} />;
}
