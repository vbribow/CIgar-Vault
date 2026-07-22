import { NextResponse } from "next/server";
import { z } from "zod";
import { loadRatingDrafts, loadWishlist } from "@/lib/data";
import { saveOwnedRecord } from "@/lib/user-data";

const Input = z.object({ recordKind:z.enum(["wishlist","rating-drafts"]), recordId:z.string().min(1).max(120), notificationId:z.string().min(1).max(800), acknowledged:z.boolean() }).strict();

export async function POST(request: Request) {
  try {
    const input = Input.parse(await request.json());
    if(input.recordKind==="rating-drafts"){const draft=(await loadRatingDrafts()).find(value=>value.inventoryId===input.recordId);if(!draft)return NextResponse.json({error:"Rating draft not found"},{status:404});const ids=new Set(draft.acknowledgedNotificationIds||[]);input.acknowledged?ids.add(input.notificationId):ids.delete(input.notificationId);const updated={...draft,acknowledgedNotificationIds:[...ids].slice(-250)};if(!await saveOwnedRecord("rating-drafts",draft.inventoryId,updated))return NextResponse.json({error:"Sign in to manage notifications"},{status:401});return NextResponse.json({data:updated})}
    const item = (await loadWishlist()).find(value => value.wishlistId === input.recordId);
    if (!item) return NextResponse.json({ error:"Wishlist item not found" }, { status:404 });
    const current = new Set(item.acknowledgedNotificationIds || []);
    if (input.acknowledged) current.add(input.notificationId); else current.delete(input.notificationId);
    const updated = { ...item, acknowledgedNotificationIds:[...current].slice(-250) };
    if (!await saveOwnedRecord("wishlist", item.wishlistId, updated)) return NextResponse.json({ error:"Sign in to manage notifications" }, { status:401 });
    return NextResponse.json({ data:{ wishlistId:item.wishlistId, acknowledgedNotificationIds:updated.acknowledgedNotificationIds } });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "Notification update failed" }, { status:422 });
  }
}
