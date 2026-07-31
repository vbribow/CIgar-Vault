import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/collector-walkthrough/page.tsx", "utf8");
const component = readFileSync("components/collector-walkthrough.tsx", "utf8");
const navigation = readFileSync("components/app-navigation.tsx", "utf8");

test("the private collector walkthrough uses synthetic data and never claims authentication", () => {
  assert.match(page, /Synthetic Collector Walkthrough/);
  assert.doesNotMatch(page, /Synthetic Collector Walkthrough ·/);
  assert.match(page, /Does not authenticate cigars/);
  assert.match(component, /synthetic: true/);
  assert.match(component, /savedToAccount: false/);
  assert.match(component, /authenticationClaim: false/);
  assert.match(component, /does not authenticate the cigars, seller, custody, condition, or legality/i);
  assert.match(component, /does not send its synthetic identifier/i);
});

test("the walkthrough covers the complete evidence journey and portable export", () => {
  for (const label of ["Identity", "Acquisition", "Package", "Official check", "Conclusion", "Export"]) assert.match(component, new RegExp(label));
  for (const state of ["Official result recorded", "Partially supported", "Conflicting", "Tool unavailable", "Unresolved"]) assert.match(component, new RegExp(state));
  assert.match(component, /hojavia-synthetic-evidence-record\.json/);
  assert.match(component, /Nothing was added to your account/);
  assert.match(component, /Restart walkthrough/);
  assert.match(component, /role="progressbar"/);
  assert.match(navigation, /\/collector-walkthrough/);
});
