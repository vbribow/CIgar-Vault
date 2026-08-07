import { canonicalBrand } from "./brand-directory";
import type { CatalogCigar, InventoryItem } from "./types";

type NamingReference = Pick<CatalogCigar, "catalogId" | "brand" | "line" | "vitola">;

// Primary-source identities can enforce a canonical name before the shared catalog refreshes.
export const sourcedNamingReferences: Array<NamingReference & { sourceUrl: string; dimensions?: string }> = [
  {
    catalogId: "",
    brand: "Drew Estate",
    line: "Liga Privada T52",
    vitola: "Robusto",
    dimensions: "5 x 54",
    sourceUrl: "https://drewestate.com/products/liga-privada/liga-privada-t52/",
  },
];

function key(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function canonicalValue(value: string, candidates: string[]) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const unique = [...new Set(candidates.filter(Boolean))];
  const documentedAliases = new Map([["liga t 52", "Liga Privada T52"], ["liga t52", "Liga Privada T52"]]);
  const alias = documentedAliases.get(key(trimmed));
  if (alias && unique.includes(alias)) return alias;
  const exact = unique.find(candidate => key(candidate) === key(trimmed));
  if (exact) return exact;
  const close = unique.filter(candidate => {
    const input = key(trimmed), option = key(candidate);
    const distance = editDistance(input, option);
    return distance <= (Math.max(input.length, option.length) >= 9 ? 2 : 1) && distance / Math.max(input.length, option.length, 1) <= 0.22;
  });
  return close.length === 1 ? close[0] : trimmed;
}

export function canonicalizeInventoryNaming<T extends InventoryItem>(item: T, catalog: CatalogCigar[] = []): T {
  const references: NamingReference[] = [...catalog, ...sourcedNamingReferences];
  const brand = canonicalBrand(item.brand);
  const brandReferences = references.filter(reference => canonicalBrand(reference.brand) === brand);
  const line = canonicalValue(item.line, brandReferences.map(reference => reference.line));
  const lineReferences = brandReferences.filter(reference => key(reference.line) === key(line));
  const vitola = canonicalValue(item.vitola, lineReferences.map(reference => reference.vitola));
  const exact = catalog.find(reference => canonicalBrand(reference.brand) === brand && key(reference.line) === key(line) && key(reference.vitola) === key(vitola));
  const { catalogId: _previousCatalogId, ...withoutCatalogIdentity } = item;
  return { ...withoutCatalogIdentity, brand, line, vitola, ...(exact?.catalogId ? { catalogId: exact.catalogId } : {}) } as T;
}
