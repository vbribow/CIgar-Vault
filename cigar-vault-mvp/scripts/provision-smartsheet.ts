import fs from "node:fs";
import path from "node:path";

const BASE = "https://api.smartsheet.com/2.0";
const token = process.env.SMARTSHEET_ACCESS_TOKEN;
const workspaceId = process.env.SMARTSHEET_WORKSPACE_ID;
if (!token || !workspaceId) throw new Error("Set SMARTSHEET_ACCESS_TOKEN and SMARTSHEET_WORKSPACE_ID first.");
const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json", "smartsheet-integration-source":process.env.SMARTSHEET_INTEGRATION_SOURCE || "APPLICATION,CigarVault,CigarVault-MVP" };

async function api(pathname:string, init?:RequestInit){ const r=await fetch(`${BASE}${pathname}`,{...init,headers:{...headers,...(init?.headers||{})}}); if(!r.ok) throw new Error(`${r.status} ${await r.text()}`); return r.json(); }
const schemas = JSON.parse(fs.readFileSync(path.join(process.cwd(),"data","smartsheet-schema.json"),"utf8"));
for (const schema of schemas) {
  const created = await api(`/workspaces/${workspaceId}/sheets`, { method:"POST", body:JSON.stringify(schema) });
  console.log(`${schema.name}: ${created.result?.id || created.id}`);
}
console.log("Provisioning complete. Put the returned IDs into .env.local, then import or sync seed rows.");
