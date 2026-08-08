// Core domain types. These mirror the Drizzle schema (src/db/schema.ts) but
// are the shapes used throughout the UI/service layer.

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

export type IdentificationSource = "ai" | "barcode" | "external" | "manual";

export type PhotoType =
  | "front"
  | "back"
  | "closeup"
  | "packaging"
  | "serial"
  | "certificate"
  | "receipt"
  | "other";

export type TransactionType =
  | "purchase"
  | "sale"
  | "trade"
  | "gift_received"
  | "gift_given"
  | "found"
  | "lost"
  | "damaged";

export type ItemCondition =
  | "mint"
  | "near_mint"
  | "excellent"
  | "very_good"
  | "good"
  | "fair"
  | "poor"
  | "unspecified";

export type SaleStatus =
  | "not_for_sale"
  | "planned"
  | "listed"
  | "sold"
  | "reserved";

export type WishlistPriority = "low" | "medium" | "high";

export interface Category {
  id: string;
  key: CategoryKey;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Item {
  id: string;
  categoryId: string;
  subcategory: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  country: string | null;
  manufacturer: string | null;
  year: number | null;
  series: string | null;
  setName: string | null;
  model: string | null;
  catalogNumber: string | null;
  cardNumber: string | null;
  denomination: string | null;
  currency: string | null;
  serialNumber: string | null;
  condition: ItemCondition;
  grade: string | null;
  quantity: number;
  purchaseDate: string | null; // ISO date
  purchasePrice: number | null;
  purchaseCurrency: string | null;
  currentValue: number | null;
  currentValueCurrency: string | null;
  sellingPrice: number | null;
  locationId: string | null;
  storageBoxId: string | null;
  storagePosition: string | null;
  barcode: string | null;
  qrCode: string | null;
  identificationSource: IdentificationSource;
  aiConfidence: number | null;
  saleStatus: SaleStatus;
  notes: string | null;
  isDemo: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemAttribute {
  id: string;
  itemId: string;
  key: string;
  value: string;
}

export interface Photo {
  id: string;
  itemId: string;
  type: PhotoType;
  filePath: string;
  thumbnailPath: string | null;
  cloudUrl: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Location {
  id: string;
  name: string;
  parentLocationId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StorageBox {
  id: string;
  name: string;
  locationId: string | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Valuation {
  id: string;
  itemId: string;
  date: string;
  value: number;
  currency: string;
  source: IdentificationSource;
  notes: string | null;
  updatedAt: string | null;
}

export interface Transaction {
  id: string;
  itemId: string;
  type: TransactionType;
  date: string;
  counterparty: string | null;
  price: number | null;
  currency: string | null;
  quantity: number;
  fees: number | null;
  shipping: number | null;
  totalCost: number | null;
  netAmount: number | null;
  notes: string | null;
  updatedAt: string | null;
}

export interface WishlistEntry {
  id: string;
  name: string;
  categoryId: string | null;
  desiredCondition: ItemCondition;
  targetPrice: number | null;
  targetCurrency: string | null;
  priority: WishlistPriority;
  notes: string | null;
  linkedItemId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AIIdentification {
  id: string;
  itemId: string | null;
  categoryGuess: CategoryKey | null;
  rawResponseJson: string;
  confidence: number;
  possibleMatchesJson: string;
  createdAt: string;
}

export interface ExchangeRate {
  currencyCode: string;
  rateToBase: number;
  updatedAt: string;
}

export interface Settings {
  name: string;
  baseCurrency: string;
  theme: "light" | "dark" | "system";
  aiServerUrl: string;
}

// A fully-hydrated item as used by the UI (item + its attributes/photos joined in)
export interface ItemWithDetails extends Item {
  category: Category;
  attributes: Record<string, string>;
  photos: Photo[];
  valuations: Valuation[];
}

export const SUPPORTED_CURRENCIES = [
  "USD",
  "AED",
  "PKR",
  "IDR",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very Good" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "unspecified", label: "Unspecified" },
];
