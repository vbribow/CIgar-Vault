import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { privateOrderReference, PurchaseEvidenceSchema } from "@/lib/retailer-trust";
function credentials(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Purchase verification is temporarily unavailable");return{url,key}}
function admin(){const{url,key}=credentials();return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function GET(request:Request){
  if(!supabaseConfigured())return NextResponse.json({data:[]});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({data:[]});
  try{const inventoryId=new URL(request.url).searchParams.get("inventoryId");if(!inventoryId)return NextResponse.json({data:[]});const db=admin();const{data,error}=await db.from("retailer_purchase_sessions").select("id,retailer_key,retailer_name,status,purchase_date,receipt_verified_at").eq("user_id",user.id).eq("inventory_id",inventoryId).order("created_at",{ascending:false}).limit(30);if(error)throw error;const ids=(data||[]).map(row=>row.id);const reviews=ids.length?await db.from("retailer_reviews").select("purchase_session_id").in("purchase_session_id",ids):{data:[],error:null};if(reviews.error)throw reviews.error;const reviewed=new Set((reviews.data||[]).map(row=>row.purchase_session_id));return NextResponse.json({data:(data||[]).map(row=>({...row,reviewed:reviewed.has(row.id)}))})}catch{return NextResponse.json({data:[]})}
}
export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Sign in before verifying a purchase"},{status:401});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in before verifying a purchase"},{status:401});
  try{
    const input=PurchaseEvidenceSchema.parse(await request.json()),db=admin();
    const{data:session,error:loadError}=await db.from("retailer_purchase_sessions").select("id,status").eq("id",input.purchaseSessionId).eq("user_id",user.id).maybeSingle();
    if(loadError)throw loadError;if(!session)return NextResponse.json({error:"Purchase session not found"},{status:404});
    if(session.status==="verified")return NextResponse.json({data:{status:"verified"},message:"This purchase is already verified."});
    if(session.status==="evidence_pending")return NextResponse.json({data:{status:"evidence_pending"},message:"This evidence is already awaiting verification."});
    if(!["clicked","rejected"].includes(session.status))return NextResponse.json({error:"This purchase session cannot accept evidence in its current state."},{status:409});
    const{data:updated,error}=await db.from("retailer_purchase_sessions").update({order_reference_hash:privateOrderReference(input.orderReference,credentials().key,user.id),receipt_evidence_url:input.receiptUrl,purchase_date:input.purchaseDate,status:"evidence_pending",updated_at:new Date().toISOString()}).eq("id",session.id).eq("user_id",user.id).in("status",["clicked","rejected"]).select("id").maybeSingle();
    if(error)throw error;
    if(!updated)return NextResponse.json({error:"This purchase changed while evidence was being submitted. Refresh before trying again."},{status:409});
    return NextResponse.json({data:{status:"evidence_pending"},message:"Evidence received. It will not affect retailer ratings until verified."});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Purchase evidence was invalid"},{status:422})}
}
