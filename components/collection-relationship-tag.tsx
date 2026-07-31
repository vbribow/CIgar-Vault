import type { InventoryCollectionRelationship } from "@/lib/collection-presentation";

export function CollectionRelationshipTag({relationship}:{relationship?:InventoryCollectionRelationship}){
  if(!relationship?.collection||relationship.kind==="review")return null;
  const label=relationship.kind==="presentation"
    ? `View ${relationship.collection.name} contents`
    : `Part of ${relationship.collection.name}`;
  return <a className="inventoryCollectionTag" href={`/collections/${encodeURIComponent(relationship.collection.collectionId)}`}>{label} →</a>;
}
