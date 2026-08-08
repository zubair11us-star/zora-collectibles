export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesToBase: Record<string, number>,
  baseCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = fromCurrency === baseCurrency ? 1 : ratesToBase[fromCurrency];
  const toRate = toCurrency === baseCurrency ? 1 : ratesToBase[toCurrency];

  if (!fromRate || !toRate) return amount; // unknown rate: return as-is rather than guess

  const inBase = amount * fromRate;
  return inBase / toRate;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
