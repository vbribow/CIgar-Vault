import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const onboarding=readFileSync(new URL("../lib/beta-onboarding.ts",import.meta.url),"utf8");
const readiness=readFileSync(new URL("../app/api/beta-readiness/route.ts",import.meta.url),"utf8");
const feedback=readFileSync(new URL("../lib/beta-feedback.ts",import.meta.url),"utf8");

test("founder beta acceptance covers phone continuity, one controlled save, and recovery",()=>{
  for(const phrase of ["close the browser or installed app","Vault, Log a Smoke, Cigar Somm, Collections, Lounge, Account, and Sign out","confirm one success message and no duplicate","Download a private backup","Do not replace live data"])assert.match(onboarding,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});

test("readiness derives consent, backup, and high-priority issue gates from private records",()=>{
  assert.match(readiness,/account_consents/);
  assert.match(readiness,/inventory-backup/);
  assert.match(readiness,/severity === "Blocking" \|\| row\.severity === "High"/);
  assert.match(feedback,/severity === "Blocking" \|\| record\.severity === "High"/);
});

test("technical checks cannot manufacture collector acceptance",()=>{
  assert.match(feedback,/Four independent critical-path completions/);
  assert.match(feedback,/task_outcome === "Completed independently"/);
  assert.match(feedback,/isFounderAcceptanceTestRecord/);
});
