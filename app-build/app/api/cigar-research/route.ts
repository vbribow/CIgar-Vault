import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { CigarResearchSchema, cigarResearchJsonSchema } from "@/lib/cigar-research";
import { responseOutputText } from "@/lib/cigar-vision";
import { listingMatchesExactIdentity } from "@/lib/retailer-trust";
import { removeCommercialNavigation } from "@/lib/mobile-commerce-policy";
import { FOX_CIGAR_VERIFICATION_POLICY } from "@/lib/verification-sources";
export const maxDuration=120;

export async function POST(request:Request){
  if(!supabaseConfigured())return NextResponse.json({error:"Sign in before researching a cigar"},{status:401});
  const{data:{user}}=await(await createClient()).auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in before researching a cigar"},{status:401});
  const apiKey=process.env.OPENAI_API_KEY?.trim();
  if(!apiKey)return NextResponse.json({error:"Live cigar research is temporarily unavailable"},{status:503});
  try{
    const query=String((await request.json() as{query?:unknown}).query||"").trim();
    if(query.length<3||query.length>300)return NextResponse.json({error:"Enter a cigar name between 3 and 300 characters"},{status:422});
    const prompt=`Today is ${new Date().toISOString()}. Research this exact premium cigar: ${JSON.stringify(query)}. First resolve the exact brand, line or release, named vitola, dimensions, and compatible release timing. Do not substitute a nearby vitola, sampler, collection, later edition, or family-name match. Document dimensions, country, actual factory, blender, wrapper, binder, filler, stated strength, packaging, release year, and edition only when a direct product-level source supports each detail. Use empty strings for facts that remain unknown. Prefer official manufacturer/importer pages, then established cigar trade publications. Clearly state uncertainty and conflicts. Also find up to eight current direct retailer or auction listings for this exact cigar. ${FOX_CIGAR_VERIFICATION_POLICY} Mark a listing in stock only when the direct page proves it; distinguish asking prices from completed sales; normalize per-cigar price only when package quantity is known. Exclude search pages, social posts, stale snippets, and nearby products. Return concise collector-friendly language.`;
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL?.trim()||"gpt-5.6-terra",reasoning:{effort:"medium"},store:false,max_output_tokens:7000,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"cigar_research",strict:true,schema:cigarResearchJsonSchema}}}),signal:AbortSignal.timeout(110_000)});
    const payload=await response.json();if(!response.ok)throw new Error((payload as{error?:{message?:string}}).error?.message||"Cigar research failed");
    const output=responseOutputText(payload);if(!output)throw new Error("Cigar research returned no result");
    const result=CigarResearchSchema.parse(JSON.parse(output));
    const exact={inventoryId:"RESEARCH",brand:result.profile.brand,line:result.profile.line,vitola:result.profile.vitola,vintage:result.profile.releaseYear||undefined,packaging:result.profile.packaging||undefined};
    const listings=removeCommercialNavigation(result.availability.listings.filter(listing=>listingMatchesExactIdentity(exact,listing)));
    return NextResponse.json({data:{...result,availability:{...result.availability,listings}}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Cigar research failed"},{status:error instanceof Error&&error.name==="TimeoutError"?504:502})}
}
