import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { reviewCatalogDiscoveries } from "@/lib/smartsheet";
const Item=z.object({catalogId:z.string().min(1),brand:z.string().min(1),line:z.string().min(1),vitola:z.string().min(1),country:z.string().optional(),sourceUrl:z.string().url().optional(),researchStatus:z.string().optional()});
const Input=z.object({items:z.array(Item).min(1).max(100),decision:z.enum(["Approved","Rejected"])});
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});try{const input=Input.parse(await request.json());const reviewed=await reviewCatalogDiscoveries(input.items,input.decision);return NextResponse.json({data:{decision:input.decision,reviewed}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Review failed"},{status:422})}}
