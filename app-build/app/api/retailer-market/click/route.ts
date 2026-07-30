import { createHash, randomUUID } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { loadInventory } from "@/lib/inventory";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { retailerKey, RetailerListingSchema } from "@/lib/retailer-trust";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Purchase verification is temporarily unavailable");return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign in before opening a retailer" }, { status: 401 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before opening a retailer" }, { status: 401 });
  try {
    const body=await request.json() as {inventoryId?:string;listing?:unknown};
    const listing=RetailerListingSchema.parse(body.listing);
    const item=(await loadInventory()).find(record=>record.inventoryId===body.inventoryId);
    if(!item)return NextResponse.json({error:"Inventory record not found"},{status:404});
    const id=randomUUID(),fingerprint=createHash("sha256").update(`${body.inventoryId}|${listing.seller}|${listing.url}`).digest("hex");
    const{error}=await admin().from("retailer_purchase_sessions").insert({id,user_id:user.id,inventory_id:item.inventoryId,retailer_key:retailerKey(listing.seller),retailer_name:listing.seller,listing_url:listing.url,listing_fingerprint:fingerprint,status:"clicked"});
    if(error?.code==="23505"){
      const{data:existing,error:existingError}=await admin().from("retailer_purchase_sessions").select("id").eq("user_id",user.id).eq("listing_fingerprint",fingerprint).eq("status","clicked").maybeSingle();
      if(existingError)throw existingError;
      if(existing)return NextResponse.json({data:{purchaseSessionId:existing.id,outboundUrl:listing.url,trackingStatus:"active"},message:"Existing purchase session reused safely."});
    }
    if(error){
      if(["42P01","PGRST205"].includes(error.code||""))return NextResponse.json({data:{outboundUrl:listing.url,trackingStatus:"unavailable"},message:"Seller opened without transaction tracking. Verified ratings remain disabled until secure purchase verification is active."});
      throw error;
    }
    return NextResponse.json({data:{purchaseSessionId:id,outboundUrl:listing.url,trackingStatus:"active"}},{status:201});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Could not open this retailer safely"},{status:422});
  }
}
