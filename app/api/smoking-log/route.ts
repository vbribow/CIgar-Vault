import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { SmokingLogSchema } from "@/lib/records-model";
import { getSmokingLogs, recordSmokingLog } from "@/lib/smartsheet";
export async function GET(){ if(dataMode()==="mock") return NextResponse.json({data:[]}); try{return NextResponse.json({data:await getSmokingLogs()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Failed"},{status:502});}}
export async function POST(request:Request){if(!authorizeWrite(request))return NextResponse.json({error:"Unauthorized"},{status:401});if(dataMode()==="mock")return NextResponse.json({error:"Writes are disabled in mock mode"},{status:409});try{const item=SmokingLogSchema.parse(await request.json());await recordSmokingLog(item);return NextResponse.json({data:item},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:422});}}
