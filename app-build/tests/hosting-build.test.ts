import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const buildScript = readFileSync(new URL("../scripts/build-app.mjs", import.meta.url), "utf8");

test("production builds select the package format required by each host", () => {
  assert.equal(packageJson.scripts.build, "node scripts/build-app.mjs");
  assert.match(buildScript, /VERCEL === "1" \? "next" : "vinext"/);
  assert.match(buildScript, /spawnSync\(target, \["build"\]/);
});
