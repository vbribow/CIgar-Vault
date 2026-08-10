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
  "scripts/audit-performance-budget.mjs",
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

function installedAppRelease() {
  const hash = createHash("sha256");
  for (const input of releaseInputs.flatMap(path => releaseFiles(resolve(path)))) {
    hash.update(relative(process.cwd(), input));
    hash.update("\0");
    hash.update(readFileSync(input));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

function stampedWorker(workerTemplate, release) {
  if (!workerTemplate.includes(releaseMarker)) {
    throw new Error("The installed-app worker is missing its release marker.");
  }
  const worker = workerTemplate.replaceAll(releaseMarker, release);
  if (worker.includes(releaseMarker)) {
    throw new Error("The installed-app release marker was not fully replaced.");
  }
  return worker;
}

function releaseDocument(release) {
  return `${JSON.stringify({ release: `hojavia-beta-shell-v4-${release}` }, null, 2)}\n`;
}

function stampInstalledAppRelease() {
  const release = installedAppRelease();
  const workerPath = resolve("dist/client/sw.js");
  const workerTemplatePath = resolve("public/sw.js");
  const releasePath = resolve("dist/client/release.json");
  const workerTemplate = readFileSync(workerTemplatePath, "utf8");
  // Rebuilds may retain the previously stamped public asset in dist. Always
  // stamp from the immutable public template so repeated builds are identical.
  writeFileSync(workerPath, stampedWorker(workerTemplate, release));
  writeFileSync(releasePath, releaseDocument(release));
  console.log(`Installed-app release stamped: ${release}`);
}

function stampVercelInstalledAppRelease() {
  const release = installedAppRelease();
  const workerPath = resolve("public/sw.js");
  const workerTemplate = readFileSync(workerPath, "utf8");
  writeFileSync(workerPath, stampedWorker(workerTemplate, release));
  writeFileSync(resolve("public/release.json"), releaseDocument(release));
  console.log(`Vercel installed-app release stamped: ${release}`);
}

const navigationAudit = spawnSync(process.execPath, ["scripts/audit-internal-links.mjs"], { stdio: "inherit" });
if (navigationAudit.error || navigationAudit.status !== 0) {
  console.error(`Internal navigation audit failed${navigationAudit.error ? `: ${navigationAudit.error.message}` : "."}`);
  process.exit(1);
}

const sourcePerformanceAudit = spawnSync(process.execPath, ["scripts/audit-performance-budget.mjs"], { stdio: "inherit" });
if (sourcePerformanceAudit.error || sourcePerformanceAudit.status !== 0) {
  console.error(`Performance budget failed${sourcePerformanceAudit.error ? `: ${sourcePerformanceAudit.error.message}` : "."}`);
  process.exit(1);
}

const target = process.env.VERCEL === "1" ? "next" : "vinext";
if (target === "next") {
  try {
    stampVercelInstalledAppRelease();
  } catch (error) {
    console.error(`Unable to stamp the Vercel installed-app release: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
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
  const builtPerformanceAudit = spawnSync(process.execPath, ["scripts/audit-performance-budget.mjs", "--dist"], { stdio: "inherit" });
  if (builtPerformanceAudit.error || builtPerformanceAudit.status !== 0) {
    console.error(`Built performance budget failed${builtPerformanceAudit.error ? `: ${builtPerformanceAudit.error.message}` : "."}`);
    process.exit(1);
  }
}
