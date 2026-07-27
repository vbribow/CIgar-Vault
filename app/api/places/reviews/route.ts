import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { PlaceReviewInput } from "@/lib/places";
import { moderateCommunityContent } from "@/lib/community-moderation";
import { createClient,supabaseConfigured } from "@/lib/supabase/server";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Location community database is not configured");return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function POST(request:Request){
 if(!supabaseConfigured())return NextResponse.json({error:"Sign in before reviewing a location"},{status:401});
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in before reviewing a location"},{status:401});
 try{const input=PlaceReviewInput.parse(await request.json());const moderation=await moderateCommunityContent(input.review||`Lounge visit score: ${input.score}`);if(moderation.decision==="block")return NextResponse.json({error:moderation.reason},{status:422});const db=admin();const{error:locationError}=await db.from("community_locations").upsert({google_place_id:input.googlePlaceId},{onConflict:"google_place_id"});if(locationError)throw locationError;const{data,error}=await db.from("place_reviews").upsert({user_id:user.id,google_place_id:input.googlePlaceId,display_name:input.displayName,score:input.score,visit_date:input.visitDate,vibes:input.vibes,capabilities:input.capabilities,review:input.review,conflict_disclosure:input.conflictDisclosure||null,status:moderation.decision==="allow"?"active":"review",moderation_reason:moderation.reason,updated_at:new Date().toISOString()},{onConflict:"user_id,google_place_id"}).select().single();if(error)throw error;return NextResponse.json({data,message:moderation.decision==="allow"?"Location rating published.":"Location rating submitted for administrator review."},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid location rating"},{status:422})}
}
