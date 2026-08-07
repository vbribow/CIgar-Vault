import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const draftHook = read("components/use-device-form-draft.ts");
const records = read("components/records-manager.tsx");
const activity = read("components/activity-manager.tsx");
const humidors = read("components/humidor-manager.tsx");
const purchases = read("components/wishlist-purchase-intake.tsx");
const styles = read("app/styles.css");

test("device drafts preserve collector fields but never cache passwords or files", () => {
  assert.match(draftHook, /window\.localStorage\.setItem/);
  assert.match(draftHook, /window\.localStorage\.removeItem/);
  assert.match(draftHook, /\["password", "file"\]/);
  assert.match(draftHook, /restoreFields/);
  assert.match(draftHook, /A damaged or blocked cache must never block the form/);
});

test("high-value collector forms restore unfinished work and clear it only after success", () => {
  for (const source of [records, activity, humidors, purchases]) {
    assert.match(source, /useDeviceFormDraft/);
    assert.match(source, /\.clear\(\)/);
    assert.match(source, /restoredFields/);
    assert.match(source, /browser profile/);
  }
  assert.match(records, /hojavia:form-draft:smoke:v1/);
  assert.match(records, /hojavia:form-draft:valuation:v1/);
  assert.match(activity, /hojavia:form-draft:activity:v1/);
  assert.match(humidors, /hojavia:form-draft:humidor-reading:v1/);
  assert.match(purchases, /hojavia:form-draft:wishlist-purchase:/);
});

test("repeat submission and recovery language remain explicit", () => {
  assert.match(activity, /saveInFlight\.current/);
  assert.match(activity, /saveRecoveryMessage/);
  assert.match(purchases, /conversionInFlight\.current/);
  assert.match(humidors, /saveInFlight\.current/);
  assert.match(purchases, /saveRecoveryMessage/);
  assert.match(activity, /Record another activity/);
  assert.match(humidors, /Record another reading/);
  assert.match(purchases, /Document another purchase/);
  assert.match(purchases, /Return to Vault/);
});

test("primary actions remain above the mobile navigation and keyboard edge", () => {
  assert.match(styles, /\.recordsGrid \.recordForm>button\.button/);
  assert.match(styles, /bottom:calc\(76px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(styles, /\.mutationCompletion/);
});
