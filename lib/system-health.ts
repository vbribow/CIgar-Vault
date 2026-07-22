export type SystemJobId="sensor-sync"|"catalog-discovery"|"wishlist-monitor"|"valuation-monitor"|"rating-monitor";
export type SystemRun={runId:string;jobId:SystemJobId;status:"Succeeded"|"Failed";startedAt:string;completedAt:string;summary:string;error?:string};
export type HealthCheck={id:string;name:string;description:string;status:"Ready"|"Attention"|"Unavailable";detail:string;href?:string};
export const systemJobs:Array<{id:SystemJobId;name:string;path:string;schedule:string;nextDescription:string}>=[
  {id:"sensor-sync",name:"Sensor synchronization",path:"/api/sensor-sync",schedule:"0 * * * *",nextDescription:"Hourly at minute 0"},
  {id:"catalog-discovery",name:"Catalog discovery",path:"/api/catalog-discovery/run",schedule:"0 12 * * 1",nextDescription:"Monday at 12:00 UTC"},
  {id:"wishlist-monitor",name:"Wishlist monitoring",path:"/api/wishlist-monitor",schedule:"30 13 * * *",nextDescription:"Daily at 13:30 UTC"},
  {id:"valuation-monitor",name:"Valuation monitoring",path:"/api/valuation-monitor",schedule:"0 14 * * 0",nextDescription:"Sunday at 14:00 UTC"},
  {id:"rating-monitor",name:"Professional rating coverage",path:"/api/rating-monitor",schedule:"30 14 * * 0",nextDescription:"Sunday at 14:30 UTC"},
];
export function configurationChecks(environment:Record<string,string|undefined>):HealthCheck[]{const has=(...names:string[])=>names.every(name=>Boolean(environment[name]?.trim()));return[
  {id:"supabase",name:"Private account database",description:"Authentication and private vault records",status:has("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY")?"Ready":"Attention",detail:has("NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY")?"Public and scheduled-service credentials configured":"One or more Supabase credentials are missing"},
  {id:"smartsheet",name:"Smartsheet master",description:"Founder inventory and supporting sheets",status:has("SMARTSHEET_ACCESS_TOKEN","SMARTSHEET_INVENTORY_SHEET_ID")?"Ready":"Attention",detail:has("SMARTSHEET_ACCESS_TOKEN","SMARTSHEET_INVENTORY_SHEET_ID")?"Access token and inventory sheet configured":"Access token or inventory sheet ID is missing"},
  {id:"openai",name:"Research intelligence",description:"Catalog, pricing, ratings, and photo identification",status:has("OPENAI_API_KEY")?"Ready":"Attention",detail:has("OPENAI_API_KEY")?"OpenAI research is configured":"OPENAI_API_KEY is missing"},
  {id:"stripe",name:"Founder billing",description:"Secure annual membership checkout and account management",status:has("STRIPE_SECRET_KEY","STRIPE_FOUNDER_PRICE_ID")?"Ready":"Attention",detail:has("STRIPE_SECRET_KEY","STRIPE_FOUNDER_PRICE_ID")?"Stripe secret and Founder price configured":"Stripe secret or Founder price ID is missing",href:"/pricing"},
  {id:"scheduler",name:"Scheduled operations",description:"Protected Vercel cron execution",status:has("CRON_SECRET")?"Ready":"Attention",detail:has("CRON_SECRET")?"Scheduler secret configured":"CRON_SECRET is missing"},
  {id:"sensorpush",name:"SensorPush cloud",description:"Optional automatic climate synchronization",status:has("SENSORPUSH_EMAIL","SENSORPUSH_PASSWORD")?"Ready":"Attention",detail:has("SENSORPUSH_EMAIL","SENSORPUSH_PASSWORD")?"Cloud credentials configured":"Optional SensorPush credentials are incomplete",href:"/sensors"},
  {id:"smartsheet-sensors",name:"Climate data sheet",description:"Sensor and reading persistence",status:has("SMARTSHEET_SENSORS_SHEET_ID")?"Ready":"Attention",detail:has("SMARTSHEET_SENSORS_SHEET_ID")?"Sensor sheet configured":"SMARTSHEET_SENSORS_SHEET_ID is missing",href:"/sensors"},
]}
export function latestRuns(runs:SystemRun[]){return new Map(systemJobs.map(job=>[job.id,[...runs].filter(run=>run.jobId===job.id).sort((a,b)=>b.completedAt.localeCompare(a.completedAt))[0]]))}
export function healthScore(checks:HealthCheck[],jobs=systemJobs,runs:SystemRun[]=[]){const ready=checks.filter(check=>check.status==="Ready").length;const failedLatest=[...latestRuns(runs).values()].filter(run=>run?.status==="Failed").length;return Math.max(0,Math.round(ready/checks.length*100)-Math.round(failedLatest/Math.max(1,jobs.length)*25))}
