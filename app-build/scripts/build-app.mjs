import { spawnSync } from "node:child_process";

const navigationAudit = spawnSync(process.execPath, ["scripts/audit-internal-links.mjs"], { stdio: "inherit" });
if (navigationAudit.error || navigationAudit.status !== 0) {
  console.error(`Internal navigation audit failed${navigationAudit.error ? `: ${navigationAudit.error.message}` : "."}`);
  process.exit(1);
}

const target = process.env.VERCEL === "1" ? "next" : "vinext";
const result = spawnSync(target, ["build"], { stdio: "inherit" });

if (result.error) {
  console.error(`Unable to start the ${target} production build: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
