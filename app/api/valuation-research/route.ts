import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/config";
import { responseOutputText } from "@/lib/cigar-vision";
import { loadInventory } from "@/lib/inventory";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { ValuationResearchSchema, valuationResearchJsonSchema } from "@/lib/valuation-research";

async function authorized(request:Request){if(authorizeWrite(request))return true;if(!supabaseConfigured())return false;const{data:{user}}=await(await createClient()).auth.getUser();return Boolean(user)}
export async function POST(request:Request){
 if(!await authorized(request))return NextResponse.json({error:"Sign in before researching values"},{status:401});
 const apiKey=process.env.OPENAI_API_KEY?.trim();if(!apiKey)return NextResponse.json({error:"Valuation research is not configured"},{status:503});
 try{
  const {inventoryId}=await request.json() as {inventoryId?:string};const item=(await loadInventory()).find(value=>value.inventoryId===inventoryId);if(!item)return NextResponse.json({error:"Inventory lot not found"},{status:404});
  const prompt=`Research current pricing evidence for this cigar inventory lot: ${item.brand}; line ${item.line}; vitola ${item.vitola}; vintage/release ${item.vintage??"unknown"}; packaging ${item.packaging??"unknown"}; quantity ${item.currentQty??"unknown"}. Find up to three direct, current comparable pages. Return USD values per individual cigar, never box totals. Normalize box prices by the documented cigar count. For Cuban, vintage, discontinued, or collector presentations, prioritize reputable auction or specialist market evidence and explain buyer premiums or condition differences. For regular production cigars, prioritize manufacturer or established retailer pricing. Do not invent a value when packaging or vintage prevents a clean comparison: use null and explain. source/sourceUrl must identify the strongest comparable. evidenceDate must be today's date in YYYY-MM-DD. This is research evidence, not an appraisal.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL?.trim()||"gpt-5.6-terra",reasoning:{effort:"medium"},store:false,max_output_tokens:2600,tools:[{type:"web_search"}],include:["web_search_call.action.sources"],input:prompt,text:{format:{type:"json_schema",name:"valuation_research",strict:true,schema:valuationResearchJsonSchema}}}),signal:AbortSignal.timeout(90_000)});
  const payload=await response.json();if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`OpenAI request failed (${response.status})`);const text=responseOutputText(payload);if(!text)throw new Error("Research returned no valuation draft");const data=ValuationResearchSchema.parse(JSON.parse(text));return NextResponse.json({data:{...data,inventoryId:item.inventoryId,currentQty:item.currentQty,lotMarketValue:data.marketValue===null||item.currentQty===undefined?null:data.marketValue*item.currentQty,lotReplacementValue:data.replacementValue===null||item.currentQty===undefined?null:data.replacementValue*item.currentQty}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Valuation research failed"},{status:502})}
}
