import assert from "node:assert/strict";
import test from "node:test";
import { AccountExportSchema, buildRecoveryPreview, recordsForRecovery, recoveryConfirmationPhrase, recoveryOwnerMatch } from "../lib/account-recovery";

const existing=[{kind:"inventory",record_id:"I1",payload:{brand:"Cohiba",qty:10}},{kind:"humidors",record_id:"H1",payload:{name:"Main"}}];
const incoming=[{kind:"inventory",record_id:"I1",payload:{qty:20,brand:"Cohiba"}},{kind:"humidors",record_id:"H1",payload:{name:"Main"}},{kind:"sensors",record_id:"S1",payload:{provider:"Tempi"}}];

test("recovery preview classifies missing, conflicting, and identical records",()=>{assert.deepEqual(buildRecoveryPreview(incoming,existing),{total:3,missing:1,conflicts:1,identical:1,byKind:[{kind:"humidors",total:1,missing:0,conflicts:0,identical:1},{kind:"inventory",total:1,missing:0,conflicts:1,identical:0},{kind:"sensors",total:1,missing:1,conflicts:0,identical:0}]})});
test("safe recovery modes select only the intended records",()=>{assert.deepEqual(recordsForRecovery(incoming,existing,"missing").map(row=>row.record_id),["S1"]);assert.deepEqual(recordsForRecovery(incoming,existing,"replace").map(row=>row.record_id),["I1","S1"]);assert.deepEqual(recordsForRecovery(incoming,existing,"skip"),[])});
test("export validation rejects duplicate record keys",()=>{const payload={format:"cigar-vault-account-export",version:1,createdAt:"2026-07-21T12:00:00.000Z",owner:{userId:"U1",email:"owner@example.com"},recordCount:2,records:[incoming[0],incoming[0]]};assert.equal(AccountExportSchema.safeParse(payload).success,false)});
test("recovery accepts legacy exports and current Hojavía exports",()=>{
  const base={createdAt:"2026-07-21T12:00:00.000Z",owner:{userId:"U1",email:"owner@example.com"},recordCount:incoming.length,records:incoming};
  assert.equal(AccountExportSchema.safeParse({...base,format:"cigar-vault-account-export",version:1}).success,true);
  assert.equal(AccountExportSchema.safeParse({...base,format:"hojavia-account-export",version:2}).success,true);
  assert.equal(AccountExportSchema.safeParse({...base,format:"hojavia-account-export",version:1}).success,false);
});
test("recovery identifies exact, same-email, and different-account exports",()=>{
  assert.equal(recoveryOwnerMatch({userId:"U1",email:"owner@example.com"},{userId:"U1",email:"new@example.com"}),"account");
  assert.equal(recoveryOwnerMatch({userId:"OLD",email:"Owner@Example.com"},{userId:"NEW",email:"owner@example.com"}),"email");
  assert.equal(recoveryOwnerMatch({userId:"U1",email:"owner@example.com"},{userId:"U2",email:"other@example.com"}),"different");
});
test("each recovery behavior requires an intention-specific phrase",()=>{
  assert.equal(recoveryConfirmationPhrase("missing"),"RESTORE");
  assert.equal(recoveryConfirmationPhrase("replace"),"REPLACE");
  assert.equal(recoveryConfirmationPhrase("skip"),"AUDIT");
});
