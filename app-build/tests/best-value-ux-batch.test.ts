import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("recovery journeys explain each phase and announce trustworthy outcomes", () => {
  const create = read("components/create-recovery-point.tsx");
  const restore = read("components/vault-recovery-panel.tsx");

  assert.match(create, /Recovery-point process/);
  assert.match(create, /Prepare/);
  assert.match(create, /Verify/);
  assert.match(create, /Keep safely/);
  assert.match(create, /Create a fresh recovery point/);
  assert.match(restore, /Vault recovery process/);
  assert.match(restore, /Choose and inspect/);
  assert.match(restore, /Compare impact/);
  assert.match(restore, /Confirm intentionally/);
  assert.match(restore, /Selecting it does not restore anything/);
  assert.match(restore, /role=\{failed \? "alert" : "status"\}/);
  assert.match(restore, /router\.refresh\(\)/);
  assert.doesNotMatch(restore, /window\.location\.reload/);
});

test("photo-assisted journeys preserve visible evidence and accessible progress", () => {
  const intake = read("components/photo-inventory-intake.tsx");
  const records = read("components/records-manager.tsx");

  assert.match(intake, /aria-current=\{stage === value \? "step" : undefined\}/);
  assert.match(intake, /ref=\{completion\} tabIndex=\{-1\}/);
  assert.match(intake, /Document another cigar/);
  assert.match(records, /smokePhotoPreviews\.map/);
  assert.match(records, /className="smokePhotoProgress"/);
  assert.match(records, /Comparing visible details/);
  assert.match(records, /aria-busy=\{smokePhotoBusy\}/);
});

test("repeat smoke capture keeps the last identity only when the collector asks", () => {
  const records = read("components/records-manager.tsx");

  assert.match(records, /setLastSmokeIdentity\(\{ source: smokeSource, cigarName: smokeCigarName, outsideIdentity \}\)/);
  assert.match(records, /function startAnotherSmoke\(reuseIdentity = false\)/);
  assert.match(records, /Log this cigar again/);
  assert.match(records, />Log another</);
  assert.match(records, /setSmokePhotos\(\[\]\)/);
});

test("mobile and recovery controls retain platinum touch and reading treatment", () => {
  const styles = read("app/styles.css");

  assert.match(styles, /\.mobileNav :is\(a,button\)\{min-height:52px;touch-action:manipulation\}/);
  assert.match(styles, /\.mobileNav :is\(a,button\)>small\{font-size:10px/);
  assert.match(styles, /\.recoverySteps\{display:grid;grid-template-columns:repeat\(3/);
  assert.match(styles, /@media\(max-width:700px\)\{\.smokePhotoProgress\{grid-template-columns:1fr\}/);
});
