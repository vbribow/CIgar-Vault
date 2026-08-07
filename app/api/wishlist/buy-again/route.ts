import { NextResponse } from "next/server";
import { BuyAgainIntentSchema, safeRecordedPurchaseUrl, sameBuyAgainTarget } from "@/lib/buy-again";
import { loadInventory } from "@/lib/inventory";
import { loadWishlist } from "@/lib/data";
import { createOwnedRecord, loadOwnedRecord, saveOwnedRecord } from "@/lib/user-data";
import { createServerRecordId } from "@/lib/server-record-id";
import type { WishlistItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = BuyAgainIntentSchema.parse(await request.json());
    const [inventory, wishlist] = await Promise.all([loadInventory(), loadWishlist()]);
    const item = inventory.find((candidate) => candidate.inventoryId === input.inventoryId);
    if (!item) return NextResponse.json({ error: "This cigar record is no longer available. Refresh before trying again." }, { status: 404 });
    const existing = wishlist.find((target) => target.status !== "Added to vault" && sameBuyAgainTarget(item, target));
    if (existing) {
      if (existing.status === "Passed") {
        const reopened = { ...existing, status: "Watching" as const };
        if (!await saveOwnedRecord("wishlist", existing.wishlistId, reopened)) return NextResponse.json({ error: "Sign in before updating your buying list." }, { status: 401 });
        return NextResponse.json({ data: reopened, existing: true, reopened: true });
      }
      return NextResponse.json({ data: existing, existing: true });
    }
    const wishlistId = createServerRecordId("wishlist", input.submissionId);
    const context = [item.acquisitionSeller && `Last seller: ${item.acquisitionSeller}`, item.acquisitionDate && `Last purchased: ${item.acquisitionDate}`].filter(Boolean).join(" · ");
    const target: WishlistItem = {
      wishlistId,
      brand: item.brand,
      line: item.line,
      vitola: item.vitola,
      priority: "High",
      sourceUrl: safeRecordedPurchaseUrl(item.acquisitionSourceUrl),
      status: "Watching",
      notes: `Buy Again from a private cigar record.${context ? ` ${context}.` : ""}`,
      createdAt: new Date().toISOString(),
    };
    const created = await createOwnedRecord("wishlist", wishlistId, target);
    if (created === "exists") {
      const retry = await loadOwnedRecord<WishlistItem>("wishlist", wishlistId);
      if (retry && sameBuyAgainTarget(item, retry)) return NextResponse.json({ data: retry, retry: true });
      return NextResponse.json({ error: "This request was already used for another buying-list item." }, { status: 409 });
    }
    if (created !== "created") return NextResponse.json({ error: "Sign in before adding this cigar to your buying list." }, { status: 401 });
    return NextResponse.json({ data: target }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the buying list." }, { status: 422 });
  }
}
