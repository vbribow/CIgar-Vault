import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { loadInventory } from "@/lib/inventory";
import { researchInventoryAvailability } from "@/lib/retailer-availability";
import { rankRetailerListings, retailerKey, trustedRetailerScore, type RetailerReviewEvidence } from "@/lib/retailer-trust";
export const maxDuration = 120;
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();return url&&key?createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):undefined}
export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign in before searching retailers" }, { status: 401 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before searching retailers" }, { status: 401 });
  try {
    const { inventoryId } = await request.json() as { inventoryId?: string };
    const item = (await loadInventory()).find(record => record.inventoryId === inventoryId);
    if (!item) return NextResponse.json({ error: "Inventory record not found" }, { status: 404 });
    const data = await researchInventoryAvailability(item);
    const keys=[...new Set(data.listings.map(listing=>retailerKey(listing.seller)))];
    const db=admin();let ratings:Record<string,ReturnType<typeof trustedRetailerScore>>={};
    if(db&&keys.length){const{data:rows,error}=await db.from("retailer_reviews").select("user_id,retailer_key,overall,fulfillment,packaging,authenticity_confidence,status,created_at").in("retailer_key",keys).eq("status","verified");if(!error){ratings=Object.fromEntries(keys.map(key=>[key,trustedRetailerScore((rows||[]).filter(row=>row.retailer_key===key).map(row=>({purchaseSessionId:"00000000-0000-0000-0000-000000000000",overall:row.overall,fulfillment:row.fulfillment,packaging:row.packaging,authenticityConfidence:row.authenticity_confidence,review:undefined,status:"verified",userId:row.user_id,retailerKey:row.retailer_key,verifiedAt:row.created_at} satisfies RetailerReviewEvidence))) ]))}}
    return NextResponse.json({ data:{...data,listings:rankRetailerListings(data.listings,ratings),ratings} });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retailer search failed" }, { status: 502 });
  }
}
