import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const releaseMarker = "__HOJAVIA_RELEASE__";
const releaseInputs = [
  "app",
  "components",
  "data",
  "lib",
  "public",
  "scripts/build-app.mjs",
  "next.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "proxy.ts",
];

function releaseFiles(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap(entry => releaseFiles(resolve(path, entry.name)));
}

function stampInstalledAppRelease() {
  const hash = createHash("sha256");
  for (const input of releaseInputs.flatMap(path => releaseFiles(resolve(path)))) {
    hash.update(relative(process.cwd(), input));
    hash.update("\0");
    hash.update(readFileSync(input));
    hash.update("\0");
  }
  const release = hash.digest("hex").slice(0, 12);
  const workerPath = resolve("dist/client/sw.js");
  const worker = readFileSync(workerPath, "utf8");
  if (!worker.includes(releaseMarker)) {
    throw new Error("The installed-app worker is missing its release marker.");
  }
  writeFileSync(workerPath, worker.replaceAll(releaseMarker, release));
  if (readFileSync(workerPath, "utf8").includes(releaseMarker)) {
    throw new Error("The installed-app release marker was not fully replaced.");
  }
  console.log(`Installed-app release stamped: ${release}`);
}

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

if (result.status !== 0) process.exit(result.status ?? 1);

if (target === "vinext") {
  try {
    stampInstalledAppRelease();
  } catch (error) {
    console.error(`Unable to stamp the installed-app release: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
