import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { ValuationCreateSchema } from "@/lib/records-model";
import { getValuations, recordValuation } from "@/lib/smartsheet";
import { loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { applyRetailValuationToInventory } from "@/lib/retail-pricing";
import { isPrivateInventoryPreviewRequest, savePreviewInventoryOverride } from "@/lib/preview-inventory";
import { loadPreviewValuations, savePreviewValuation } from "@/lib/preview-valuations";
import { accountDataMode, createOwnedRecord, loadOwnedRecord, saveOwnedRecordsAtomically } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
import type { Valuation } from "@/lib/types";
export async function GET() {
  if (dataMode() === "mock") return NextResponse.json({ data: await loadPreviewValuations() });
  try {
    return NextResponse.json({ data: await loadValuations() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const input = ValuationCreateSchema.parse(await request.json());
    const { submissionId, ...fields } = input;
    const item: Valuation = { valuationId: createServerRecordId("valuation", submissionId), ...fields };
    if (await accountDataMode() === "supabase") {
      const created=await createOwnedRecord("valuations",item.valuationId,item);
      if(created==="exists"){
        const existing=await loadOwnedRecord<Valuation>("valuations",item.valuationId);
        if(existing&&JSON.stringify(existing)===JSON.stringify(item))return NextResponse.json({data:existing,retry:true},{status:200});
        throw new Error("This submission was already used for different valuation evidence");
      }
      if(created!=="created")throw new Error("Sign in before saving private valuation evidence");
      const records:Parameters<typeof saveOwnedRecordsAtomically>[0]=[
      ];
      if(item.replacementValue!==undefined||item.replacementSticksPerBox!==undefined){
        const inventory=(await loadInventory()).find(record=>record.inventoryId===item.inventoryId);
        if(!inventory)throw new Error(`Inventory ID ${item.inventoryId} was not found`);
        records.push({kind:"inventory",recordId:inventory.inventoryId,payload:applyRetailValuationToInventory(inventory,item)});
      }
      if(records.length&&!await saveOwnedRecordsAtomically(records))throw new Error("Could not synchronize valuation evidence");
      return NextResponse.json({ data: item }, { status: 201 });
    }
    if (dataMode() === "mock") {
      if (!isPrivateInventoryPreviewRequest(request))
        return NextResponse.json(
          { error: "Local preview edits are allowed only from this private development host." },
          { status: 403 },
        );
      const retry = await savePreviewValuation(item);
      if (item.replacementValue !== undefined || item.replacementSticksPerBox !== undefined) {
        const inventory=(await loadInventory()).find(record=>record.inventoryId===item.inventoryId);
        if(!inventory)throw new Error(`Inventory ID ${item.inventoryId} was not found`);
        await savePreviewInventoryOverride(applyRetailValuationToInventory(inventory,item));
      }
      return NextResponse.json({ data: item, retry, storage: "local-preview" }, { status: retry ? 200 : 201 });
    }
    if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const existing=(await getValuations()).find(value=>value.valuationId===item.valuationId);
    if(existing)return JSON.stringify(existing)===JSON.stringify(item)?NextResponse.json({data:existing,retry:true}):NextResponse.json({error:"This submission was already used for different valuation evidence"},{status:409});
    await recordValuation(item);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 422 },
    );
  }
}
