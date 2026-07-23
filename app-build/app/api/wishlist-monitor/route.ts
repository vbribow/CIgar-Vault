import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeSensorSync } from "@/lib/config";
import { WishlistItemSchema } from "@/lib/wishlist-model";
import { wishlistNeedsMonitoring } from "@/lib/wishlist-monitor";
import { researchWishlistAvailability } from "@/lib/wishlist-availability";
export const maxDuration=300;
export async function GET(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if(!url||!serviceKey)return NextResponse.json({error:"Scheduled wishlist monitoring requires SUPABASE_SERVICE_ROLE_KEY"},{status:503});
  try{
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const[{data,error},{data:preferences}]=await Promise.all([admin.from("vault_records").select("user_id,record_id,payload,updated_at").eq("kind","wishlist").order("updated_at",{ascending:true}).limit(100),admin.from("account_preferences").select("user_id,email_notifications,wishlist_alerts")]);
    if(error)throw error;
    const eligible=(data||[]).flatMap(row=>{const parsed=WishlistItemSchema.safeParse(row.payload);return parsed.success&&wishlistNeedsMonitoring(parsed.data)?[{...row,item:parsed.data}]:[]});
    const due=eligible.slice(0,3),preferenceMap=new Map((preferences||[]).map(row=>[row.user_id,row]));
    const outcomes=await Promise.all(due.map(async row=>{try{const preference=preferenceMap.get(row.user_id);const emailAllowed=preference?.email_notifications!==false&&preference?.wishlist_alerts!==false;const{data:{user}}=await admin.auth.admin.getUserById(row.user_id);const result=await researchWishlistAvailability(row.item,emailAllowed?user?.email:undefined);const{error:updateError}=await admin.from("vault_records").update({payload:result.updated,updated_at:new Date().toISOString()}).eq("user_id",row.user_id).eq("kind","wishlist").eq("record_id",row.record_id);if(updateError)throw updateError;return{wishlistId:row.record_id,status:"updated",matches:result.data.priceMatches.length,emailSent:result.data.notification.emailSent}}catch(error){return{wishlistId:row.record_id,status:"failed",error:error instanceof Error?error.message:"Failed"}}}));
    return NextResponse.json({data:{checked:outcomes.length,remainingEligible:Math.max(0,eligible.length-outcomes.length),outcomes}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Wishlist monitoring failed"},{status:502})}
}
