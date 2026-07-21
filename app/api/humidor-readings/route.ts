import { NextResponse } from "next/server";
import { HumidorReadingSchema } from "@/lib/humidor-model";
import { authorizeWrite,dataMode } from "@/lib/config";
import { addHumidorReading,getHumidorReadings } from "@/lib/smartsheet";
export async function GET(){if(dataMode()==="mock")return NextResponse.json({data:[]});try{return NextResponse.json({data:await getHumidorReadings()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Failed"},{status:502});}}
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});try{const value=HumidorReadingSchema.parse(await request.json());return NextResponse.json({data:await addHumidorReading(value)},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:422});}}
