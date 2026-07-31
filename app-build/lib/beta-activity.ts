export type BetaActivityCollector={id:string;name:string;email:string;stage:string};
export type BetaActivityAccount={id:string;email?:string;created_at?:string;last_sign_in_at?:string};
export type BetaActivityRecord={user_id:string;kind:string;updated_at?:string;payload?:Record<string,unknown>};
export type BetaActivityEvent={user_id:string;event_type:string;created_at:string;properties?:Record<string,unknown>};
export type BetaActivityFeedback={user_id:string;status:string;severity:string;summary:string;created_at:string;page_url?:string};

export type TesterActivityRow={
  id:string;name:string;email:string;stage:string;userId?:string;accountCreatedAt?:string;lastLoginAt?:string;installationConfirmedAt?:string;
  lastActivityAt?:string;inventoryLots:number;smokesLogged:number;inventoryActivities:number;openFeedback:number;urgentFeedback:number;recordedFailures:number;
  state:"Ready"|"Needs attention";reasons:string[];recent:Array<{at:string;label:string}>;
};

const latest=(values:Array<string|undefined>)=>values.filter((value):value is string=>Boolean(value)).sort((a,b)=>b.localeCompare(a))[0];
const failedEvent=(event:BetaActivityEvent)=>event.properties?.failed===true||event.properties?.failed==="true"||event.event_type==="app-operation-failed";
const failedRun=(record:BetaActivityRecord)=>record.kind==="system-runs"&&String(record.payload?.status||"").toLowerCase()==="failed";

export function buildBetaActivityDashboard(collectors:BetaActivityCollector[],accounts:BetaActivityAccount[],records:BetaActivityRecord[],events:BetaActivityEvent[],feedback:BetaActivityFeedback[]){
  const accountsByEmail=new Map(accounts.filter(account=>account.email).map(account=>[account.email!.trim().toLowerCase(),account]));
  const testers:TesterActivityRow[]=collectors.map(collector=>{
    const account=accountsByEmail.get(collector.email.trim().toLowerCase()),userId=account?.id;
    const owned=userId?records.filter(record=>record.user_id===userId):[];
    const userEvents=userId?events.filter(event=>event.user_id===userId):[];
    const userFeedback=userId?feedback.filter(item=>item.user_id===userId):[];
    const open=userFeedback.filter(item=>item.status==="Open"||item.status==="Reviewing");
    const urgent=open.filter(item=>item.severity==="High"||item.severity==="Blocking");
    const failures=owned.filter(failedRun).length+userEvents.filter(failedEvent).length;
    const installs=userEvents.filter(event=>event.event_type==="app-install-confirmed");
    const recent=[
      ...owned.filter(record=>record.kind==="inventory"&&record.updated_at).map(record=>({at:record.updated_at!,label:"Added or updated inventory"})),
      ...owned.filter(record=>record.kind==="smokes"&&record.updated_at).map(record=>({at:record.updated_at!,label:"Logged a smoke"})),
      ...owned.filter(record=>record.kind==="activities"&&record.updated_at).map(record=>({at:record.updated_at!,label:"Recorded inventory activity"})),
      ...userFeedback.map(item=>({at:item.created_at,label:`Submitted ${item.severity.toLowerCase()} feedback`})),
      ...installs.map(event=>({at:event.created_at,label:"Confirmed phone app"})),
    ].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,3);
    const reasons:string[]=[];
    if(!account)reasons.push("Account not created");
    else if(!account.last_sign_in_at)reasons.push("Login not confirmed");
    if(account&&!installs.length)reasons.push("Phone app not confirmed");
    if(urgent.length)reasons.push(`${urgent.length} urgent feedback item${urgent.length===1?"":"s"}`);
    if(failures)reasons.push(`${failures} recorded operation failure${failures===1?"":"s"}`);
    const state:TesterActivityRow["state"]=reasons.length?"Needs attention":"Ready";
    return{id:collector.id,name:collector.name,email:collector.email,stage:collector.stage,userId,accountCreatedAt:account?.created_at,lastLoginAt:account?.last_sign_in_at,installationConfirmedAt:latest(installs.map(event=>event.created_at)),lastActivityAt:latest([account?.last_sign_in_at,...owned.map(record=>record.updated_at),...userEvents.map(event=>event.created_at),...userFeedback.map(item=>item.created_at)]),inventoryLots:owned.filter(record=>record.kind==="inventory").length,smokesLogged:owned.filter(record=>record.kind==="smokes").length,inventoryActivities:owned.filter(record=>record.kind==="activities").length,openFeedback:open.length,urgentFeedback:urgent.length,recordedFailures:failures,state,reasons,recent};
  }).sort((a,b)=>a.state===b.state?(b.lastActivityAt||"").localeCompare(a.lastActivityAt||""):a.state==="Needs attention"?-1:1);
  return{generatedAt:new Date().toISOString(),summary:{testers:testers.length,active:testers.filter(item=>item.lastActivityAt).length,needsAttention:testers.filter(item=>item.state==="Needs attention").length,inventoryLots:testers.reduce((sum,item)=>sum+item.inventoryLots,0),smokes:testers.reduce((sum,item)=>sum+item.smokesLogged,0),openFeedback:testers.reduce((sum,item)=>sum+item.openFeedback,0),recordedFailures:testers.reduce((sum,item)=>sum+item.recordedFailures,0)},testers};
}
