import type { DataMode } from "./config";
import { dataMode } from "./config";
import { createClient, supabaseConfigured } from "./supabase/server";

export type VaultRecordKind = "inventory"|"collections"|"humidors"|"readings"|"sensors"|"valuations"|"ratings"|"rating-drafts"|"smokes"|"activities"|"wishlist"|"integrity"|"system-runs";

async function accountContext() {
  if (!supabaseConfigured()) return undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : undefined;
}

export async function accountDataMode(): Promise<DataMode> { return await accountContext() ? "supabase" : dataMode(); }

export async function loadOwnedRecords<T>(kind: VaultRecordKind, fallback: () => Promise<T[]>): Promise<T[]> {
  const context = await accountContext();
  if (!context) return fallback();
  const { data, error } = await context.supabase.from("vault_records").select("payload").eq("kind", kind).order("record_id");
  if (error) throw error;
  return (data ?? []).map(row => row.payload as T);
}

export async function loadAccountRecords<T>(kind: VaultRecordKind): Promise<T[] | undefined> {
  const context = await accountContext();
  if (!context) return undefined;
  const { data, error } = await context.supabase.from("vault_records").select("payload").eq("kind", kind).order("record_id");
  if (error) throw error;
  return (data ?? []).map(row => row.payload as T);
}

export async function saveOwnedRecord(kind: VaultRecordKind, recordId: string, payload: unknown): Promise<boolean> {
  const context = await accountContext();
  if (!context) return false;
  const { error } = await context.supabase.from("vault_records").upsert({ user_id: context.user.id, kind, record_id: recordId, payload, updated_at: new Date().toISOString() }, { onConflict: "user_id,kind,record_id" });
  if (error) throw error;
  return true;
}

export async function deleteOwnedRecord(kind: VaultRecordKind, recordId: string): Promise<boolean> {
  const context = await accountContext();
  if (!context) return false;
  const { error } = await context.supabase.from("vault_records").delete().eq("kind", kind).eq("record_id", recordId);
  if (error) throw error;
  return true;
}

export async function importOwnedRecords(records: Array<{kind:VaultRecordKind;recordId:string;payload:unknown}>) {
  const context = await accountContext();
  if (!context) throw new Error("Sign in before importing records");
  if (!records.length) return 0;
  const rows = records.map(record => ({ user_id: context.user.id, kind: record.kind, record_id: record.recordId, payload: record.payload, updated_at: new Date().toISOString() }));
  const { error } = await context.supabase.from("vault_records").upsert(rows, { onConflict: "user_id,kind,record_id" });
  if (error) throw error;
  return rows.length;
}
