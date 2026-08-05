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
  assert.match(source,/Installation help/);
  assert.match(source,/\/install/);
});

test("PWA launch support fails open when phone storage or service-worker updates are unavailable",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"components/pwa-manager.tsx"),"utf8");
  assert.match(source,/value\.update\(\)\.catch/);
  assert.match(source,/register\("\/sw\.js"[\s\S]*?\.catch/);
  assert.match(source,/try\{installDismissed=localStorage\.getItem/);
  assert.match(source,/try\{localStorage\.setItem/);
  assert.match(source,/if\(reloadingForUpdate\)return/);
});
