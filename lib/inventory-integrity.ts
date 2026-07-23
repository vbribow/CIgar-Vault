import type { InventoryItem } from "./types";

export type IntegrityStatus = "matched" | "master-only" | "account-only" | "mismatch";

export type InventoryDifference = {
  field: string;
  label: string;
  master: unknown;
  account: unknown;
};

export type IntegrityItem = {
  inventoryId: string;
  identity: string;
  status: IntegrityStatus;
  master?: InventoryItem;
  account?: InventoryItem;
  differences: InventoryDifference[];
};

const comparedFields: Array<[keyof InventoryItem, string]> = [
  ["brand", "Brand"], ["line", "Series"], ["vitola", "Vitola"],
  ["vintage", "Release year"], ["packaging", "Packaging"],
  ["fullBoxQty", "Full boxes"], ["sticksPerBox", "Cigars per box"],
  ["looseStickQty", "Loose sticks"], ["currentQty", "Current quantity"],
  ["retailValue", "Unit value"], ["storageLocationId", "Storage"],
  ["habanosVerified", "Habanos verification"], ["boxCode", "Box code"],
];

function normalized(value: unknown) {
  return value === undefined || value === null || value === "" ? undefined : value;
}

function identity(item?: InventoryItem) {
  return item ? [item.brand, item.line, item.vitola, item.vintage].filter(Boolean).join(" · ") : "Unknown inventory lot";
}

export function findDuplicateInventoryIds(items: InventoryItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.inventoryId, (counts.get(item.inventoryId) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([inventoryId, count]) => ({ inventoryId, count }));
}

export function reconcileInventory(master: InventoryItem[], account: InventoryItem[]): IntegrityItem[] {
  const masterById = new Map(master.map(item => [item.inventoryId, item]));
  const accountById = new Map(account.map(item => [item.inventoryId, item]));
  const ids = new Set([...masterById.keys(), ...accountById.keys()]);
  return [...ids].map(inventoryId => {
    const masterItem = masterById.get(inventoryId);
    const accountItem = accountById.get(inventoryId);
    const differences = masterItem && accountItem ? comparedFields.flatMap(([field, label]) => {
      const masterValue = normalized(masterItem[field]);
      const accountValue = normalized(accountItem[field]);
      return Object.is(masterValue, accountValue) ? [] : [{ field: String(field), label, master: masterValue, account: accountValue }];
    }) : [];
    const status: IntegrityStatus = !accountItem ? "master-only" : !masterItem ? "account-only" : differences.length ? "mismatch" : "matched";
    return { inventoryId, identity: identity(masterItem ?? accountItem), status, master: masterItem, account: accountItem, differences };
  }).sort((a, b) => {
    const rank: Record<IntegrityStatus, number> = { mismatch: 0, "master-only": 1, "account-only": 2, matched: 3 };
    return rank[a.status] - rank[b.status] || a.identity.localeCompare(b.identity);
  });
}

export function integritySummary(items: IntegrityItem[]) {
  const count = (status: IntegrityStatus) => items.filter(item => item.status === status).length;
  const matched = count("matched");
  return {
    total: items.length,
    matched,
    mismatched: count("mismatch"),
    masterOnly: count("master-only"),
    accountOnly: count("account-only"),
    score: items.length ? Math.round((matched / items.length) * 100) : 100,
  };
}
