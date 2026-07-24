import type { CollectionTemplate } from "./collection-templates";
import type { CigarCollection, InventoryItem } from "./types";
import { canonicalBrand } from "./brand-directory";
import { canonicalCigarIdentity, cigarIdentityKey } from "./cigar-identity";
import { standardVitolas } from "./vitolas";

const evidenceOnly = /^(original|numbered|one of).*\b(box|case|book|packaging|humidor)\b/i;
const vague = /\b(distinct|additional|best-selling|family of brands|rare and limited)\b/i;
const slug = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
const familyPrefixes = [
  "OpusX Oro Oscuro OxO", "OpusX 20 Years Celebration", "OpusX 20 Years", "OpusX Angel’s Share",
  "OpusX Heaven and Earth", "OpusX Lost City", "Reserva Don Carlos", "Don Arturo Gran AniverXario",
  "God of Fire Serie Aniversario", "Don Carlos", "Hemingway", "Rare Pink", "Casa Fuente", "Diamond Crown",
  "Chateau Fuente", "Forbidden X", "ForbiddenX", "Ashton ESG", "Ashton VSG", "OpusX", "Preferidos 1903",
];
const explicitBrands = ["San Cristóbal de La Habana", "Hoyo de Monterrey", "Romeo y Julieta", "Joya de Nicaragua", "Arturo Fuente", "H. Upmann", "La Aurora", "My Father", "Diamond Crown", "God of Fire", "Davidoff", "Partagás", "Trinidad", "Bolívar", "Cohiba", "Padrón", "Ashton"];
const vitolaAliases: Array<[RegExp, string]> = [
  [/\bcoronas especiales\b/i, "Coronas Especiales"], [/\bespl[eé]ndidos\b/i, "Espléndidos"],
  [/\brobustos\b/i, "Robusto"], [/\bp[ií]r[aá]mides\b/i, "Pirámide"], [/\bmedias coronas\b/i, "Media Corona"],
  [/\bfigurados?\b/i, "Figurado"], [/\bshark\b/i, "Shark"], [/\bphantom\b/i, "Phantom"],
  [/\bqueen b\b/i, "Queen B"], [/\beye of the shark\b/i, "Eye of the Shark"],
];

export type CollectionComponentIdentity = {
  brand: string;
  line: string;
  vitola: string;
  quantity: number;
  needsIdentityReview: boolean;
};

function knownRetailValue(candidate: InventoryItem, inventory: InventoryItem[]) {
  const identity = cigarIdentityKey(candidate);
  return inventory
    .filter(item => item.retailValue !== undefined && cigarIdentityKey(item) === identity)
    .sort((a, b) => Number(Boolean(b.provenanceNotes)) - Number(Boolean(a.provenanceNotes)))[0]
    ?.retailValue;
}

export function collectionComponentIdentity(requirement: string, template: CollectionTemplate): CollectionComponentIdentity {
  const countMatch = requirement.match(/^(\d+)\s+(.+)$/);
  const quantity = countMatch ? Number(countMatch[1]) : /^\bsix\b/i.test(requirement) ? 6 : 1;
  let description = (countMatch?.[2] || requirement)
    .replace(/\s+cigars?(?:,.*)?$/i, "")
    .replace(/,\s*\d+\s*(?:ring gauge|(?:\d+\s*)?\/?\d*\s*[×x]\s*\d+.*)$/i, "")
    .trim();
  const makerBrand = canonicalBrand(template.maker.split("×")[0].trim());
  const fuentePrefix = /^Fuente Fuente\s+/i.test(description);
  if (fuentePrefix) description = description.replace(/^Fuente Fuente\s+/i, "");
  const jcNewmanPrefix = /^J\.?C\.?\s+Newman\s+/i.test(description);
  if (jcNewmanPrefix) description = description.replace(/^J\.?C\.?\s+Newman\s+/i, "");
  const explicit = explicitBrands.find(candidate => description.toLocaleLowerCase().startsWith(candidate.toLocaleLowerCase()));
  const brand = /padr[oó]n-made/i.test(description) ? "Padrón" : /fuente-made/i.test(description) ? "Arturo Fuente" : canonicalBrand(explicit || makerBrand);
  if (explicit) description = description.slice(explicit.length).trim();
  description = description.replace(/^(?:-made\s+cigars?\s+honoring\s+)/i, "Legends ").replace(/\s+cigars?$/i, "").trim();
  if(brand==="Ashton"){
    const family=description.match(/^(ESG|VSG)\s+(.+)$/i);
    if(family)return{brand,line:`Ashton ${family[1].toUpperCase()} ${family[2]}`,vitola:"Size to verify",quantity,needsIdentityReview:true};
  }

  const standard = [...standardVitolas].sort((a, b) => b.length - a.length).find(value => new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(description));
  const alias = vitolaAliases.find(([pattern]) => pattern.test(description));
  const vitola = standard || alias?.[1];
  if (vitola) {
    const pattern = standard ? new RegExp(`\\b${standard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i") : alias![0];
    const line = description.replace(pattern, " ").replace(/\s+/g, " ").trim() || template.edition || template.name;
    return { brand, line, vitola, quantity, needsIdentityReview: false };
  }

  const family = familyPrefixes.find(value => description.toLocaleLowerCase().startsWith(value.toLocaleLowerCase()));
  if (family) {
    const namedVitola = description.slice(family.length).trim();
    return { brand, line: [family,namedVitola].filter(Boolean).join(" "), vitola: "Size to verify", quantity, needsIdentityReview: true };
  }
  return { brand, line: description || template.edition || template.name, vitola: "Size to verify", quantity, needsIdentityReview: true };
}

export function collectionComponentDrafts(collection: CigarCollection, template: CollectionTemplate, inventory: InventoryItem[], fulfilledRequirements = new Set<string>()) {
  const existing = new Set(inventory.map(item => item.inventoryId));
  return template.requirements.flatMap((requirement, index) => {
    if (fulfilledRequirements.has(requirement) || evidenceOnly.test(requirement) || vague.test(requirement)) return [];
    const identity = collectionComponentIdentity(requirement, template);
    const inventoryId = `INV-${slug(collection.collectionId.replace(/^COL-/i, ""))}-C${String(index + 1).padStart(2, "0")}`;
    if (existing.has(inventoryId)) return [];
    const canonical = canonicalCigarIdentity({ ...identity, vintage: template.releaseYear });
    const draft = { inventoryId, catalogId: canonical.identityId, collectionId: collection.collectionId, brand: identity.brand, line: identity.line, vitola: identity.vitola, vintage: template.releaseYear, looseStickQty: identity.quantity, smokedQty: 0, packaging: template.packaging, status: identity.needsIdentityReview ? "Review" : "Preserve", priority: "High", provenanceNotes: `Collection component documented by ${template.sourceLabel}: ${template.sourceUrl}`, notes: `Expected component: ${requirement}${identity.needsIdentityReview ? " · Exact vitola still requires verification." : ""}` } satisfies InventoryItem;
    return [{ ...draft, retailValue: knownRetailValue(draft, inventory) }];
  });
}

export function collectionComponentRepairs(collection: CigarCollection, template: CollectionTemplate, inventory: InventoryItem[]) {
  const byId = new Map(inventory.map(item => [item.inventoryId, item]));
  return template.requirements.flatMap((requirement, index) => {
    if (evidenceOnly.test(requirement) || vague.test(requirement)) return [];
    const inventoryId = `INV-${slug(collection.collectionId.replace(/^COL-/i, ""))}-C${String(index + 1).padStart(2, "0")}`;
    const existing = byId.get(inventoryId);
    const legacyGenerated = existing?.collectionId === collection.collectionId
      && existing.notes?.includes("Expected component:");
    if (!existing || !legacyGenerated) return [];
    const identity = collectionComponentIdentity(requirement, template);
    const canonical = canonicalCigarIdentity({ ...identity, vintage: template.releaseYear });
    const repaired = {
      ...existing,
      catalogId: canonical.identityId,
      brand: identity.brand,
      line: identity.line,
      vitola: identity.vitola,
    };
    return [{
      ...repaired,
      retailValue: repaired.retailValue ?? knownRetailValue(repaired, inventory),
      status: identity.needsIdentityReview ? "Review" : existing.status === "Review" ? "Preserve" : existing.status,
      notes: `Expected component: ${requirement}${identity.needsIdentityReview ? " · Exact vitola still requires verification." : ""}`,
    } satisfies InventoryItem];
  });
}

export function unmaterializedCollectionRequirements(template: CollectionTemplate) {
  return template.requirements.filter(requirement => evidenceOnly.test(requirement) || vague.test(requirement));
}
