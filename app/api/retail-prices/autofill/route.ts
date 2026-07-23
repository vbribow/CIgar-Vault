import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { loadValuations } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import { knownRetailPriceSuggestions } from "@/lib/retail-pricing";
import { recordValuation } from "@/lib/smartsheet";
import type { Valuation } from "@/lib/types";
import { accountDataMode, saveOwnedRecord } from "@/lib/user-data";

export async function POST(request: Request) {
  try {
    const [inventory, valuations] = await Promise.all([loadInventory(), loadValuations()]);
    const suggestions = knownRetailPriceSuggestions(inventory, valuations);
    if (!suggestions.length) return NextResponse.json({ data: { updated: 0, items: [] } });
    const mode = await accountDataMode();
    if (mode === "supabase") {
      for (const suggestion of suggestions) {
        const valuation: Valuation = {
          ...suggestion.valuation,
          valuationId: `VAL-REUSED-${suggestion.item.inventoryId}-${suggestion.valuation.valuationDate}`.slice(0, 100),
          inventoryId: suggestion.item.inventoryId,
          source: suggestion.valuation.source || "Shared retail evidence",
          notes: `Exact cigar identity match. ${suggestion.valuation.notes || ""}`.trim(),
        };
        await Promise.all([
          saveOwnedRecord("inventory", suggestion.item.inventoryId, { ...suggestion.item, retailValue: suggestion.unitPrice }),
          saveOwnedRecord("valuations", valuation.valuationId, valuation),
        ]);
      }
    } else {
      if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (dataMode() === "mock") return NextResponse.json({ error: "Writes are disabled in preview mode" }, { status: 409 });
      for (const suggestion of suggestions) {
        await recordValuation({
          ...suggestion.valuation,
          valuationId: `VAL-REUSED-${suggestion.item.inventoryId}-${suggestion.valuation.valuationDate}`.slice(0, 100),
          inventoryId: suggestion.item.inventoryId,
          notes: `Exact cigar identity match. ${suggestion.valuation.notes || ""}`.trim(),
        });
      }
    }

    return NextResponse.json({
      data: {
        updated: suggestions.length,
        items: suggestions.map(suggestion => ({
          inventoryId: suggestion.item.inventoryId,
          unitPrice: suggestion.unitPrice,
          boxPrice: suggestion.boxPrice,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retail price autofill failed" }, { status: 422 });
  }
}
