import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorizeWrite } from "@/lib/config";
import { installConfirmationEvent } from "@/lib/app-install";

function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!url||!key)throw new Error("Founder installation status requires Supabase service credentials");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}

export async function GET(request:Request){
  if(!authorizeWrite(request))return NextResponse.json({error:"Founder authorization required"},{status:401});
  try{
    const client=admin();
    const[collectors,users,events]=await Promise.all([
      client.from("beta_collectors").select("id,name,email,stage").neq("stage","Prospect").order("updated_at",{ascending:false}),
      client.auth.admin.listUsers({page:1,perPage:1000}),
      client.from("product_events").select("user_id,created_at,properties").eq("event_type",installConfirmationEvent).order("created_at",{ascending:false}).limit(2000),
    ]);
    if(collectors.error||users.error||events.error)throw collectors.error||users.error||events.error;
    const usersByEmail=new Map((users.data.users||[]).filter(user=>user.email).map(user=>[user.email!.toLowerCase(),user]));
    const latestInstall=new Map<string,{created_at:string;properties:Record<string,unknown>} & Record<string,unknown>>();
    for(const event of events.data||[])if(!latestInstall.has(event.user_id))latestInstall.set(event.user_id,event as {created_at:string;properties:Record<string,unknown>} & Record<string,unknown>);
    const data=(collectors.data||[]).map(collector=>{const user=usersByEmail.get(String(collector.email).toLowerCase());const install=user?latestInstall.get(user.id):undefined;return{id:collector.id,name:collector.name,email:collector.email,stage:collector.stage,accountCreatedAt:user?.created_at,loginConfirmedAt:user?.last_sign_in_at,installationConfirmedAt:install?.created_at,host:install?.properties?.host,version:install?.properties?.version,standalone:install?.properties?.standalone}});
    return NextResponse.json({data});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load installation status"},{status:502})}
}
