import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeWrite, dataMode } from "@/lib/config";
import {
  normalizeInventory,
  parseInventoryUpdate,
  reconcileSmokedQuantityEdit,
} from "@/lib/inventory-model";
import { loadInventory } from "@/lib/inventory";
import { loadHumidors } from "@/lib/data";
import {
  isPrivateInventoryPreviewRequest,
  savePreviewInventoryOverride,
} from "@/lib/preview-inventory";
import { recordRevision } from "@/lib/record-revision";
import { deleteInventoryRow, getCatalog, updateInventoryRow } from "@/lib/smartsheet";
import { deleteOwnedRecord, saveOwnedRecordIfUnchanged } from "@/lib/user-data";
import { canonicalizeInventoryNaming } from "@/lib/canonical-cigar-naming";

type Context = { params: Promise<{ inventoryId: string }> };
function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: `Invalid inventory data: ${error.issues.map(issue => `${issue.path.join(".") || "record"} — ${issue.message}`).join("; ")}`, issues: error.issues },
      { status: 422 },
    );
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    { error: message },
    { status: message.includes("not found") ? 404 : 502 },
  );
}
function guard(request: Request) {
  if (dataMode() === "mock")
    return NextResponse.json(
      { error: "Writes are disabled in mock mode" },
      { status: 409 },
    );
  if (!authorizeWrite(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(request: Request, context: Context) {
  try {
    const { inventoryId } = await context.params;
    const existing = (await loadInventory()).find(candidate => candidate.inventoryId === inventoryId);
    if (!existing) return NextResponse.json({ error: `${inventoryId} was not found. Refresh your Vault before trying again.` }, { status: 404 });
    const expectedRevision = request.headers.get("if-match");
    if (!expectedRevision)
      return NextResponse.json(
        { error: "Refresh your Vault before saving so Hojavía can protect changes made on another device." },
        { status: 428 },
      );
    if (expectedRevision && expectedRevision !== recordRevision(existing))
      return NextResponse.json(
        { error: "This record changed since you opened it—possibly after a photo update or on another device. Refresh your Vault, review the newer information, and try again." },
        { status: 409 },
      );
    const body=await request.json();
    if(typeof body==="object"&&body!==null&&"addedAt" in body){
      if(body.addedAt!==existing.addedAt)return NextResponse.json({error:"The Vault entry date is maintained automatically and cannot be changed."},{status:409});
      delete body.addedAt;
    }
    const parsedInput=parseInventoryUpdate(body, existing);
    const parsed = normalizeInventory(reconcileSmokedQuantityEdit(parsedInput,existing));
    const item = canonicalizeInventoryNaming(parsed, await getCatalog().catch(() => []));
    if (item.inventoryId !== inventoryId)
      return NextResponse.json(
        { error: "Inventory ID cannot be changed" },
        { status: 409 },
      );
    if (item.storageLocationId && item.storageLocationId !== existing.storageLocationId) {
      const humidors = await loadHumidors();
      if (!humidors.some(humidor => humidor.humidorId === item.storageLocationId))
        return NextResponse.json(
          { error: "Choose one of your registered humidors or storage locations before saving." },
          { status: 422 },
        );
    }
    const result = await saveOwnedRecordIfUnchanged("inventory", inventoryId, item, expectedRevision, normalizeInventory);
    if (result === "saved") {
      const savedItem = { ...item, addedAt: existing.addedAt };
      return NextResponse.json({ data: savedItem, revision: recordRevision(savedItem) });
    }
    if (result === "conflict")
      return NextResponse.json(
        { error: "This record changed while you were saving. Refresh your Vault, review the newer information, and try again." },
        { status: 409 },
      );
    if (dataMode() === "mock") {
      if (!isPrivateInventoryPreviewRequest(request))
        return NextResponse.json(
          { error: "Local preview edits are allowed only from this private development host." },
          { status: 403 },
        );
      await savePreviewInventoryOverride(item);
      return NextResponse.json({ data: item, revision: recordRevision(item), storage: "local-preview" });
    }
    const blocked = guard(request); if (blocked) return blocked;
    await updateInventoryRow(inventoryId, item);
    return NextResponse.json({ data: item, revision: recordRevision(item) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { inventoryId } = await context.params;
    const existing = (await loadInventory()).find(candidate => candidate.inventoryId === inventoryId);
    if (!existing) return NextResponse.json({ error: `${inventoryId} was not found. Refresh your Vault before trying again.` }, { status: 404 });
    const expectedRevision=request.headers.get("if-match");
    if(!expectedRevision)return NextResponse.json({error:"Refresh this record before deleting it so Hojavía can protect newer changes."},{status:428});
    if(expectedRevision!==recordRevision(existing))return NextResponse.json({error:"This record changed on another device. Refresh and review it before deleting."},{status:409});
    if (await deleteOwnedRecord("inventory", inventoryId)) return new NextResponse(null, { status: 204 });
    const blocked = guard(request); if (blocked) return blocked;
    await deleteInventoryRow(inventoryId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
