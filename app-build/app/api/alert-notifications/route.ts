import { NextResponse } from "next/server";
import { authorizeSensorSync } from "@/lib/config";
import { notificationConfiguration,processClimateAlertNotifications,sendTestNotifications } from "@/lib/alert-notifications";
export async function GET(){return NextResponse.json({data:notificationConfiguration()})}
export async function POST(request:Request){if(!authorizeSensorSync(request))return NextResponse.json({error:"Unauthorized"},{status:401});try{const body=await request.json().catch(()=>({}));const data=body?.mode==="test"?await sendTestNotifications():await processClimateAlertNotifications();return NextResponse.json({data})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Notification failed"},{status:502})}}
