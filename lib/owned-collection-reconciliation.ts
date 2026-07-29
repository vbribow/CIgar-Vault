import {
  collectionComponentDrafts,
  collectionComponentIdentity,
} from "./collection-components";
import { collectionTemplates, type CollectionTemplate } from "./collection-templates";
import type { CigarCollection, InventoryItem } from "./types";

const ownedTemplateIds = [
  "TPL-FUENTE-GRAN-FUMADA-2023",
  "TPL-FUENTE-DREAM-DYNASTY",
  "TPL-FUENTE-PADRON-LEGENDS",
] as const;

function templateById(templateId:(typeof ownedTemplateIds)[number]){
  const template=collectionTemplates.find(item=>item.templateId===templateId);
  if(!template)throw new Error(`Missing researched collection template ${templateId}`);
  return template;
}

function collectionFromTemplate(
  template:CollectionTemplate,
  presentationInventoryId?:string,
):CigarCollection{
  return{
    collectionId:template.templateId.replace("TPL-","COL-"),
    name:template.name,
    maker:template.maker,
    releaseYear:template.releaseYear,
    edition:template.edition,
    expectedComponents:template.expectedComponents,
    expectedCigars:template.expectedCigars,
    presentationInventoryId,
    wholeMarketValue:template.documentedWholeValue,
    valuationDate:template.valueAsOf,
    valuationSource:template.sourceLabel,
    valuationSourceUrl:template.sourceUrl,
    status:"Complete",
    notes:`Reconciled from the collector’s legacy aggregate records. Component cigars are counted as exact physical lots; presentation packaging is tracked separately and never added to cigar quantity or component value.`,
  };
}

function requiredItem(inventory:InventoryItem[],inventoryId:string){
  const item=inventory.find(candidate=>candidate.inventoryId===inventoryId);
  if(!item)throw new Error(`Missing owned legacy record ${inventoryId}`);
  return item;
}

function presentationItem(
  item:InventoryItem,
  collection:CigarCollection,
  label:string,
):InventoryItem{
  return{
    ...item,
    collectionId:undefined,
    vitola:`Presentation case — ${label}`,
    originalQty:1,
    currentQty:1,
    fullBoxQty:undefined,
    sticksPerBox:undefined,
    looseStickQty:undefined,
    smokedQty:0,
    status:"Preserve",
    provenanceNotes:[
      item.provenanceNotes,
      `Presentation asset for ${collection.name}; its included cigars are tracked as separate exact component lots.`,
    ].filter(Boolean).join(" "),
  };
}

export type OwnedCollectionReconciliation={
  collections:CigarCollection[];
  inventory:InventoryItem[];
};

/**
 * Converts the collector's known legacy aggregate collection rows into exact
 * components plus separately tracked packaging. The plan is deterministic and
 * idempotent; it never consumes unrelated standalone cigar records.
 */
export function buildOwnedCollectionReconciliation(
  inventory:InventoryItem[],
):OwnedCollectionReconciliation{
  const granTemplate=templateById("TPL-FUENTE-GRAN-FUMADA-2023");
  const dreamTemplate=templateById("TPL-FUENTE-DREAM-DYNASTY");
  const legendsTemplate=templateById("TPL-FUENTE-PADRON-LEGENDS");
  const gran=collectionFromTemplate(granTemplate,"INV-0004");
  const dream=collectionFromTemplate(dreamTemplate,"INV-0037");
  const legends=collectionFromTemplate(legendsTemplate);

  const presentationOverrides=[
    presentationItem(requiredItem(inventory,"INV-0004"),gran,"Volume II"),
    presentationItem(requiredItem(inventory,"INV-0037"),dream,"Volume I · The Foundation"),
    presentationItem(requiredItem(inventory,"INV-0038"),dream,"Volume II · The Dynasty"),
  ];

  const legendsRequirements=[
    {inventoryId:"INV-0040",requirement:legendsTemplate.requirements[0]},
    {inventoryId:"INV-0039",requirement:legendsTemplate.requirements[1]},
  ];
  const legendsOverrides=legendsRequirements.map(({inventoryId,requirement})=>{
    const existing=requiredItem(inventory,inventoryId);
    const identity=collectionComponentIdentity(requirement,legendsTemplate);
    return{
      ...existing,
      collectionId:legends.collectionId,
      brand:identity.brand,
      line:identity.line,
      vitola:identity.vitola,
      originalQty:identity.quantity,
      currentQty:existing.currentQty??identity.quantity,
      looseStickQty:existing.currentQty??identity.quantity,
      smokedQty:existing.smokedQty??0,
      status:"Preserve",
      provenanceNotes:`Collection component documented by ${legendsTemplate.sourceLabel}: ${legendsTemplate.sourceUrl}`,
      notes:`Expected component: ${requirement}`,
    } satisfies InventoryItem;
  });

  const existingIds=new Set(inventory.map(item=>item.inventoryId));
  const generated=[
    ...collectionComponentDrafts(gran,granTemplate,inventory),
    ...collectionComponentDrafts(dream,dreamTemplate,inventory),
  ].filter(item=>!existingIds.has(item.inventoryId));

  return{
    collections:[gran,dream,legends],
    inventory:[...presentationOverrides,...legendsOverrides,...generated],
  };
}
