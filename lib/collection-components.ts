import { completeCollectionComponentEvidence, type CollectionTemplate } from "./collection-templates";
import type { CigarCollection, InventoryItem } from "./types";
import { canonicalBrand } from "./brand-directory";
import { canonicalCigarIdentity, cigarIdentityKey } from "./cigar-identity";
import { standardVitolas } from "./vitolas";

const evidenceOnly = /^(original|numbered|one of).*\b(box|case|book|packaging|humidor)\b/i;
const vague = /\b(distinct|additional|best-selling|family of brands|rare and limited)\b/i;
const slug = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
const requirementQuantity = (requirement:string) => Number(requirement.match(/^(\d+)\s+/)?.[1] ?? 1);
const componentInventoryId = (collectionId:string,index:number) => `INV-${slug(collectionId.replace(/^COL-/i, ""))}-C${String(index + 1).padStart(2, "0")}`;
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

export function collectionPopulationCandidates(
  collectionId: string,
  inventory: InventoryItem[],
) {
  return inventory.filter(
    (item) =>
      (item.currentQty ?? 0) > 0 && item.collectionId === collectionId,
  );
}

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
  const documented = template.componentEvidence?.find(component => component.requirement === requirement);
  if (documented) return { brand: documented.brand, line: documented.line, vitola: documented.vitola, quantity, needsIdentityReview: false };
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
    const documented = template.componentEvidence?.find(component => component.requirement === requirement);
    // A parseable product name is not enough to create collector inventory.
    // Researched component evidence must establish the exact named vitola or
    // sourced dimensions before Hojavía can materialize a physical lot.
    if (!completeCollectionComponentEvidence(documented)) return [];
    const identity = collectionComponentIdentity(requirement, template);
    const inventoryId = componentInventoryId(collection.collectionId,index);
    if (existing.has(inventoryId)) return [];
    const canonical = canonicalCigarIdentity(identity);
    const evidenceLabel = documented?.sourceLabel || template.sourceLabel;
    const evidenceUrl = documented?.sourceUrl || template.sourceUrl;
    const draft = { inventoryId, catalogId: canonical.identityId, collectionId: collection.collectionId, brand: identity.brand, line: identity.line, vitola: identity.vitola, originalQty: identity.quantity, currentQty: identity.quantity, looseStickQty: identity.quantity, smokedQty: 0, packaging: template.packaging, status: identity.needsIdentityReview ? "Review" : "Preserve", priority: "High", provenanceNotes: `Collection component documented by ${evidenceLabel}: ${evidenceUrl}`, notes: `Expected component: ${requirement}${identity.needsIdentityReview ? " · Exact vitola still requires verification." : ""}` } satisfies InventoryItem;
    return [{ ...draft, retailValue: knownRetailValue(draft, inventory) }];
  });
}

export function collectionComponentRepairs(collection: CigarCollection, template: CollectionTemplate, inventory: InventoryItem[]) {
  const byId = new Map(inventory.map(item => [item.inventoryId, item]));
  return template.requirements.flatMap((requirement, index) => {
    if (evidenceOnly.test(requirement) || vague.test(requirement)) return [];
    const documented = template.componentEvidence?.find(component => component.requirement === requirement);
    if (!completeCollectionComponentEvidence(documented)) return [];
    const inventoryId = componentInventoryId(collection.collectionId,index);
    const existing = byId.get(inventoryId);
    const legacyGenerated = existing?.collectionId === collection.collectionId
      && existing.notes?.includes("Expected component:");
    if (!existing || !legacyGenerated) return [];
    const identity = collectionComponentIdentity(requirement, template);
    const inheritedCollectionYear = existing.vintage !== undefined
      && template.releaseYear !== undefined
      && Number(existing.vintage) === Number(template.releaseYear);
    const cigarVintage = inheritedCollectionYear ? undefined : existing.vintage;
    const canonical = canonicalCigarIdentity({ ...identity, vintage: cigarVintage });
    const evidenceLabel = documented?.sourceLabel || template.sourceLabel;
    const evidenceUrl = documented?.sourceUrl || template.sourceUrl;
    const notes = `Expected component: ${requirement}${identity.needsIdentityReview ? " · Exact vitola still requires verification." : ""}`;
    const provenanceNotes = `Collection component documented by ${evidenceLabel}: ${evidenceUrl}`;
    const previousRequirement=existing.notes?.match(/^Expected component:\s*(.*?)(?:\s+·|$)/)?.[1];
    const untouchedGeneratedQuantity=previousRequirement!==requirement
      && existing.originalQty!==undefined
      && existing.currentQty===existing.originalQty
      && (existing.looseStickQty??existing.currentQty)===existing.currentQty
      && (existing.smokedQty??0)===0;
    const repaired = {
      ...existing,
      catalogId: canonical.identityId,
      brand: identity.brand,
      line: identity.line,
      vitola: identity.vitola,
      originalQty: untouchedGeneratedQuantity ? identity.quantity : existing.originalQty ?? identity.quantity,
      currentQty: untouchedGeneratedQuantity ? identity.quantity : existing.currentQty ?? existing.looseStickQty ?? identity.quantity,
      looseStickQty: untouchedGeneratedQuantity ? identity.quantity : existing.looseStickQty ?? existing.currentQty ?? identity.quantity,
      smokedQty: existing.smokedQty ?? 0,
      vintage: cigarVintage,
      provenanceNotes,
    };
    const result = {
      ...repaired,
      retailValue: repaired.retailValue ?? knownRetailValue(repaired, inventory),
      status: identity.needsIdentityReview ? "Review" : existing.status === "Review" ? "Preserve" : existing.status,
      notes,
    } satisfies InventoryItem;
    const unchanged = existing.catalogId === result.catalogId
      && existing.brand === result.brand
      && existing.line === result.line
      && existing.vitola === result.vitola
      && existing.originalQty === result.originalQty
      && existing.currentQty === result.currentQty
      && existing.looseStickQty === result.looseStickQty
      && existing.provenanceNotes === result.provenanceNotes
      && existing.retailValue === result.retailValue
      && existing.status === result.status
      && existing.notes === result.notes;
    return unchanged ? [] : [result];
  });
}

export function unmaterializedCollectionRequirements(template: CollectionTemplate) {
  const documented = new Set((template.componentEvidence??[]).filter(completeCollectionComponentEvidence).map(component=>component.requirement));
  return template.requirements.filter(requirement => evidenceOnly.test(requirement) || vague.test(requirement) || !documented.has(requirement));
}

/**
 * Splits a legacy generated row that collapsed multiple identical physical
 * lots into one quantity. The total original/current/smoked quantities are
 * preserved exactly and the operation is idempotent.
 */
export function collectionPhysicalLotRepairs(
  collection:CigarCollection,
  template:CollectionTemplate,
  inventory:InventoryItem[],
) {
  const byId=new Map(inventory.map(item=>[item.inventoryId,item]));
  const evidenceByRequirement=new Map((template.componentEvidence??[]).filter(completeCollectionComponentEvidence).map(component=>[component.requirement,component]));
  const groups=new Map<string,Array<{requirement:string;index:number;quantity:number}>>();
  template.requirements.forEach((requirement,index)=>{
    const evidence=evidenceByRequirement.get(requirement);
    if(!evidence)return;
    const key=cigarIdentityKey(evidence);
    const group=groups.get(key)??[];
    group.push({requirement,index,quantity:requirementQuantity(requirement)});
    groups.set(key,group);
  });
  return [...groups.values()].flatMap(group=>{
    if(group.length<2)return[];
    const targets=group.map(entry=>({...entry,inventoryId:componentInventoryId(collection.collectionId,entry.index)}));
    const existing=targets.map(target=>byId.get(target.inventoryId)).filter((item):item is InventoryItem=>Boolean(item));
    if(existing.length!==1)return[];
    const source=existing[0];
    const legacyGenerated=source.collectionId===collection.collectionId&&source.notes?.includes("Expected component:");
    if(!legacyGenerated)return[];
    const expectedOriginal=targets.reduce((sum,target)=>sum+target.quantity,0);
    const sourceOriginal=source.originalQty??((source.currentQty??0)+(source.smokedQty??0));
    if(sourceOriginal!==expectedOriginal)return[];
    const sourceCurrent=source.currentQty??Math.max(0,sourceOriginal-(source.smokedQty??0));
    if(sourceCurrent<0||sourceCurrent>sourceOriginal)return[];
    let remainingSmoked=sourceOriginal-sourceCurrent;
    return targets.map(target=>{
      const identity=collectionComponentIdentity(target.requirement,template);
      const smokedQty=Math.min(target.quantity,remainingSmoked);
      remainingSmoked-=smokedQty;
      const currentQty=target.quantity-smokedQty;
      const evidence=evidenceByRequirement.get(target.requirement)!;
      return {
        ...source,
        inventoryId:target.inventoryId,
        catalogId:canonicalCigarIdentity(identity).identityId,
        collectionId:collection.collectionId,
        brand:identity.brand,
        line:identity.line,
        vitola:identity.vitola,
        originalQty:target.quantity,
        currentQty,
        smokedQty,
        fullBoxQty:undefined,
        sticksPerBox:undefined,
        looseStickQty:currentQty,
        provenanceNotes:`Collection component documented by ${evidence.sourceLabel||template.sourceLabel}: ${evidence.sourceUrl||template.sourceUrl}`,
        notes:`Expected component: ${target.requirement}`,
      } satisfies InventoryItem;
    });
  });
}
