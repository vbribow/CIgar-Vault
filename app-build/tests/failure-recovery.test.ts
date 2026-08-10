import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { saveRecoveryMessage } from "../lib/save-recovery";

const read = (relativePath: string) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("save failures provide calm guidance without claiming success", () => {
  const network = saveRecoveryMessage(new Error("Failed to fetch"), "this record");
  const timeout = saveRecoveryMessage(new Error("Request timed out"), "this record");
  const validation = saveRecoveryMessage(new Error("Quantity must be a whole number."), "this record");
  const generic = saveRecoveryMessage(undefined, "this record");

  for (const message of [network, timeout, validation, generic]) {
    assert.match(message, /Your entries are still on this screen/);
    assert.match(message, /retrying will not create a duplicate/);
    assert.doesNotMatch(message, /saved successfully|saved ✓/i);
  }
  assert.match(network, /could not reach your private Vault/);
  assert.match(timeout, /Nothing has been marked as saved/);
  assert.match(validation, /Nothing was saved\. Quantity must be a whole number/);
});

test("journal and valuation retries retain the form and submission identity", () => {
  const records = read("components/records-manager.tsx");

  assert.match(records, /readSaveResponse\(response\)/);
  assert.match(records, /saveRecoveryMessage\([\s\S]*kind === "smoke" \? "this smoking experience"/);
  assert.match(records, /error:"Retry save"/g);
  assert.match(records, /mutation\.succeed\(\);\s*formElement\.reset\(\)/);
  assert.match(records, /setSmokeSubmissionId\(createClientUuid\(\)\)/);
  assert.match(records, /setValuationSubmissionId\(createClientUuid\(\)\)/);
  assert.match(records, /type="submit" className="button"/);
  assert.match(records, /signal:controller\.signal/);
  assert.match(records, /controller\.abort\(new Error\("Save timed out"\)\)/);
  assert.match(records, /window\.clearTimeout\(timeout\)/);
  assert.match(records, /ref=\{smokeSaveFeedback\}/);
});

test("climate saves survive interrupted or unreadable responses", () => {
  const manager = read("components/humidor-manager.tsx");

  assert.match(manager, /try\{const response=await fetch\("\/api\/humidors"/);
  assert.match(manager, /try\{const response=await fetch\("\/api\/humidor-readings"/);
  assert.match(manager, /readSaveResponse\(response\)/g);
  assert.match(manager, /saveRecoveryMessage\(error,"this humidor"\)/);
  assert.match(manager, /saveRecoveryMessage\(error,"this environmental reading"\)/);
  assert.match(manager, /failedAction==="humidor"\?"Retry save"/);
  assert.match(manager, /failedAction==="reading"\?"Retry save"/);
  assert.doesNotMatch(manager, /window\.location\.reload/);
  assert.match(manager, /aria-live="polite"/);
});

test("inventory and photo intake keep their existing duplicate-safe drafts", () => {
  const inventory = read("components/inventory-manager.tsx");
  const intake = read("components/photo-inventory-intake.tsx");

  assert.match(inventory, /if\(!editing\)payload\.submissionId=submissionId/);
  assert.match(inventory, /if\(!isEdit\)setSubmissionId\(createClientUuid\(\)\)/);
  assert.match(inventory, /formElement\.reset\(\);\s*\}\s*catch/);
  assert.match(intake, /localStorage\.setItem\(queueKey,JSON\.stringify\(queue\)\)/);
  assert.match(intake, /if\(approvalInFlight\.current\)return/);
  assert.match(intake, /setQueue\(current=>current\.filter\(entry=>!approved\.has/);
});
