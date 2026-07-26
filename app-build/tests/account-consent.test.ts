import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("legacy beta accounts can record the same auditable consent as new signups", async () => {
  const actions = await readFile(new URL("../app/account/actions.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/account/page.tsx", import.meta.url), "utf8");
  assert.match(actions, /account_consents/);
  assert.match(actions, /age_confirmed_at/);
  assert.match(actions, /terms_accepted_at/);
  assert.match(actions, /privacy_accepted_at/);
  assert.match(actions, /beta_accepted_at/);
  assert.match(page, /action=\{recordBetaConsent\}/);
  assert.match(page, /Record consent/);
});
