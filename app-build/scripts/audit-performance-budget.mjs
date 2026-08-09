import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const failures = [];
const requireText = (file, pattern, message) => {
  const source = readFileSync(resolve(file), "utf8");
  if (!pattern.test(source)) failures.push(message);
};

const hero = resolve("public/editorial/cigar-roller-hojavia.jpg");
if (!existsSync(hero) || statSync(hero).size > 425 * 1024) {
  failures.push("The active home hero exceeds its 425 KiB transfer budget.");
}

requireText("components/inventory-manager.tsx", /dynamic\([\s\S]*photo-inventory-intake/, "Camera intake must remain a deferred client chunk.");
requireText("components/inventory-manager.tsx", /dynamic\([\s\S]*photo-manager/, "Private photo management must remain a deferred client chunk.");
requireText("app/page.tsx", /<Link className="button" href="\/inventory" prefetch>/, "The primary Vault journey must retain a prefetched client transition.");
requireText("components/connection-status.tsx", /window\.addEventListener\("offline"/, "The app must retain a global interruption boundary.");
requireText("app/page.tsx", /<Suspense fallback=\{<DashboardLoading\/>\}><PrivateDashboard\/><\/Suspense>/, "The private dashboard must stream behind the immediate homepage.");
requireText("components/app-navigation.tsx", /<DeferredGlobalSearch\/>/, "Global search must remain interaction or idle loaded.");
requireText("app/layout.tsx", /<DeferredPwaManager\/>/, "Installation tooling must remain idle loaded.");
requireText("components/inventory-manager.tsx", /filtered\.slice\(0, visibleLimit\)/, "Long Vault lists must retain incremental rendering.");

if (process.argv.includes("--dist")) {
  const assetDirectory = resolve("dist/client/assets");
  if (!existsSync(assetDirectory)) failures.push("Built client assets are unavailable for the performance budget.");
  else {
    const scripts = readdirSync(assetDirectory).filter(file => file.endsWith(".js")).map(file => ({ file, bytes: statSync(resolve(assetDirectory, file)).size }));
    const total = scripts.reduce((sum, script) => sum + script.bytes, 0);
    const largest = scripts.sort((left, right) => right.bytes - left.bytes)[0];
    if (total > 1_600_000) failures.push(`Client JavaScript is ${total} bytes; budget is 1,600,000 bytes.`);
    if (largest && largest.bytes > 240_000) failures.push(`${largest.file} is ${largest.bytes} bytes; individual chunk budget is 240,000 bytes.`);
  }
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Performance budget passed${process.argv.includes("--dist") ? " for source and built client assets" : " for source"}.`);
}
