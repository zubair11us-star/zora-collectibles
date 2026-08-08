// Mirrors mobile/src/types/categoryFields.ts. Kept as a plain duplicate
// (rather than a shared package) to keep the server a standalone,
// independently deployable service — see docs/ARCHITECTURE.md. If you add a
// field on the mobile side, add it here too so the AI is asked to extract it.

export type CategoryKey =
  | "currency"
  | "coins"
  | "pokemon"
  | "hotwheels"
  | "tradingcards"
  | "stamps"
  | "toys"
  | "diecast"
  | "watches"
  | "medals"
  | "souvenirs"
  | "other";

export const CATEGORY_KEYS: CategoryKey[] = [
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

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  currency: "Currency",
  coins: "Coins",
  pokemon: "Pokémon Cards",
  hotwheels: "Hot Wheels",
  tradingcards: "Trading Cards",
  stamps: "Stamps",
  toys: "Toys",
  diecast: "Die-Cast",
  watches: "Watches",
  medals: "Medals",
  souvenirs: "Souvenirs",
  other: "Other Collectibles",
};

export const COMMON_FIELD_KEYS = [
  "name",
  "country",
  "manufacturer",
  "year",
  "series",
  "setName",
  "model",
  "catalogNumber",
  "cardNumber",
  "denomination",
  "currency",
  "serialNumber",
  "condition (one of: mint, near_mint, excellent, very_good, good, fair, poor)",
];

export const CATEGORY_FIELD_KEYS: Record<CategoryKey, string[]> = {
  currency: ["issuingAuthority", "signature", "noteNumber"],
  coins: ["mintMark", "metal", "diameterMm", "weightGrams", "edgeType", "obverseInfo", "reverseInfo"],
  pokemon: [
    "setSymbol",
    "cardType",
    "rarity",
    "language",
    "hp",
    "illustrator",
    "edition",
    "holoType (one of: None, Holo, Reverse Holo)",
    "specialVariant",
    "gradingInfo",
  ],
  hotwheels: [
    "toyNumber",
    "casting",
    "color",
    "variation",
    "wheelType",
    "packagingStatus (one of: Carded / MOC, Loose, Opened Box)",
  ],
  tradingcards: ["sport", "player", "rarity", "gradingInfo"],
  stamps: ["issue", "perforation"],
  toys: ["material", "packagingStatus (one of: Sealed, Opened, Loose)"],
  diecast: ["scale", "casting"],
  watches: ["movement", "caseMaterial", "referenceNumber"],
  medals: ["awardingBody", "material"],
  souvenirs: ["origin"],
  other: [],
};

export const CATEGORY_HINTS: Record<CategoryKey, string> = {
  currency:
    "This is a banknote/currency note. Look closely for country of issue, denomination, year, series, issuing authority, printed signature(s), and the note's serial number.",
  coins: "This is a coin. Identify country, denomination, year, mint mark, metal composition, and describe obverse/reverse designs.",
  pokemon:
    "This is a Pokémon trading card. Read the card name, HP, set symbol/name, card number (e.g. 58/102), rarity symbol, illustrator credit, and any holo/reverse-holo foiling.",
  hotwheels:
    "This is a Hot Wheels diecast car. Identify the casting/model name, toy number (usually printed on the base or card), color, and packaging status.",
  tradingcards: "This is a non-Pokémon trading card (sports, TCG, etc). Identify the player/character, set, rarity, and any grading label.",
  stamps: "This is a postage stamp. Identify country, year, denomination, and issue/series.",
  toys: "This is a collectible toy. Identify the name, manufacturer, material, and packaging status.",
  diecast: "This is a die-cast model (non-Hot-Wheels). Identify the make/model, scale, and manufacturer.",
  watches: "This is a watch. Identify the brand/model, movement type, case material, and reference number if visible.",
  medals: "This is a medal. Identify the awarding body/event, year, and material.",
  souvenirs: "This is a souvenir item. Identify its origin, associated event/place, and material.",
  other: "Identify this collectible as best you can from the photo(s).",
};
