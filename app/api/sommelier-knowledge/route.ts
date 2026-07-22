import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { loadKnowledge, reviewKnowledge } from "@/lib/sommelier-knowledge";
const Update=z.object({knowledgeId:z.string().min(1),status:z.enum(["approved","rejected"]),note:z.string().max(500).optional()}).strict();
export async function GET(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});try{return NextResponse.json({data:await loadKnowledge("review")})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Library unavailable"},{status:502})}}
export async function PATCH(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});try{const input=Update.parse(await request.json());return NextResponse.json({data:await reviewKnowledge(input.knowledgeId,input.status,input.note)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Review failed"},{status:422})}}
