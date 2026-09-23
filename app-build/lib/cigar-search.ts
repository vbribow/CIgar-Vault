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

function tokenMatches(term:string,candidate:string){
  return candidate===term||(term.length>=2&&candidate.startsWith(term));
}

export function matchesInventorySearch(item: InventoryItem, query: string) {
  const terms = normalizeCigarSearch(query).split(" ").filter(Boolean);
  if (!terms.length) return true;
  const searchable = inventorySearchText(item);
  const searchableTerms = searchable.split(" ").filter(Boolean);
  return terms.every((term) => searchableTerms.some((candidate) => tokenMatches(term,candidate)));
}

/** Require every normalized query word to appear as a complete identity word. */
export function matchesInventorySearchExactWords(item:InventoryItem,query:string){
  const terms=normalizeCigarSearch(query).split(" ").filter(Boolean);
  if(!terms.length)return true;
  const searchableTerms=new Set(inventorySearchText(item).split(" ").filter(Boolean));
  return terms.every(term=>searchableTerms.has(term));
}

/** Tolerate one extra family word in the quick journal search only. */
export function matchesInventorySearchForgiving(item: InventoryItem, query: string) {
  if (matchesInventorySearch(item, query)) return true;
  const terms = normalizeCigarSearch(query).split(" ").filter(Boolean);
  if (terms.length < 3) return false;
  const searchableTerms = inventorySearchText(item).split(" ").filter(Boolean);
  const matched = terms.filter(term => searchableTerms.some(candidate => tokenMatches(term,candidate))).length;
  return matched >= 2 && matched / terms.length >= 2 / 3;
}

function exactInventoryIdentity(item:InventoryItem){
  return normalizeCigarSearch([item.brand,item.line,item.vitola].join(" "));
}

/** Hide a stale empty/quantity-less duplicate when the same exact cigar has an owned lot. */
export function preferActionableInventoryMatches(items:InventoryItem[]){
  const ownedIdentities=new Set(items.filter(item=>(item.currentQty??0)>0).map(exactInventoryIdentity));
  return items.filter(item=>(item.currentQty??0)>0||!ownedIdentities.has(exactInventoryIdentity(item)));
}
