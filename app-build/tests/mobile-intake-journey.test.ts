import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");

test("mobile documentation follows an explicit identify, review, and save journey", () => {
  assert.match(intake, /type IntakeStage = "identify" \| "review" \| "saved"/);
  assert.match(intake, /Documentation progress/);
  assert.match(intake, /Start with what you know/);
  assert.match(intake, /Review before saving/);
  assert.match(intake, /Your draft is safe/);
});

test("unfinished typed work is restored locally without overstating photo persistence", () => {
  assert.match(intake, /hojavia:intake-working:v1/);
  assert.match(intake, /localStorage\.setItem\(workingKey/);
  assert.match(intake, /unfinished typed details were restored on this device/);
  assert.match(intake, /Photos are never stored in the browser and must be selected again/);
});

test("completion choices and founder-only controls remain clear", () => {
  assert.match(intake, /Document another cigar/);
  assert.match(intake, /Return to Vault/);
  assert.match(intake, /mode === "smartsheet" && <fieldset className="founderMasterControls"/);
  assert.match(intake, /Possible duplicate — review before saving/);
  assert.match(intake, /Details to confirm/);
});

test("primary save action stays reachable on a phone", () => {
  assert.match(intake, /className="intakePrimaryAction"/);
  assert.match(styles, /\.intakePrimaryAction\{[^}]*grid-column:1\/-1/);
  assert.match(styles, /bottom:calc\(75px \+ env\(safe-area-inset-bottom\)\)/);
});
