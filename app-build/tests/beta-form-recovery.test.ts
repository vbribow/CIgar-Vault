import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = (name: string) =>
  readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");

test("six beta-critical flows show progress and prevent repeat actions", () => {
  const photo = component("photo-inventory-intake.tsx");
  const smoke = component("records-manager.tsx");
  const somm = component("cigar-somm.tsx");
  const collections = component("collections-manager.tsx");
  const recovery = component("password-recovery-form.tsx");
  const reports = component("report-actions.tsx");

  assert.match(photo, /disabled=\{!pending\|\|approving\}/);
  assert.match(photo, /Adding to Vault…/);
  assert.match(smoke, /disabled=\{mode === "mock" \|\| smokeQuantityBlocked \|\| smokePhotoBusy \|\| smokeMutation\.pending \|\| smokeMutation\.complete\}/);
  assert.match(smoke, />Log another</);
  assert.match(somm, /disabled=\{busy\|\|!ready\}/);
  assert.match(somm, /Researching · \$\{elapsed\}s/);
  assert.match(collections, /disabled=\{saving\}/);
  assert.match(collections, /Saving…/);
  assert.match(recovery, /disabled=\{busy \|\| secondsRemaining > 0\}/);
  assert.match(recovery, /Sending…/);
  assert.match(reports, /aria-busy=\{downloading\}/);
  assert.match(reports, /Preparing secure PDF…/);
});

test("beta-critical failures and completions remain visible and announced", () => {
  const somm = component("cigar-somm.tsx");
  const smoke = component("records-manager.tsx");
  const recovery = component("password-recovery-form.tsx");
  const reports = component("report-actions.tsx");
  const privateExport = component("private-record-export.tsx");

  assert.match(somm, /className="sommError" aria-live="polite" aria-atomic="true"/);
  assert.match(smoke, /className="wideMessage" aria-live="polite" aria-atomic="true"/);
  assert.match(recovery, /className="loginMessage error" role="alert"/);
  assert.match(recovery, /className="loginMessage" role="status"/);
  assert.match(reports, /aria-live="polite" aria-atomic="true"/);
  assert.match(privateExport, /aria-busy=\{busy\}/);
  assert.match(privateExport, /aria-live="polite" aria-atomic="true"/);
});
