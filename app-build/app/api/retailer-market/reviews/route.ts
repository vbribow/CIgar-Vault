import { randomUUID } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { ratingCanAffectPublicScore, RetailerReviewSchema } from "@/lib/retailer-trust";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Verified retailer ratings are temporarily unavailable");return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Sign in before rating a retailer"},{status:401});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in before rating a retailer"},{status:401});
  try{
    const input=RetailerReviewSchema.parse(await request.json()),db=admin();
    const[{data:session,error:sessionError},{data:existing,error:reviewError}]=await Promise.all([
      db.from("retailer_purchase_sessions").select("id,user_id,retailer_key,status,receipt_verified_at").eq("id",input.purchaseSessionId).maybeSingle(),
      db.from("retailer_reviews").select("id").eq("purchase_session_id",input.purchaseSessionId).maybeSingle()
    ]);
    if(sessionError)throw sessionError;if(reviewError)throw reviewError;
    if(!session)return NextResponse.json({error:"Verified purchase session not found"},{status:404});
    if(!ratingCanAffectPublicScore({transactionStatus:session?.status,transactionUserId:session?.user_id,reviewerUserId:user.id,receiptVerifiedAt:session?.receipt_verified_at,existingReview:Boolean(existing)}))return NextResponse.json({error:"Only one rating from a verified transaction can affect this retailer’s score."},{status:409});
    const{error}=await db.from("retailer_reviews").insert({id:randomUUID(),purchase_session_id:session.id,user_id:user.id,retailer_key:session.retailer_key,overall:input.overall,fulfillment:input.fulfillment,packaging:input.packaging,authenticity_confidence:input.authenticityConfidence,review:input.review||null,status:"verified"});
    if(error)throw error;
    return NextResponse.json({data:{published:true},message:"Verified transaction rating published."},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Retailer rating was invalid"},{status:422})}
}
