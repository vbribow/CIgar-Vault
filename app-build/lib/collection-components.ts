import type { CollectionTemplate } from "./collection-templates";
import type { CigarCollection, InventoryItem } from "./types";

const evidenceOnly = /^(original|numbered|one of).*\b(box|case|book|packaging|humidor)\b/i;
const vague = /\b(distinct|additional|best-selling|family of brands|rare and limited)\b/i;
const slug = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);

export function collectionComponentDrafts(collection: CigarCollection, template: CollectionTemplate, inventory: InventoryItem[], fulfilledRequirements = new Set<string>()) {
  const existing = new Set(inventory.map(item => item.inventoryId));
  return template.requirements.flatMap((requirement, index) => {
    if (fulfilledRequirements.has(requirement) || evidenceOnly.test(requirement) || vague.test(requirement)) return [];
    const countMatch = requirement.match(/^(\d+)\s+(.+)$/);
    const quantity = countMatch ? Number(countMatch[1]) : 1;
    const description = (countMatch?.[2] || requirement).replace(/\s+cigars?(?:,.*)?$/i, "").trim();
    if (!description) return [];
    const inventoryId = `INV-${slug(collection.collectionId.replace(/^COL-/i, ""))}-C${String(index + 1).padStart(2, "0")}`;
    if (existing.has(inventoryId)) return [];
    const padron = /padr[oó]n-made/i.test(description), fuente = /fuente-made/i.test(description);
    const brand = padron ? "Padrón" : fuente ? "Arturo Fuente" : template.maker.split("×")[0].trim();
    return [{ inventoryId, collectionId: collection.collectionId, brand, line: collection.name, vitola: description, vintage: template.releaseYear, looseStickQty: quantity, smokedQty: 0, packaging: template.packaging, status: "Preserve", priority: "High", provenanceNotes: `Collection component documented by ${template.sourceLabel}: ${template.sourceUrl}`, notes: `Expected component: ${requirement}` } satisfies InventoryItem];
  });
}

export function unmaterializedCollectionRequirements(template: CollectionTemplate) {
  return template.requirements.filter(requirement => evidenceOnly.test(requirement) || vague.test(requirement));
}
