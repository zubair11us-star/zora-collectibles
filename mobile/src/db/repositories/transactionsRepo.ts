import { and, desc, eq } from "drizzle-orm";

import { db } from "../client";
import { items, transactions } from "../schema";
import { generateId } from "@/utils/id";
import { Transaction, TransactionType } from "@/types/models";

export interface CreateTransactionInput {
  itemId: string;
  type: TransactionType;
  date: string;
  counterparty?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  fees?: number;
  shipping?: number;
  notes?: string;
}

function computeDerivedAmounts(input: CreateTransactionInput): { totalCost: number | null; netAmount: number | null } {
  const price = input.price ?? 0;
  const fees = input.fees ?? 0;
  const shipping = input.shipping ?? 0;

  if (input.type === "purchase" || input.type === "trade") {
    return { totalCost: price + fees + shipping, netAmount: null };
  }
  if (input.type === "sale") {
    return { totalCost: null, netAmount: price - fees - shipping };
  }
  return { totalCost: null, netAmount: null };
}

export async function addTransaction(input: CreateTransactionInput): Promise<string> {
  const id = generateId();
  const { totalCost, netAmount } = computeDerivedAmounts(input);

  await db.insert(transactions).values({
    id,
    itemId: input.itemId,
    type: input.type,
    date: input.date,
    counterparty: input.counterparty ?? null,
    price: input.price ?? null,
    currency: input.currency ?? null,
    quantity: input.quantity ?? 1,
    fees: input.fees ?? null,
    shipping: input.shipping ?? null,
    totalCost,
    netAmount,
    notes: input.notes ?? null,
    updatedAt: new Date().toISOString(),
  });

  return id;
}

export async function listTransactionsByItem(itemId: string): Promise<Transaction[]> {
  return (await db
    .select()
    .from(transactions)
    .where(eq(transactions.itemId, itemId))
    .orderBy(desc(transactions.date))) as Transaction[];
}

export interface TransactionWithItemName extends Transaction {
  itemName: string;
}

export async function listAllTransactions(type?: TransactionType): Promise<TransactionWithItemName[]> {
  const conditions = type ? [eq(transactions.type, type)] : [];
  const rows = await db
    .select({ transaction: transactions, itemName: items.name })
    .from(transactions)
    .innerJoin(items, eq(transactions.itemId, items.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date));

  return rows.map(({ transaction, itemName }) => ({ ...(transaction as Transaction), itemName }));
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}
