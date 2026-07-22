import { z } from "zod";
import type { AccountVaultRecord } from "./account-security";

export const RecoverableRecordKind = z.enum(["inventory","collections","humidors","readings","sensors","valuations","ratings","rating-drafts","smokes","activities","wishlist","integrity","system-runs"]);
export const RecoveryMode = z.enum(["missing","replace","skip"]);
export type RecoveryModeValue = z.infer<typeof RecoveryMode>;

export const AccountExportSchema = z.object({
  format: z.literal("cigar-vault-account-export"),
  version: z.literal(1),
  createdAt: z.string().datetime(),
  owner: z.object({ userId:z.string().min(1), email:z.string().email().optional() }),
  recordCount: z.number().int().nonnegative(),
  records: z.array(z.object({
    kind: RecoverableRecordKind,
    record_id: z.string().trim().min(1).max(240),
    payload: z.record(z.string(),z.unknown()),
    updated_at: z.string().datetime().optional(),
  })).max(10000),
}).superRefine((value,context) => {
  if(value.recordCount!==value.records.length)context.addIssue({code:"custom",path:["recordCount"],message:"Export record count does not match its contents"});
  const keys=new Set<string>();
  value.records.forEach((record,index)=>{const key=`${record.kind}:${record.record_id}`;if(keys.has(key))context.addIssue({code:"custom",path:["records",index,"record_id"],message:"Export contains a duplicate record"});keys.add(key)});
});

export type RecoveryPreview = {
  total: number;
  missing: number;
  conflicts: number;
  identical: number;
  byKind: Array<{kind:string;total:number;missing:number;conflicts:number;identical:number}>;
};

function stable(value: unknown): string {
  if(Array.isArray(value))return `[${value.map(stable).join(",")}]`;
  if(value&&typeof value==="object")return `{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

const key=(record:Pick<AccountVaultRecord,"kind"|"record_id">)=>`${record.kind}:${record.record_id}`;

export function buildRecoveryPreview(incoming:AccountVaultRecord[],existing:AccountVaultRecord[]):RecoveryPreview{
  const current=new Map(existing.map(record=>[key(record),record]));
  const rows=incoming.map(record=>{const found=current.get(key(record));return{kind:record.kind,status:!found?"missing":stable(found.payload)===stable(record.payload)?"identical":"conflicts"} as const});
  const kinds=[...new Set(rows.map(row=>row.kind))].sort();
  const count=(values:typeof rows,status:"missing"|"conflicts"|"identical")=>values.filter(row=>row.status===status).length;
  return{total:rows.length,missing:count(rows,"missing"),conflicts:count(rows,"conflicts"),identical:count(rows,"identical"),byKind:kinds.map(kind=>{const values=rows.filter(row=>row.kind===kind);return{kind,total:values.length,missing:count(values,"missing"),conflicts:count(values,"conflicts"),identical:count(values,"identical")}})};
}

export function recordsForRecovery(incoming:AccountVaultRecord[],existing:AccountVaultRecord[],mode:RecoveryModeValue){
  if(mode==="skip")return [];
  const current=new Map(existing.map(record=>[key(record),record]));
  return incoming.filter(record=>{const found=current.get(key(record));if(!found)return true;return mode==="replace"&&stable(found.payload)!==stable(record.payload)});
}
