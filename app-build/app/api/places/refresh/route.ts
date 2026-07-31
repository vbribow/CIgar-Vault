import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { authorizeSensorSync } from "@/lib/config";
import { inLocationRefreshBatches } from "@/lib/places-refresh";

export const maxDuration=60;

export async function GET(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const googleKey=process.env.GOOGLE_PLACES_API_KEY?.trim();
  if(!url||!key||!googleKey)return NextResponse.json({error:"Monthly location verification is not configured"},{status:503});

  try{
    const db=createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const staleBefore=new Date(Date.now()-30*86_400_000).toISOString();
    const{data,error}=await db.from("community_locations")
      .select("google_place_id,last_verified_at")
      .or(`last_verified_at.is.null,last_verified_at.lt.${staleBefore}`)
      .limit(25);
    if(error)throw error;

    const outcomes=await inLocationRefreshBatches(data||[],async row=>{
      const checkedAt=new Date().toISOString();
      try{
        const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(row.google_place_id)}`,{
          headers:{"X-Goog-Api-Key":googleKey,"X-Goog-FieldMask":"id,businessStatus"},
          cache:"no-store",
          signal:AbortSignal.timeout(10_000),
        });
        const{error:verificationError}=await db.from("location_verification_events").insert({
          google_place_id:row.google_place_id,
          checked_at:checkedAt,
          outcome:response.ok?"reachable":"attention",
          detail:response.ok?"Google place record reached; public data remains live-only.":`Place lookup returned ${response.status}.`,
        });
        if(verificationError)throw verificationError;
        if(response.ok){
          const{error:updateError}=await db.from("community_locations").update({last_verified_at:checkedAt}).eq("google_place_id",row.google_place_id);
          if(updateError)throw updateError;
        }
        return{googlePlaceId:row.google_place_id,status:response.ok?"verified":"attention"};
      }catch(error){
        return{googlePlaceId:row.google_place_id,status:"failed",error:error instanceof Error?error.message:"Verification failed"};
      }
    });
    return NextResponse.json({data:{checked:outcomes.length,failed:outcomes.filter(outcome=>outcome.status==="failed").length,outcomes}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Monthly location verification failed"},{status:502});
  }
}
