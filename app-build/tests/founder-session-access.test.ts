import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("private beta dashboards share one tab-scoped founder session", () => {
  const session = read("../lib/founder-session.ts");
  assert.match(session, /sessionStorage/);
  assert.doesNotMatch(session, /localStorage/);
  for (const component of ["founder-onboarding", "founder-beta-activity", "founder-install-status", "founder-insights"]) {
    const source = read(`../components/${component}.tsx`);
    assert.match(source, /readFounderSessionKey/);
    assert.match(source, /rememberFounderSessionKey/);
  }
});

test("beta dashboards provide explicit back navigation", () => {
  assert.match(read("../app/founder-beta-activity/page.tsx"), /Back to onboarding/);
  assert.match(read("../app/founder-insights/page.tsx"), /Back to beta operations/);
});
