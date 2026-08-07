import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { collectionComponentDrafts, collectionComponentRepairs, collectionPhysicalLotRepairs, collectionPopulationCandidates, unmaterializedCollectionRequirements } from "@/lib/collection-components";
import { collectionEditionIssue, collectionRequirementMatches, collectionTemplateFor } from "@/lib/collection-dashboard";
import { loadCollections } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { normalizeInventory } from "@/lib/inventory-model";
import { addInventoryRows } from "@/lib/smartsheet";
import { updateInventoryRow } from "@/lib/smartsheet";
import { saveOwnedRecordsAtomically } from "@/lib/user-data";
import { auditCollectionTemplateProtocol } from "@/lib/collection-templates";
import { isPrivateInventoryPreviewRequest, savePreviewInventoryOverrides } from "@/lib/preview-inventory";

export async function POST(request: Request, { params }: { params: Promise<{ collectionId: string }> }) {
  try {
    const { collectionId } = await params;
    const [collection, inventory] = await Promise.all([loadCollections().then(items => items.find(item => item.collectionId === collectionId)), loadInventory()]);
    if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    const template = collectionTemplateFor(collection);
    if (!template) return NextResponse.json({ error: "This collection needs a researched contents template before inventory can be populated." }, { status: 409 });
    const protocol = auditCollectionTemplateProtocol(template);
    if (!protocol.readyForInventoryAutomation) {
      return NextResponse.json({
        error: `Collection inventory remains frozen until every physical lot has attributable exact-vitola evidence. ${protocol.issues.join(" ")}`,
      }, { status: 409 });
    }
    const editionIssue=collectionEditionIssue(collection);
    if(editionIssue)return NextResponse.json({error:`Collection edition must be corrected before population. ${editionIssue}`},{status:409});
    // A matching standalone lot is not proof that the collector acquired it
    // as part of this collection. Only already documented component lots may
    // fulfill requirements automatically.
    const physicalLotRepairs=collectionPhysicalLotRepairs(collection,template,inventory).map(item=>normalizeInventory(item));
    const physicalRepairById=new Map(physicalLotRepairs.map(item=>[item.inventoryId,item]));
    const reconciledInventory=[
      ...inventory.map(item=>physicalRepairById.get(item.inventoryId)??item),
      ...physicalLotRepairs.filter(item=>!inventory.some(existing=>existing.inventoryId===item.inventoryId)),
    ];
    const eligibleInventory = collectionPopulationCandidates(
      collection.collectionId,
      reconciledInventory,
    );
    const used = new Set<string>(), reusable = collectionRequirementMatches(collection, eligibleInventory).flatMap(match => {
      const item = match.inventoryId ? reconciledInventory.find(candidate => candidate.inventoryId === match.inventoryId) : undefined;
      if (!item || used.has(item.inventoryId) || (item.collectionId && item.collectionId !== collection.collectionId)) return [];
      used.add(item.inventoryId); return [{ requirement: match.requirement, item: { ...item, collectionId: collection.collectionId } }];
    });
    const fulfilled = new Set(reusable.map(match => match.requirement));
    const drafts = collectionComponentDrafts(collection, template, reconciledInventory, fulfilled).map(item => normalizeInventory(item));
    const repairs = collectionComponentRepairs(collection, template, reconciledInventory).map(item => normalizeInventory(item));
    if (!drafts.length && !reusable.length && !repairs.length&&!physicalLotRepairs.length) return NextResponse.json({ data: { created: 0, linked: 0, repaired: 0, unresolved: unmaterializedCollectionRequirements(template), message: "No new component lots were needed." } });
    const accountChanges = [
      ...new Map(
        [
          ...drafts,
          ...reusable.map(({ item }) => item),
          ...physicalLotRepairs,
          ...repairs,
        ].map((item) => [item.inventoryId, item]),
      ).values(),
    ];
    const accountSaved = await saveOwnedRecordsAtomically(
      accountChanges.map((item) => ({
        kind: "inventory",
        recordId: item.inventoryId,
        payload: item,
      })),
    );
    if (!accountSaved) {
      if(dataMode()==="mock"){
        if(!isPrivateInventoryPreviewRequest(request))return NextResponse.json({error:"Local preview reconciliation is allowed only from this private development host."},{status:403});
        await savePreviewInventoryOverrides(accountChanges);
      }else{
        if (!authorizeWrite(request)) return NextResponse.json({ error: "Sign in before populating collection inventory" }, { status: 401 });
        const physicalLotUpdates=physicalLotRepairs.filter(item=>inventory.some(existing=>existing.inventoryId===item.inventoryId));
        const physicalLotCreates=physicalLotRepairs.filter(item=>!inventory.some(existing=>existing.inventoryId===item.inventoryId));
        await addInventoryRows([...drafts,...physicalLotCreates]);
        await Promise.all([...reusable.map(({ item }) => item), ...physicalLotUpdates, ...repairs].map(item => updateInventoryRow(item.inventoryId, item)));
      }
    }
    return NextResponse.json({ data: { created: drafts.length+physicalLotRepairs.filter(item=>!inventory.some(existing=>existing.inventoryId===item.inventoryId)).length, linked: reusable.length, repaired: repairs.length+physicalLotRepairs.filter(item=>inventory.some(existing=>existing.inventoryId===item.inventoryId)).length, unresolved: unmaterializedCollectionRequirements(template), items: drafts } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Collection population failed" }, { status: 422 }); }
}
