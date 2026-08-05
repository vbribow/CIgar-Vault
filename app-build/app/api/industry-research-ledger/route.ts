import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { KnowledgeFactDecision, loadResearchLedger, queueCigarKnowledgeProposals, reviewResearchFact } from "@/lib/catalog-knowledge";
import { dossierKnowledgeProposals, WEEKLY_INDUSTRY_WORKFLOW } from "@/lib/industry-research-ledger";

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ingest-opusx-pilot") }),
  z.object({ action: z.literal("review-fact"), factId: z.string().uuid(), decision: KnowledgeFactDecision, note: z.string().trim().max(500).optional() }),
]);
const guard=(request:Request)=>authorizeWrite(request)?undefined:NextResponse.json({error:"Founder authorization required"},{status:401});
export async function GET(request:Request){const denied=guard(request);if(denied)return denied;try{return NextResponse.json({data:await loadResearchLedger(WEEKLY_INDUSTRY_WORKFLOW)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Research ledger unavailable"},{status:502})}}
export async function POST(request:Request){const denied=guard(request);if(denied)return denied;try{const input=Action.parse(await request.json());if(input.action==="ingest-opusx-pilot")await queueCigarKnowledgeProposals(dossierKnowledgeProposals());else await reviewResearchFact(input.factId,input.decision,input.note);return NextResponse.json({data:await loadResearchLedger(WEEKLY_INDUSTRY_WORKFLOW)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Research ledger update failed"},{status:422})}}
