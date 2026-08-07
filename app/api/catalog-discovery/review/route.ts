import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeWrite } from "@/lib/config";
import { reviewCatalogDiscoveries } from "@/lib/smartsheet";
const optionalText=z.string().optional();
const Item=z.object({catalogId:z.string().min(1),brand:z.string().min(1),line:z.string().min(1),vitola:z.string().min(1),country:optionalText,factory:optionalText,brandOwner:optionalText,blender:optionalText,wrapper:optionalText,wrapperOrigin:optionalText,binder:optionalText,binderOrigin:optionalText,filler:optionalText,fillerOrigins:optionalText,dimensions:optionalText,strength:optionalText,packaging:optionalText,releaseYear:z.union([z.string(),z.number()]).optional(),edition:optionalText,sourceUrl:z.string().url().optional(),sourceName:optionalText,sourceType:z.enum(["Official","Verified Historical","Expert","Community","AI-assisted"]).optional(),confidence:z.enum(["High","Medium","Low","Unrated"]).optional(),verifiedAt:optionalText,masterNotes:optionalText,researchStatus:optionalText});
const Input=z.object({items:z.array(Item).min(1).max(100),decision:z.enum(["Approved","Rejected"])});
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});try{const input=Input.parse(await request.json());const reviewed=await reviewCatalogDiscoveries(input.items,input.decision);return NextResponse.json({data:{decision:input.decision,reviewed}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Review failed"},{status:422})}}
