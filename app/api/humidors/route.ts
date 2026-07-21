import { NextResponse } from "next/server";
import { HumidorSchema } from "@/lib/humidor-model";
import { authorizeWrite,dataMode } from "@/lib/config";
import { getHumidors,saveHumidor } from "@/lib/smartsheet";
export async function GET(){if(dataMode()==="mock")return NextResponse.json({data:[]});try{return NextResponse.json({data:await getHumidors()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Failed"},{status:502});}}
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});try{const parsed=HumidorSchema.parse(await request.json());const{memberIds,...humidor}=parsed;await saveHumidor(humidor,memberIds);return NextResponse.json({data:humidor},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:422});}}
