import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const testFiles = readdirSync("tests").filter(name => name.endsWith(".test.ts")).sort().map(name => `tests/${name}`);

const steps = [
  ["configuration contract", "node", ["scripts/audit-production-config.mjs"]],
  ["migration safety", "tsx", ["scripts/audit-migration-safety.ts"]],
  ["typecheck", "tsc", ["--noEmit"]],
  ["tests", "tsx", ["--test", ...testFiles]],
  ["production build", "node", ["scripts/build-app.mjs"]],
  ["rollback rehearsal", "tsx", ["scripts/rehearse-local-release-rollback.ts"]],
  ["clean patch", "git", ["diff", "--check"]],
];

for (const [label, command, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { cwd: process.cwd(), env: process.env, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Release preflight stopped at: ${label}`);
    process.exit(result.status || 1);
  }
}

console.log("\nRelease preflight passed. Deployment was not started.");
