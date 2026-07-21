import fs from "node:fs";
import path from "node:path";

const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const BASE = "https://api.smartsheet.com/2.0";
const token = process.env.SMARTSHEET_ACCESS_TOKEN;
const workspaceId = process.env.SMARTSHEET_WORKSPACE_ID;
if (!token || !workspaceId) throw new Error("Set SMARTSHEET_ACCESS_TOKEN and SMARTSHEET_WORKSPACE_ID first.");

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "smartsheet-integration-source": process.env.SMARTSHEET_INTEGRATION_SOURCE || "APPLICATION,CigarVault,CigarVault-MVP" };
async function api(pathname: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${pathname}`, { ...init, headers: { ...headers, ...init?.headers }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Smartsheet request failed (${response.status})`);
  return response.json();
}

type Schema = { name: string; columns: Array<{ title: string; type: string; primary?: boolean; symbol?: string }> };
type Workspace = { sheets?: Array<{ id: number; name: string }> };
const schemas = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "smartsheet-schema.json"), "utf8")) as Schema[];
const workspace = await api(`/workspaces/${workspaceId}`) as Workspace;
const existing = new Map((workspace.sheets ?? []).map((sheet) => [sheet.name, sheet.id]));

for (const schema of schemas) {
  const existingId = existing.get(schema.name);
  if (existingId) { console.log(`${schema.name}: ${existingId} (already exists)`); continue; }
  const created = await api(`/workspaces/${workspaceId}/sheets`, { method: "POST", body: JSON.stringify(schema) }) as { result?: { id?: number }; id?: number };
  console.log(`${schema.name}: ${created.result?.id || created.id} (created)`);
}
console.log("Provisioning complete. Add the returned sheet IDs to .env.local.");
