import type { DataMode } from "./config";
import { dataMode } from "./config";
import type { VaultRecordKind } from "./data-authority";
import { recordRevision } from "./record-revision";
import { createClient, supabaseConfigured } from "./supabase/server";
import { advanceBetaCollectorStage } from "./beta-access";

export type { VaultRecordKind } from "./data-authority";

async function accountContext() {
  if (!supabaseConfigured()) return undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : undefined;
}

async function advanceInventoryProgress(context:Awaited<ReturnType<typeof accountContext>>){
  if(!context?.user.email)return;
  try{
    const{count,error}=await context.supabase.from("vault_records").select("record_id",{count:"exact",head:true}).eq("user_id",context.user.id).eq("kind","inventory");
    if(!error&&(count||0)>0)await advanceBetaCollectorStage(context.user.email,"Imported");
  }catch{/* Pipeline metadata must never turn a successful collector-data save into a failure. */}
}

export async function accountDataMode(): Promise<DataMode> { return await accountContext() ? "supabase" : dataMode(); }

export async function loadOwnedRecords<T>(kind: VaultRecordKind, _fallback: () => Promise<T[]>): Promise<T[]> {
  const context = await accountContext();
  if (!context) return [];
  const { data, error } = await context.supabase.from("vault_records").select("payload").eq("user_id", context.user.id).eq("kind", kind).order("record_id");
  if (error) throw error;
  return (data ?? []).map(row => row.payload as T);
}

export async function loadAccountRecords<T>(kind: VaultRecordKind): Promise<T[] | undefined> {
  const context = await accountContext();
  if (!context) return undefined;
  const { data, error } = await context.supabase.from("vault_records").select("payload").eq("user_id", context.user.id).eq("kind", kind).order("record_id");
  if (error) throw error;
  return (data ?? []).map(row => row.payload as T);
}

export async function loadAccountRecordRows<T>(kind: VaultRecordKind): Promise<Array<{payload:T;createdAt:string}> | undefined> {
  const context = await accountContext();
  if (!context) return undefined;
  const { data, error } = await context.supabase.from("vault_records").select("payload,created_at").eq("user_id", context.user.id).eq("kind", kind).order("record_id");
  if (error) throw error;
  return (data ?? []).map(row => ({ payload: row.payload as T, createdAt: row.created_at as string }));
}

export async function saveOwnedRecord(kind: VaultRecordKind, recordId: string, payload: unknown): Promise<boolean> {
  const context = await accountContext();
  if (!context) return false;
  const { error } = await context.supabase.from("vault_records").upsert({ user_id: context.user.id, kind, record_id: recordId, payload, updated_at: new Date().toISOString() }, { onConflict: "user_id,kind,record_id" });
  if (error) throw error;
  if(kind==="inventory")await advanceInventoryProgress(context);
  return true;
}

export async function saveOwnedRecordIfUnchanged(
  kind: VaultRecordKind,
  recordId: string,
  payload: unknown,
  expectedRevision: string,
): Promise<"saved" | "conflict" | false> {
  const context = await accountContext();
  if (!context) return false;
  const { data: current, error: loadError } = await context.supabase
    .from("vault_records")
    .select("payload,updated_at")
    .eq("user_id", context.user.id)
    .eq("kind", kind)
    .eq("record_id", recordId)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!current || recordRevision(current.payload) !== expectedRevision) return "conflict";
  const { data: saved, error: saveError } = await context.supabase
    .from("vault_records")
    .update({ payload, updated_at: new Date().toISOString() })
    .eq("user_id", context.user.id)
    .eq("kind", kind)
    .eq("record_id", recordId)
    .eq("updated_at", current.updated_at)
    .select("record_id")
    .maybeSingle();
  if (saveError) throw saveError;
  if(saved&&kind==="inventory")await advanceInventoryProgress(context);
  return saved ? "saved" : "conflict";
}

export async function createOwnedRecord(kind: VaultRecordKind, recordId: string, payload: unknown): Promise<"created"|"exists"|false> {
  const context = await accountContext();
  if (!context) return false;
  const { error } = await context.supabase.from("vault_records").insert({
    user_id: context.user.id,
    kind,
    record_id: recordId,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (!error){if(kind==="inventory")await advanceInventoryProgress(context);return "created"}
  if (error.code === "23505") return "exists";
  throw error;
}

export async function loadOwnedRecord<T>(kind: VaultRecordKind, recordId: string): Promise<T | undefined> {
  const context = await accountContext();
  if (!context) return undefined;
  const { data, error } = await context.supabase.from("vault_records").select("payload").eq("user_id", context.user.id).eq("kind", kind).eq("record_id", recordId).maybeSingle();
  if (error) throw error;
  return data?.payload as T | undefined;
}

export async function createOwnedRecords(records:Array<{kind:VaultRecordKind;recordId:string;payload:unknown}>):Promise<boolean>{
  const context=await accountContext();
  if(!context)return false;
  if(!records.length)return true;
  const now=new Date().toISOString();
  const rows=records.map(record=>({user_id:context.user.id,kind:record.kind,record_id:record.recordId,payload:record.payload,updated_at:now}));
  const{error}=await context.supabase.from("vault_records").insert(rows);
  if(error){
    if(error.code==="23505")throw new Error("One of these records already exists. Refresh your Vault before trying again.");
    throw error;
  }
  if(records.some(record=>record.kind==="inventory"))await advanceInventoryProgress(context);
  return true;
}

export async function deleteOwnedRecord(kind: VaultRecordKind, recordId: string): Promise<boolean> {
  const context = await accountContext();
  if (!context) return false;
  const { error } = await context.supabase.from("vault_records").delete().eq("user_id", context.user.id).eq("kind", kind).eq("record_id", recordId);
  if (error) throw error;
  return true;
}

export async function deleteOwnedRecords(kind: VaultRecordKind, recordIds: string[]): Promise<number> {
  const context = await accountContext();
  if (!context) return 0;
  const ids = [...new Set(recordIds.filter(Boolean))];
  if (!ids.length) return 0;
  const { error } = await context.supabase.from("vault_records").delete().eq("user_id", context.user.id).eq("kind", kind).in("record_id", ids);
  if (error) throw error;
  return ids.length;
}

export async function importOwnedRecords(records: Array<{kind:VaultRecordKind;recordId:string;payload:unknown}>) {
  const context = await accountContext();
  if (!context) throw new Error("Sign in before importing records");
  if (!records.length) return 0;
  const rows = records.map(record => ({ user_id: context.user.id, kind: record.kind, record_id: record.recordId, payload: record.payload, updated_at: new Date().toISOString() }));
  const { error } = await context.supabase.from("vault_records").upsert(rows, { onConflict: "user_id,kind,record_id" });
  if (error) throw error;
  if(records.some(record=>record.kind==="inventory"))await advanceInventoryProgress(context);
  return rows.length;
}

/**
 * Saves a related set of owned records in one database statement. Supabase
 * executes the statement transactionally, so collectors never receive a
 * partially populated collection when one row fails.
 */
export async function saveOwnedRecordsAtomically(
  records: Array<{
    kind: VaultRecordKind;
    recordId: string;
    payload: unknown;
  }>,
): Promise<boolean> {
  const context = await accountContext();
  if (!context) return false;
  if (!records.length) return true;
  const updatedAt = new Date().toISOString();
  const rows = records.map((record) => ({
    user_id: context.user.id,
    kind: record.kind,
    record_id: record.recordId,
    payload: record.payload,
    updated_at: updatedAt,
  }));
  const { error } = await context.supabase
    .from("vault_records")
    .upsert(rows, { onConflict: "user_id,kind,record_id" });
  if (error) throw error;
  if(records.some(record=>record.kind==="inventory"))await advanceInventoryProgress(context);
  return true;
}
