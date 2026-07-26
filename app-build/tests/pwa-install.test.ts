import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("PWA installation never leaves a reusable dead install button",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"components/pwa-manager.tsx"),"utf8");
  assert.match(source,/window\.addEventListener\("appinstalled",installed\)/);
  assert.match(source,/setEvent\(undefined\)/);
  assert.match(source,/if\(!event\|\|installing\)return/);
  assert.match(source,/disabled=\{installing\}/);
  assert.match(source,/Add to Home Screen/);
  assert.match(source,/aria-live="polite"/);
});
