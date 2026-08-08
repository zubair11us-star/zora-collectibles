// Single source of truth for per-category extra fields. These fields live in
// the flexible `item_attributes` EAV table rather than as dedicated columns,
// so adding a new collectible type never requires a schema migration.
//
// This same definition drives:
//   1. The dynamic confirm/edit form (renders inputs for a category)
//   2. The AI identification prompt sent to Claude (asks it to fill these keys)

import { CategoryKey } from "./models";

export type FieldType = "text" | "number" | "select" | "boolean";

export interface CategoryFieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  aiHint?: string; // extra guidance given to the AI prompt for this field
}

export interface CategoryMeta {
  key: CategoryKey;
  name: string;
  icon: string; // emoji used as a lightweight icon (no external icon font dependency)
  color: string;
  twoSided: boolean; // whether front/back scanning applies
  fields: CategoryFieldDef[];
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  currency: {
    key: "currency",
    name: "Currency",
    icon: "💵",
    color: "#22C55E",
    twoSided: true,
    fields: [
      { key: "issuingAuthority", label: "Issuing Authority", type: "text" },
      { key: "signature", label: "Signature", type: "text" },
      { key: "noteNumber", label: "Note / Serial Number", type: "text" },
    ],
  },
  coins: {
    key: "coins",
    name: "Coins",
    icon: "🪙",
    color: "#F59E0B",
    twoSided: true,
    fields: [
      { key: "mintMark", label: "Mint Mark", type: "text" },
      { key: "metal", label: "Metal", type: "text" },
      { key: "diameterMm", label: "Diameter (mm)", type: "number" },
      { key: "weightGrams", label: "Weight (g)", type: "number" },
      { key: "edgeType", label: "Edge Type", type: "text" },
      { key: "obverseInfo", label: "Obverse", type: "text" },
      { key: "reverseInfo", label: "Reverse", type: "text" },
    ],
  },
  pokemon: {
    key: "pokemon",
    name: "Pokémon",
    icon: "⚡",
    color: "#FBBF24",
    twoSided: false,
    fields: [
      { key: "setSymbol", label: "Set Symbol", type: "text" },
      { key: "cardType", label: "Card Type", type: "text" },
      { key: "rarity", label: "Rarity", type: "text" },
      { key: "language", label: "Language", type: "text" },
      { key: "hp", label: "HP", type: "number" },
      { key: "illustrator", label: "Illustrator", type: "text" },
      { key: "edition", label: "Edition", type: "text" },
      {
        key: "holoType",
        label: "Holo / Reverse Holo",
        type: "select",
        options: ["None", "Holo", "Reverse Holo"],
      },
      { key: "specialVariant", label: "Special Variant", type: "text" },
      { key: "gradingInfo", label: "Grading Info", type: "text" },
    ],
  },
  hotwheels: {
    key: "hotwheels",
    name: "Hot Wheels",
    icon: "🏎️",
    color: "#EF4444",
    twoSided: false,
    fields: [
      { key: "toyNumber", label: "Toy Number", type: "text" },
      { key: "casting", label: "Casting", type: "text" },
      { key: "color", label: "Color", type: "text" },
      { key: "variation", label: "Variation", type: "text" },
      { key: "wheelType", label: "Wheel Type", type: "text" },
      {
        key: "packagingStatus",
        label: "Packaging Status",
        type: "select",
        options: ["Carded / MOC", "Loose", "Opened Box"],
      },
    ],
  },
  tradingcards: {
    key: "tradingcards",
    name: "Trading Cards",
    icon: "🃏",
    color: "#8B5CF6",
    twoSided: false,
    fields: [
      { key: "sport", label: "Sport / Genre", type: "text" },
      { key: "player", label: "Player / Character", type: "text" },
      { key: "rarity", label: "Rarity", type: "text" },
      { key: "gradingInfo", label: "Grading Info", type: "text" },
    ],
  },
  stamps: {
    key: "stamps",
    name: "Stamps",
    icon: "📮",
    color: "#0EA5E9",
    twoSided: false,
    fields: [
      { key: "issue", label: "Issue", type: "text" },
      { key: "perforation", label: "Perforation", type: "text" },
    ],
  },
  toys: {
    key: "toys",
    name: "Toys",
    icon: "🧸",
    color: "#F472B6",
    twoSided: false,
    fields: [
      { key: "material", label: "Material", type: "text" },
      {
        key: "packagingStatus",
        label: "Packaging Status",
        type: "select",
        options: ["Sealed", "Opened", "Loose"],
      },
    ],
  },
  diecast: {
    key: "diecast",
    name: "Die-Cast",
    icon: "🚗",
    color: "#DC2626",
    twoSided: false,
    fields: [
      { key: "scale", label: "Scale", type: "text" },
      { key: "casting", label: "Casting / Mold", type: "text" },
    ],
  },
  watches: {
    key: "watches",
    name: "Watches",
    icon: "⌚",
    color: "#334155",
    twoSided: false,
    fields: [
      { key: "movement", label: "Movement", type: "text" },
      { key: "caseMaterial", label: "Case Material", type: "text" },
      { key: "referenceNumber", label: "Reference Number", type: "text" },
    ],
  },
  medals: {
    key: "medals",
    name: "Medals",
    icon: "🎖️",
    color: "#B45309",
    twoSided: true,
    fields: [
      { key: "awardingBody", label: "Awarding Body", type: "text" },
      { key: "material", label: "Material", type: "text" },
    ],
  },
  souvenirs: {
    key: "souvenirs",
    name: "Souvenirs",
    icon: "🗿",
    color: "#0D9488",
    twoSided: false,
    fields: [{ key: "origin", label: "Origin / Event", type: "text" }],
  },
  other: {
    key: "other",
    name: "Other",
    icon: "📦",
    color: "#64748B",
    twoSided: false,
    fields: [],
  },
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "currency",
  "coins",
  "pokemon",
  "hotwheels",
  "tradingcards",
  "stamps",
  "toys",
  "diecast",
  "watches",
  "medals",
  "souvenirs",
  "other",
];

// Common fields (already dedicated columns on `items`) that the AI is asked
// to fill for every category, in addition to the category-specific fields.
export const COMMON_AI_FIELDS: CategoryFieldDef[] = [
  { key: "name", label: "Item Name", type: "text" },
  { key: "country", label: "Country", type: "text" },
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "series", label: "Series", type: "text" },
  { key: "setName", label: "Set", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "catalogNumber", label: "Catalog Number", type: "text" },
  { key: "cardNumber", label: "Card Number", type: "text" },
  { key: "denomination", label: "Denomination", type: "text" },
  { key: "currency", label: "Currency", type: "text" },
  { key: "serialNumber", label: "Serial Number", type: "text" },
  {
    key: "condition",
    label: "Condition",
    type: "select",
    options: [
      "mint",
      "near_mint",
      "excellent",
      "very_good",
      "good",
      "fair",
      "poor",
    ],
  },
];
