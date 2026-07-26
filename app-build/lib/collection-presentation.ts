import { collectionRequirementMatches, collectionTemplateFor } from "./collection-dashboard";
import type { CigarCollection, InventoryItem } from "./types";

const normalized = (value:string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g," ")
  .trim();

export type InventoryCollectionRelationship = {
  kind:"component"|"presentation"|"review";
  collection?:CigarCollection;
  staleCollectionId?:string;
};

export function isPresentationInventoryMatch(item:InventoryItem,collection:CigarCollection){
  if(collection.presentationInventoryId===item.inventoryId)return true;
  const template=collectionTemplateFor(collection);
  if(!template?.presentationAliases?.length)return false;
  const line=normalized(item.line);
  return template.presentationAliases.some(alias=>normalized(alias)===line);
}

/**
 * Resolves displayable collection relationships from verified component
 * membership or an exact presentation-asset alias. A saved collectionId alone
 * is never enough to create a link.
 */
export function inventoryCollectionRelationships(
  inventory:InventoryItem[],
  collections:CigarCollection[],
){
  const verifiedComponents=new Map<string,CigarCollection>();
  for(const collection of collections){
    const linked=inventory.filter(item=>item.collectionId===collection.collectionId);
    for(const match of collectionRequirementMatches(collection,linked)){
      if(match.inventoryId)verifiedComponents.set(match.inventoryId,collection);
    }
  }
  const relationships=new Map<string,InventoryCollectionRelationship>();
  for(const item of inventory){
    const presentation=collections.find(collection=>isPresentationInventoryMatch(item,collection));
    if(presentation){
      relationships.set(item.inventoryId,{
        kind:"presentation",
        collection:presentation,
        staleCollectionId:item.collectionId&&item.collectionId!==presentation.collectionId?item.collectionId:undefined,
      });
      continue;
    }
    const component=verifiedComponents.get(item.inventoryId);
    if(component){
      relationships.set(item.inventoryId,{kind:"component",collection:component});
      continue;
    }
    if(item.collectionId)relationships.set(item.inventoryId,{kind:"review",staleCollectionId:item.collectionId});
  }
  return relationships;
}
