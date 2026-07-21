import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { reviewCatalogDiscovery } from "@/lib/smartsheet";
const Input=z.object({catalogId:z.string().min(1),decision:z.enum(["Approved","Rejected"])});
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});try{const input=Input.parse(await request.json());await reviewCatalogDiscovery(input.catalogId,input.decision);return NextResponse.json({data:input})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Review failed"},{status:422})}}
