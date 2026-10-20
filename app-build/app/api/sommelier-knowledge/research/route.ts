import { NextResponse } from "next/server";
import { authorizeSensorSync } from "@/lib/config";
import { knowledgeCategories, researchSommelierKnowledge } from "@/lib/sommelier-knowledge";
export const maxDuration=120;
export async function GET(request:Request){if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});try{const requested=new URL(request.url).searchParams.get("category"),pairingCycle=["spirit","cocktail","pairing"] as const;const category=knowledgeCategories.includes(requested as typeof knowledgeCategories[number])?requested as typeof knowledgeCategories[number]:pairingCycle[Math.floor(Date.now()/604800000)%pairingCycle.length];return NextResponse.json({data:await researchSommelierKnowledge(category)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Sommelier research failed"},{status:502})}}
