import { spawnSync } from "node:child_process";

const target = process.env.SITES_DEPLOYMENT === "true" ? "vinext" : "next";
const result = spawnSync(target, ["build"], { stdio: "inherit" });

if (result.error) {
  console.error(`Unable to start the ${target} production build: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
