import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { collectionComponentDrafts, collectionComponentRepairs, unmaterializedCollectionRequirements } from "@/lib/collection-components";
import { collectionMatchMinimum, collectionTemplateFor } from "@/lib/collection-dashboard";
import { loadCollections } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { normalizeInventory } from "@/lib/inventory-model";
import { addInventoryRows } from "@/lib/smartsheet";
import { updateInventoryRow } from "@/lib/smartsheet";
import { saveOwnedRecord } from "@/lib/user-data";
import { matchCollectionRequirements } from "@/lib/collection-matching";

export async function POST(request: Request, { params }: { params: Promise<{ collectionId: string }> }) {
  try {
    const { collectionId } = await params;
    const [collection, inventory] = await Promise.all([loadCollections().then(items => items.find(item => item.collectionId === collectionId)), loadInventory()]);
    if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    const template = collectionTemplateFor(collection);
    if (!template) return NextResponse.json({ error: "This collection needs a researched contents template before inventory can be populated." }, { status: 409 });
    const eligibleInventory = inventory.filter(item => !item.collectionId || item.collectionId === collection.collectionId);
    const used = new Set<string>(), reusable = matchCollectionRequirements(template.requirements, eligibleInventory,collectionMatchMinimum(template)).flatMap(match => {
      const item = match.inventoryId ? inventory.find(candidate => candidate.inventoryId === match.inventoryId) : undefined;
      if (!item || used.has(item.inventoryId) || (item.collectionId && item.collectionId !== collection.collectionId)) return [];
      used.add(item.inventoryId); return [{ requirement: match.requirement, item: { ...item, collectionId: collection.collectionId } }];
    });
    const fulfilled = new Set(reusable.map(match => match.requirement));
    const drafts = collectionComponentDrafts(collection, template, inventory, fulfilled).map(item => normalizeInventory(item));
    const repairs = collectionComponentRepairs(collection, template, inventory).map(item => normalizeInventory(item));
    if (!drafts.length && !reusable.length && !repairs.length) return NextResponse.json({ data: { created: 0, linked: 0, repaired: 0, unresolved: unmaterializedCollectionRequirements(template), message: "No new component lots were needed." } });
    const accountSave = await Promise.all(drafts.map(item => saveOwnedRecord("inventory", item.inventoryId, item)));
    const accountLinks = await Promise.all(reusable.map(({ item }) => saveOwnedRecord("inventory", item.inventoryId, item)));
    const accountRepairs = await Promise.all(repairs.map(item => saveOwnedRecord("inventory", item.inventoryId, item)));
    if (![...accountSave, ...accountLinks, ...accountRepairs].every(Boolean)) {
      if (!authorizeWrite(request)) return NextResponse.json({ error: "Sign in before populating collection inventory" }, { status: 401 });
      if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in preview mode" }, { status: 409 });
      await addInventoryRows(drafts);
      await Promise.all([...reusable.map(({ item }) => item), ...repairs].map(item => updateInventoryRow(item.inventoryId, item)));
    }
    return NextResponse.json({ data: { created: drafts.length, linked: reusable.length, repaired: repairs.length, unresolved: unmaterializedCollectionRequirements(template), items: drafts } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Collection population failed" }, { status: 422 }); }
}
