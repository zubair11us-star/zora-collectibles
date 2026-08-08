import { desc, eq } from "drizzle-orm";

import { db } from "../client";
import { categories, exchangeRates, items, photos, transactions } from "../schema";
import { convertAmount } from "@/utils/currency";
import { getAllSettings } from "./settingsRepo";
import { CategoryKey } from "@/types/models";

export interface CategorySummary {
  categoryKey: CategoryKey;
  categoryName: string;
  icon: string;
  itemCount: number;
  totalValue: number;
}

export interface TopItemSummary {
  id: string;
  name: string;
  value: number;
  currency: string;
}

export interface RoiItemSummary {
  id: string;
  name: string;
  roiPercent: number;
}

export interface CountrySummary {
  country: string;
  itemCount: number;
}

export interface RecentTransactionSummary {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  amount: number | null;
  currency: string | null;
}

export interface DashboardStats {
  totalItems: number;
  totalQuantity: number;
  estimatedCollectionValue: number;
  totalPurchaseCost: number;
  profitLoss: number;
  itemsAddedThisMonth: number;
  itemsMissingInfo: number;
  itemsMissingPhotos: number;
  itemsForSale: number;
  baseCurrency: string;
  categories: CategorySummary[];
  monthlyGrowth: { month: string; count: number; value: number }[];
  mostValuableItem: TopItemSummary | null;
  highestRoiItem: RoiItemSummary | null;
  countryDistribution: CountrySummary[];
  latestPurchases: RecentTransactionSummary[];
  latestSales: RecentTransactionSummary[];
}

async function ratesToBaseMap(): Promise<Record<string, number>> {
  const rows = await db.select().from(exchangeRates);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.currencyCode] = r.rateToBase;
  return map;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const settings = await getAllSettings();
  const base = settings.baseCurrency;
  const rates = await ratesToBaseMap();

  const allItems = await db
    .select({ item: items, category: categories })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.isDeleted, false));

  const photoCounts = new Map<string, number>();
  const allPhotos = await db.select().from(photos);
  for (const p of allPhotos) photoCounts.set(p.itemId, (photoCounts.get(p.itemId) ?? 0) + 1);

  const toBase = (amount: number | null, currency: string | null) => {
    if (amount == null) return 0;
    return convertAmount(amount, currency ?? base, base, rates, base);
  };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const categoryMap = new Map<string, CategorySummary>();
  let totalQuantity = 0;
  let estimatedCollectionValue = 0;
  let totalPurchaseCost = 0;
  let itemsAddedThisMonth = 0;
  let itemsMissingInfo = 0;
  let itemsMissingPhotos = 0;
  let itemsForSale = 0;
  const growthByMonth = new Map<string, { count: number; value: number }>();
  const countryCounts = new Map<string, number>();
  let mostValuableItem: TopItemSummary | null = null;
  let mostValuableItemBaseValue = -Infinity;
  let highestRoiItem: RoiItemSummary | null = null;
  let highestRoiValue = -Infinity;

  for (const { item, category } of allItems) {
    totalQuantity += item.quantity;
    const value = toBase(item.currentValue, item.currentValueCurrency ?? item.currency) * item.quantity;
    const cost = toBase(item.purchasePrice, item.purchaseCurrency ?? item.currency) * item.quantity;
    estimatedCollectionValue += value;
    totalPurchaseCost += cost;

    if (new Date(item.createdAt) >= startOfMonth) itemsAddedThisMonth += 1;
    if (!item.country || !item.year || !item.currentValue || item.condition === "unspecified") {
      itemsMissingInfo += 1;
    }
    if (!photoCounts.get(item.id)) itemsMissingPhotos += 1;
    if (item.saleStatus !== "not_for_sale") itemsForSale += 1;
    if (item.country) countryCounts.set(item.country, (countryCounts.get(item.country) ?? 0) + 1);

    if (item.currentValue != null && value > mostValuableItemBaseValue) {
      mostValuableItemBaseValue = value;
      mostValuableItem = { id: item.id, name: item.name, value: item.currentValue, currency: item.currentValueCurrency ?? base };
    }
    if (item.purchasePrice != null && item.purchasePrice > 0 && item.currentValue != null) {
      const roiPercent = ((value - cost) / cost) * 100;
      if (roiPercent > highestRoiValue) {
        highestRoiValue = roiPercent;
        highestRoiItem = { id: item.id, name: item.name, roiPercent };
      }
    }

    const key = category.key as CategoryKey;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.itemCount += 1;
      existing.totalValue += value;
    } else {
      categoryMap.set(key, {
        categoryKey: key,
        categoryName: category.name,
        icon: category.icon,
        itemCount: 1,
        totalValue: value,
      });
    }

    const monthKey = item.createdAt.slice(0, 7); // YYYY-MM
    const g = growthByMonth.get(monthKey) ?? { count: 0, value: 0 };
    g.count += 1;
    g.value += value;
    growthByMonth.set(monthKey, g);
  }

  const monthlyGrowth = Array.from(growthByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  const countryDistribution = Array.from(countryCounts.entries())
    .map(([country, itemCount]) => ({ country, itemCount }))
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 8);

  const recentTransactionRows = await db
    .select({ transaction: transactions, itemName: items.name })
    .from(transactions)
    .innerJoin(items, eq(transactions.itemId, items.id))
    .orderBy(desc(transactions.date));

  const toSummary = (r: (typeof recentTransactionRows)[number]): RecentTransactionSummary => ({
    id: r.transaction.id,
    itemId: r.transaction.itemId,
    itemName: r.itemName,
    date: r.transaction.date,
    amount: r.transaction.type === "sale" ? r.transaction.netAmount : r.transaction.totalCost,
    currency: r.transaction.currency,
  });

  const latestPurchases = recentTransactionRows
    .filter((r) => r.transaction.type === "purchase")
    .slice(0, 5)
    .map(toSummary);
  const latestSales = recentTransactionRows
    .filter((r) => r.transaction.type === "sale")
    .slice(0, 5)
    .map(toSummary);

  return {
    totalItems: allItems.length,
    totalQuantity,
    estimatedCollectionValue,
    totalPurchaseCost,
    profitLoss: estimatedCollectionValue - totalPurchaseCost,
    itemsAddedThisMonth,
    itemsMissingInfo,
    itemsMissingPhotos,
    itemsForSale,
    baseCurrency: base,
    categories: Array.from(categoryMap.values()).sort((a, b) => b.totalValue - a.totalValue),
    monthlyGrowth,
    mostValuableItem,
    highestRoiItem,
    countryDistribution,
    latestPurchases,
    latestSales,
  };
}
