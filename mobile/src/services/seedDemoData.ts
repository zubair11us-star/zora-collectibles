import { db } from "@/db/client";
import { exchangeRates, settings as settingsTable } from "@/db/schema";
import { createItem, CreateItemInput } from "@/db/repositories/itemsRepo";
import { createLocation, createStorageBox } from "@/db/repositories/locationsRepo";

const DEMO_SEED_FLAG = "demoSeeded";

// Approximate, clearly-marked demo exchange rates (to AED, the default base
// currency). Not live rates — see Settings to edit or Phase 3 for live FX.
const DEMO_RATES_TO_AED: Record<string, number> = {
  USD: 3.67,
  EUR: 4.0,
  GBP: 4.6,
  PKR: 0.013,
  IDR: 0.00024,
  JPY: 0.025,
  CNY: 0.51,
};

const DEMO_ITEMS: CreateItemInput[] = [
  // Currency
  { categoryKey: "currency", name: "USD $1 Note", country: "United States", currency: "USD", denomination: "1", year: 2013, condition: "good", purchasePrice: 1, purchaseCurrency: "USD", currentValue: 1.5, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "currency", name: "USD $5 Note", country: "United States", currency: "USD", denomination: "5", year: 2017, condition: "very_good", purchasePrice: 5, purchaseCurrency: "USD", currentValue: 6, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "currency", name: "AED 100 Note", country: "United Arab Emirates", currency: "AED", denomination: "100", year: 2021, condition: "near_mint", purchasePrice: 100, purchaseCurrency: "AED", currentValue: 105, currentValueCurrency: "AED", identificationSource: "manual", isDemo: true },
  { categoryKey: "currency", name: "PKR 5000 Note", country: "Pakistan", currency: "PKR", denomination: "5000", year: 2019, condition: "good", purchasePrice: 5000, purchaseCurrency: "PKR", currentValue: 5200, currentValueCurrency: "PKR", identificationSource: "manual", isDemo: true },
  { categoryKey: "currency", name: "IDR 100,000 Note", country: "Indonesia", currency: "IDR", denomination: "100000", year: 2016, condition: "good", purchasePrice: 100000, purchaseCurrency: "IDR", currentValue: 105000, currentValueCurrency: "IDR", identificationSource: "manual", isDemo: true },

  // Coins
  { categoryKey: "coins", name: "US Quarter", country: "United States", currency: "USD", denomination: "25 cents", year: 1998, condition: "good", purchasePrice: 0.25, purchaseCurrency: "USD", currentValue: 1.5, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { metal: "Copper-Nickel Clad" } },
  { categoryKey: "coins", name: "UAE 1 Dirham Coin", country: "United Arab Emirates", currency: "AED", denomination: "1", year: 2007, condition: "excellent", purchasePrice: 1, purchaseCurrency: "AED", currentValue: 1.2, currentValueCurrency: "AED", identificationSource: "manual", isDemo: true },
  { categoryKey: "coins", name: "Pakistan Rupee Coin", country: "Pakistan", currency: "PKR", denomination: "5", year: 2015, condition: "good", purchasePrice: 5, purchaseCurrency: "PKR", currentValue: 6, currentValueCurrency: "PKR", identificationSource: "manual", isDemo: true },
  { categoryKey: "coins", name: "Indonesian Rupiah Coin", country: "Indonesia", currency: "IDR", denomination: "500", year: 2012, condition: "good", purchasePrice: 500, purchaseCurrency: "IDR", currentValue: 550, currentValueCurrency: "IDR", identificationSource: "manual", isDemo: true },

  // Hot Wheels
  { categoryKey: "hotwheels", name: "Toyota Supra", manufacturer: "Mattel", model: "Toyota Supra", year: 2020, condition: "mint", purchasePrice: 1.5, purchaseCurrency: "USD", currentValue: 8, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { packagingStatus: "Carded / MOC" } },
  { categoryKey: "hotwheels", name: "Nissan Skyline", manufacturer: "Mattel", model: "Nissan Skyline", year: 2019, condition: "mint", purchasePrice: 2, purchaseCurrency: "USD", currentValue: 12, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { packagingStatus: "Carded / MOC" } },
  { categoryKey: "hotwheels", name: "Porsche 911", manufacturer: "Mattel", model: "Porsche 911", year: 2021, condition: "mint", purchasePrice: 2, purchaseCurrency: "USD", currentValue: 6, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "hotwheels", name: "Lamborghini", manufacturer: "Mattel", model: "Lamborghini Huracan", year: 2018, condition: "near_mint", purchasePrice: 1.5, purchaseCurrency: "USD", currentValue: 5, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },

  // Pokemon
  { categoryKey: "pokemon", name: "Pikachu", setName: "Base Set", cardNumber: "58/102", year: 1999, condition: "near_mint", purchasePrice: 5, purchaseCurrency: "USD", currentValue: 25, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { rarity: "Common", language: "English" } },
  { categoryKey: "pokemon", name: "Charizard", setName: "Base Set", cardNumber: "4/102", year: 1999, condition: "good", purchasePrice: 50, purchaseCurrency: "USD", currentValue: 350, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { rarity: "Holo Rare", language: "English", holoType: "Holo" } },
  { categoryKey: "pokemon", name: "Mewtwo", setName: "Base Set", cardNumber: "10/102", year: 1999, condition: "excellent", purchasePrice: 8, purchaseCurrency: "USD", currentValue: 40, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { rarity: "Holo Rare", language: "English" } },
  { categoryKey: "pokemon", name: "Bulbasaur", setName: "Base Set", cardNumber: "44/102", year: 1999, condition: "near_mint", purchasePrice: 3, purchaseCurrency: "USD", currentValue: 15, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true, attributes: { rarity: "Common", language: "English" } },

  // Stamps
  { categoryKey: "stamps", name: "Pakistan Commemorative Stamp", country: "Pakistan", year: 1975, condition: "good", purchasePrice: 1, purchaseCurrency: "USD", currentValue: 3, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "stamps", name: "UAE Commemorative Stamp", country: "United Arab Emirates", year: 1985, condition: "good", purchasePrice: 1, purchaseCurrency: "USD", currentValue: 2, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "stamps", name: "Indonesia Commemorative Stamp", country: "Indonesia", year: 1990, condition: "good", purchasePrice: 1, purchaseCurrency: "USD", currentValue: 2.5, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
  { categoryKey: "stamps", name: "Japan Commemorative Stamp", country: "Japan", year: 1970, condition: "excellent", purchasePrice: 2, purchaseCurrency: "USD", currentValue: 5, currentValueCurrency: "USD", identificationSource: "manual", isDemo: true },
];

export async function ensureDemoDataSeeded(): Promise<void> {
  const flag = await db.query.settings.findFirst({
    where: (s, { eq }) => eq(s.key, DEMO_SEED_FLAG),
  });
  if (flag) return;

  for (const [code, rate] of Object.entries(DEMO_RATES_TO_AED)) {
    await db.insert(exchangeRates).values({ currencyCode: code, rateToBase: rate });
  }

  const homeId = await createLocation("Home");
  const cabinetId = await createStorageBox("Display Cabinet 1", homeId, "Main living room cabinet");
  const pokemonBoxId = await createStorageBox("Pokemon Box 03", homeId, "Card storage box");

  for (const item of DEMO_ITEMS) {
    const withStorage: CreateItemInput = {
      ...item,
      locationId: homeId,
      storageBoxId: item.categoryKey === "pokemon" ? pokemonBoxId : cabinetId,
      storagePosition: item.categoryKey === "pokemon" ? "A-1" : "Shelf 1",
    };
    await createItem(withStorage);
  }

  await db.insert(settingsTable).values({ key: DEMO_SEED_FLAG, value: "true" });
}
