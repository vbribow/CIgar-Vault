import { NextResponse } from "next/server";
import { responseOutputText } from "@/lib/cigar-vision";
import { physicalVitolaResearch,researchedVitolaLabel,vitolaResearchJsonSchema } from "@/lib/vitola-research";

export const maxDuration=90;

export async function GET(request:Request){
  const url=new URL(request.url),brand=url.searchParams.get("brand")?.trim()||"",line=url.searchParams.get("line")?.trim()||"";
  if(brand.length<2||line.length<2)return NextResponse.json({error:"Choose an exact brand and cigar line first"},{status:400});
  const apiKey=process.env.OPENAI_API_KEY?.trim();
  if(!apiKey)return NextResponse.json({error:"Vitola research is not configured"},{status:503});
  try{
    const prompt=`Find every currently documented physical vitola offered for the exact premium cigar ${brand} — ${line}. A vitola is a stick size or shape such as Robusto, Toro, Lancero, Churchill, Perfecto, or a manufacturer-named size supported by dimensions. Do not return the blend, line, edition, collection, release, or cigar product name as the vitola. Cite a direct official manufacturer page when available, otherwise an established cigar publication or reputable retailer page that directly states the size. Return length in inches and ring gauge when the source states them. If sources disagree, include only defensible options and explain briefly. Never infer an unavailable size from another line.`;
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_VITOLA_MODEL?.trim()||"gpt-4.1-mini",store:false,max_output_tokens:3000,tools:[{type:"web_search",search_context_size:"low"}],tool_choice:"required",input:prompt,text:{format:{type:"json_schema",name:"vitola_research",strict:true,schema:vitolaResearchJsonSchema}}}),signal:AbortSignal.timeout(80_000)});
    const payload=await response.json();
    if(!response.ok)throw new Error((payload as {error?:{message?:string}}).error?.message||`Research failed (${response.status})`);
    const output=responseOutputText(payload);
    if(!output)throw new Error("Research returned no sizes");
    const vitolas=physicalVitolaResearch(JSON.parse(output));
    return NextResponse.json({data:{brand,line,options:vitolas.map(item=>({value:researchedVitolaLabel(item),...item})),researchedAt:new Date().toISOString()}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Vitola research failed"},{status:502})}
}
