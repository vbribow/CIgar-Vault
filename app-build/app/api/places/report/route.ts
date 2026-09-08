import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { PlaceReportInput } from "@/lib/places";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!url||!key)throw new Error("Location verification is temporarily unavailable.");
 return createAdmin(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function POST(request:Request){
 if(!supabaseConfigured())return NextResponse.json({error:"Sign in to report a location."},{status:401});
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in to report a location."},{status:401});
 try{
  const input=PlaceReportInput.parse(await request.json());
  const db=admin();
  const{error:locationError}=await db.from("community_locations").upsert({google_place_id:input.googlePlaceId},{onConflict:"google_place_id"});
  if(locationError)throw locationError;
  const{error}=await db.from("location_verification_events").insert({google_place_id:input.googlePlaceId,outcome:"attention",detail:"Collector report: this location may not offer an on-site cigar lounge."});
  if(error)throw error;
  return NextResponse.json({message:"Thank you. This location was sent for verification."},{status:201});
 }catch(error){
  console.error("Location report failed",error);
  return NextResponse.json({error:"The location could not be reported. Please try again."},{status:422});
 }
}
