import { NextResponse } from "next/server";
import { authorizeSensorSync } from "@/lib/config";
import { responseOutputText } from "@/lib/cigar-vision";
import { industryContentKey, IndustryContentItemSchema } from "@/lib/industry-content";
import { partnerAdmin } from "@/lib/partner-platform";
import { z } from "zod";

export const maxDuration=120;
const Result=z.object({items:z.array(IndustryContentItemSchema.omit({id:true,status:true})).max(12)});
const schema={type:"object",additionalProperties:false,properties:{items:{type:"array",maxItems:12,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},summary:{type:"string"},publishedDate:{type:"string"},category:{type:"string",enum:["Legislation","Brand news","New release","People & craft","Auction market","Retail","Growing region","Education"]},sourceType:{type:"string",enum:["Government","Official organization","Independent reporting","Advocacy","Retailer"]},sourceName:{type:"string"},sourceUrl:{type:"string"},jurisdiction:{type:"string"},stance:{type:"string",enum:["Neutral reporting","Supports proposal","Opposes proposal","Not applicable"]}},required:["title","summary","publishedDate","category","sourceType","sourceName","sourceUrl","jurisdiction","stance"]}}},required:["items"]} as const;

export async function GET(request:Request){
  if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});
  const apiKey=process.env.OPENAI_API_KEY?.trim(),admin=partnerAdmin();if(!apiKey||!admin)return NextResponse.json({error:"Industry monitoring is not configured"},{status:503});
  try{
    const today=new Date().toISOString().slice(0,10);
    const prompt=`Today is ${today}. Find up to 12 genuinely newsworthy premium handmade cigar-industry items published during the last 10 days. Rotate across heritage and boutique brands, new releases, growers and producing countries, factories and blenders, auctions, retailers, education, legislation, and advocacy. Use a direct published article, government record, official press release, or named established trade publication. Exclude social posts, forums, rumors, duplicate syndication, generic tobacco/vape news with no material premium-cigar impact, SEO pages, stale stories, and promotional restocks. For legal or political matters, accurately distinguish proposal, consultation, enacted law, effective rule, and advocacy position. For advocacy, identify the organization and label its stance; never rewrite its position as neutral fact. Summaries must be original, factual, 35-70 words, and must not copy article prose. Every URL must be a direct page you visited. Return only items worth showing collectors.`;
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_INDUSTRY_MODEL?.trim()||"gpt-5.6-terra",reasoning:{effort:"low"},store:false,max_output_tokens:4200,tools:[{type:"web_search",search_context_size:"low"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"industry_content",strict:true,schema}}}),signal:AbortSignal.timeout(110_000)});
    const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`Research failed (${response.status})`);
    const output=responseOutputText(payload);if(!output)throw new Error("Industry research returned no usable output");
    const parsed=Result.parse(JSON.parse(output));const now=new Date().toISOString();
    const rows=parsed.items.map(item=>{const key=industryContentKey(item);const id=`NEWS-${Buffer.from(key).toString("base64url").slice(0,80)}`;const record=IndustryContentItemSchema.parse({...item,id,status:"published"});return{id,status:"published",source_url:item.sourceUrl,source_fingerprint:key,payload:record,discovered_at:now,published_at:now}});
    const{data,error}=await admin.from("industry_content_items").upsert(rows,{onConflict:"source_fingerprint",ignoreDuplicates:true}).select("id");if(error)throw error;
    return NextResponse.json({data:{searchedAt:now,qualified:rows.length,published:data?.length||0,duplicatesSkipped:rows.length-(data?.length||0)}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Industry monitoring failed"},{status:502})}
}
