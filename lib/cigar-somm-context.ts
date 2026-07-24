import { buildCollectorDNA } from "./collection-intelligence";
import type { CigarCollection, Humidor, HumidorReading, InventoryItem, SmokingLog, Valuation, WishlistItem } from "./types";

export type CigarSommCollectorContext = {
  privacy: "Private summary for this signed-in collector";
  inventory: { lots: number; cigars: number; representedBrands: string[]; documentedValue?: number };
  taste: ReturnType<typeof buildCollectorDNA>;
  selectedCigar?: {
    ownedQuantity?: number;
    vintage?: string | number;
    collection?: string;
    storage?: string;
    latestClimate?: { temperatureF: number; humidity: number; recordedAt: string };
    latestValuePerCigar?: number;
  };
  wishlist: { watching: number; priorityTargets: string[] };
  collections: { owned: number; complete: number; names: string[] };
  smokingHistory: { recorded: number; recent: string[] };
};

const money = (value: number | undefined) => Number.isFinite(value) ? value : undefined;
const identity = (item: InventoryItem) => `${item.brand} ${item.line} ${item.vitola}`.replace(/\s+/g, " ").trim();

export function buildCigarSommCollectorContext(input: {
  inventory: InventoryItem[];
  smokes: SmokingLog[];
  valuations?: Valuation[];
  wishlist?: WishlistItem[];
  collections?: CigarCollection[];
  humidors?: Humidor[];
  readings?: HumidorReading[];
  selectedInventoryId?: string;
}): CigarSommCollectorContext {
  const valuations = input.valuations || [], wishlist = input.wishlist || [], collections = input.collections || [];
  const humidors = input.humidors || [], readings = input.readings || [];
  const selected = input.selectedInventoryId ? input.inventory.find(item => item.inventoryId === input.selectedInventoryId) : undefined;
  const representedBrands = [...new Set(input.inventory.map(item => item.brand.trim()).filter(Boolean))].sort().slice(0, 12);
  const documentedValue = input.inventory.reduce((sum, item) => sum + (money(item.retailValue) || 0) * (item.currentQty || 0), 0);
  const collection = selected?.collectionId ? collections.find(value => value.collectionId === selected.collectionId) : undefined;
  const humidor = selected?.storageLocationId ? humidors.find(value => value.humidorId === selected.storageLocationId) : undefined;
  const latestReading = humidor ? readings.filter(value => value.humidorId === humidor.humidorId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] : undefined;
  const latestValuation = selected ? valuations.filter(value => value.inventoryId === selected.inventoryId).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate))[0] : undefined;
  const recent = [...input.smokes].sort((a, b) => b.dateSmoked.localeCompare(a.dateSmoked)).slice(0, 5).map(smoke => {
    const item = input.inventory.find(value => value.inventoryId === smoke.inventoryId);
    return `${item ? identity(item) : "Recorded cigar"}${smoke.overall !== undefined ? ` · ${smoke.overall}/100` : ""}`;
  });
  const priorityTargets = wishlist
    .filter(item => item.status === "Watching")
    .sort((a, b) => ({ High: 0, Medium: 1, Standard: 2 }[a.priority] - ({ High: 0, Medium: 1, Standard: 2 }[b.priority])))
    .slice(0, 5)
    .map(item => `${item.brand} ${item.line} ${item.vitola}`.replace(/\s+/g, " ").trim());
  const selectedCigar = selected ? {
    ownedQuantity: selected.currentQty,
    vintage: selected.vintage,
    collection: collection?.name,
    storage: humidor?.name,
    latestClimate: latestReading ? { temperatureF: latestReading.temperatureF, humidity: latestReading.humidity, recordedAt: latestReading.recordedAt } : undefined,
    latestValuePerCigar: money(latestValuation?.marketValue ?? latestValuation?.replacementValue ?? selected.retailValue),
  } : undefined;
  return {
    privacy: "Private summary for this signed-in collector",
    inventory: { lots: input.inventory.length, cigars: input.inventory.reduce((sum, item) => sum + (item.currentQty || 0), 0), representedBrands, documentedValue: documentedValue || undefined },
    taste: buildCollectorDNA(input.inventory, input.smokes),
    selectedCigar,
    wishlist: { watching: wishlist.filter(item => item.status === "Watching").length, priorityTargets },
    collections: { owned: collections.length, complete: collections.filter(item => item.status === "Complete").length, names: collections.map(item => item.name).slice(0, 8) },
    smokingHistory: { recorded: input.smokes.length, recent },
  };
}
