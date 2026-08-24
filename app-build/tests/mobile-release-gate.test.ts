import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("the release gate covers every recurring mobile reliability failure", () => {
  const script = readFileSync(new URL("../scripts/audit-mobile-reliability.mjs", import.meta.url), "utf8");
  for (const id of [
    "photo-single-save",
    "photo-reset",
    "photo-feedback",
    "edit-exact-record",
    "smoke-source-choice",
    "smoke-quantity",
    "smoke-idempotency",
    "smoke-camera-reset",
    "validation-recovery",
    "scroll-release",
  ]) assert.match(script, new RegExp(`contract\\("${id}"`));
  const output = execFileSync(process.execPath, [fileURLToPath(new URL("../scripts/audit-mobile-reliability.mjs", import.meta.url))], { encoding: "utf8" });
  assert.match(output, /Mobile reliability gate passed: 10\/10 critical contracts/);
});

test("the complete release command cannot skip the mobile reliability gate", () => {
  const source = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string> };
  assert.equal(source.scripts["audit:mobile-reliability"], "node scripts/audit-mobile-reliability.mjs");
  assert.match(source.scripts["verify:release"], /^node scripts\/audit-mobile-reliability\.mjs && /);
});
