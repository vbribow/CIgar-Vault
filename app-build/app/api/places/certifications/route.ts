import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { authorizeWrite } from "@/lib/config";
import { certificationStorageLevel, normalizeCertificationLevel, PlaceCertificationInput } from "@/lib/places";
function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Certification database is not configured");return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function POST(request:Request){
 if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});
 try{const input=PlaceCertificationInput.parse(await request.json());const db=admin();const{error:locationError}=await db.from("community_locations").upsert({google_place_id:input.googlePlaceId},{onConflict:"google_place_id"});if(locationError)throw locationError;await db.from("place_certifications").update({active:false}).eq("google_place_id",input.googlePlaceId);const{data,error}=await db.from("place_certifications").insert({google_place_id:input.googlePlaceId,level:certificationStorageLevel(input.level),score:input.score,visit_month:input.visitMonth,summary:input.summary,strengths:input.strengths,opportunities:input.opportunities||null,complimentary_disclosure:input.complimentaryDisclosure||null,next_review_date:input.nextReviewDate,active:true}).select().single();if(error)throw error;return NextResponse.json({data:{...data,level:normalizeCertificationLevel(data.level)}},{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid certification"},{status:422})}
}
