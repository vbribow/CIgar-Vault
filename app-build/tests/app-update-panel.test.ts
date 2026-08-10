import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel=readFileSync(new URL("../components/app-update-panel.tsx",import.meta.url),"utf8");
const worker=readFileSync(new URL("../public/sw.js",import.meta.url),"utf8");
const build=readFileSync(new URL("../scripts/build-app.mjs",import.meta.url),"utf8");
const account=readFileSync(new URL("../components/account-preferences-panel.tsx",import.meta.url),"utf8");

test("Account provides evidence-led installed-app update status",()=>{
  assert.match(account,/AppUpdatePanel/);
  assert.match(panel,/Installed version/);
  assert.match(panel,/Latest available/);
  assert.match(panel,/Check for updates/);
  assert.match(panel,/registration\.update\(\)/);
  assert.match(panel,/release\.json\?check=/);
  assert.match(panel,/cache:"no-store"/);
  assert.match(panel,/No collection records were classified as changed or missing/);
  assert.match(panel,/Your private records remain intact/);
});

test("the active worker and build artifact expose the same private release identity",()=>{
  assert.match(worker,/GET_RELEASE/);
  assert.match(worker,/postMessage\(\{release:CACHE\}\)/);
  assert.match(build,/dist\/client\/release\.json/);
  assert.match(build,/stampVercelInstalledAppRelease/);
  assert.match(build,/public\/release\.json/);
  assert.match(build,/hojavia-beta-shell-v4-\$\{release\}/);
});

test("installed phones can check the release and refresh when the app resumes",()=>{
  const proxy=readFileSync(new URL("../proxy.ts",import.meta.url),"utf8");
  const manager=readFileSync(new URL("../components/pwa-manager.tsx",import.meta.url),"utf8");
  assert.match(proxy,/sw\.js\|release\.json\|manifest\.webmanifest/);
  assert.match(manager,/visibilitychange/);
  assert.match(manager,/window\.addEventListener\("online",refreshUpdate\)/);
});
