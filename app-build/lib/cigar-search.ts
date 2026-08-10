import type { InventoryItem } from "./types";

export function normalizeCigarSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\btoymaker\b/g, "toy maker")
    .replace(/\btaurus\b/g, "tauros")
    .replace(/\bopus x\b/g, "opusx")
    .trim();
}

function inventorySearchText(item: InventoryItem) {
  const canonical = normalizeCigarSearch([
    item.inventoryId,
    item.brand,
    item.line,
    item.vitola,
    item.vintage,
    item.collectionId,
  ].filter(Boolean).join(" "));

  // Search aliases improve discovery only. They never change or merge cigar identity.
  const aliases: string[] = [];
  if (canonical.includes("toy maker") && (canonical.includes(" bmf") || canonical.includes("bbmf"))) {
    aliases.push("opusx");
  }
  return `${canonical} ${aliases.join(" ")}`.trim();
}

export function matchesInventorySearch(item: InventoryItem, query: string) {
  const terms = normalizeCigarSearch(query).split(" ").filter(Boolean);
  if (!terms.length) return true;
  const searchable = inventorySearchText(item);
  const searchableTerms = searchable.split(" ").filter(Boolean);
  return terms.every((term) => searchableTerms.some((candidate) => candidate === term || candidate.startsWith(term)));
}
