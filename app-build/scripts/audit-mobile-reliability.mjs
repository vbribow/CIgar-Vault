import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const contract = (id, label, checks) => ({ id, label, checks });

export const mobileReliabilityContracts = [
  contract("photo-single-save", "Photo intake saves one reviewed lot once", [
    ["components/photo-inventory-intake.tsx", /if\(approvalInFlight\.current\)return/],
    ["components/photo-inventory-intake.tsx", /onApproved\(approvedInventory\)/],
    ["components/inventory-manager.tsx", /approved\.length===1[\s\S]*window\.location\.assign\(`\/inventory\/\$\{encodeURIComponent\(saved\.inventoryId\)\}\?saved=inventory`\)/],
  ]),
  contract("photo-reset", "Another cigar starts with blank fields and a fresh camera", [
    ["components/photo-inventory-intake.tsx", /setBrand\(""\); setLine\(""\); setVitola\(""\); setVintage\(""\); setQuery\(""\)/],
    ["components/photo-inventory-intake.tsx", /setFullBoxQty\(""\); setSticksPerBox\(""\); setLooseStickQty\(""\)/],
    ["components/photo-inventory-intake.tsx", /setCaptureSession\(\(value\) => value \+ 1\)/],
  ]),
  contract("photo-feedback", "Photo intake keeps errors and completion visible on a phone", [
    ["components/photo-inventory-intake.tsx", /messageOutput\.current\?\.scrollIntoView[\s\S]*messageOutput\.current\?\.focus/],
    ["components/photo-inventory-intake.tsx", /completion\.current\?\.scrollIntoView[\s\S]*completion\.current\?\.focus/],
    ["app/styles.css", /\.inventorySaveToast\{left:16px;right:16px;bottom:calc\(92px \+ env\(safe-area-inset-bottom\)\)/],
  ]),
  contract("edit-exact-record", "Edit and save stay on the exact inventory record", [
    ["components/inventory-manager.tsx", /Edit all details/],
    ["components/inventory-manager.tsx", /if\(isEdit\)window\.location\.assign\(saveReturnHref\|\|`\/inventory\/\$\{encodeURIComponent\(savedId\)\}\?saved=inventory`\)/],
    ["components/inventory-manager.tsx", /id="inventory-editor"/],
  ]),
  contract("smoke-source-choice", "Smoke logging clearly separates Vault and outside-Vault cigars", [
    ["components/records-manager.tsx", />Do not remove from my Vault<\/strong>/],
    ["components/records-manager.tsx", />Remove from my Vault<\/strong>/],
    ["components/records-manager.tsx", /Saving creates only a private smoking review—no Vault record and no quantity change/],
  ]),
  contract("smoke-quantity", "Vault smoke quantity is explicit and bounded", [
    ["components/records-manager.tsx", /name="quantitySmoked" type="number" min="1" max=\{selectedSmokeInventory\.currentQty\}/],
    ["components/records-manager.tsx", /Saving removes exactly the number entered; original quantity stays unchanged/],
    ["components/records-manager.tsx", /Correct this exact record/],
  ]),
  contract("smoke-idempotency", "Repeated or uncertain smoke saves cannot silently duplicate", [
    ["components/records-manager.tsx", /fetchWithConfirmationRetry/],
    ["components/records-manager.tsx", /smokeMutation\.pending \|\| smokeMutation\.complete/],
    ["components/records-manager.tsx", /Smoke saved\.<\/strong>/],
  ]),
  contract("smoke-camera-reset", "The native camera remounts after each completed smoke", [
    ["components/records-manager.tsx", /smokePhotoRequest\.current \+= 1;[\s\S]*setSmokeCameraSession\(current=>current\+1\)/],
    ["components/records-manager.tsx", /key=\{`smoke-camera-\$\{smokeCameraSession\}`\}/],
    ["components/records-manager.tsx", /URL\.revokeObjectURL/],
  ]),
  contract("validation-recovery", "Invalid smoke fields receive focus and a plain corrective message", [
    ["components/records-manager.tsx", /invalid\?\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/],
    ["components/records-manager.tsx", /Choose ‘Remove from my Vault’[\s\S]*‘Do not remove from my Vault’/],
    ["components/records-manager.tsx", /role=\{smokeMutation\.status === "error" \? "alert" : "status"\}/],
  ]),
  contract("scroll-release", "Mobile overlays release their shared body scroll lock", [
    ["lib/body-scroll-lock.ts", /lockCount = Math\.max\(0, lockCount - 1\)/],
    ["lib/body-scroll-lock.ts", /if \(lockCount === 0\) document\.body\.style\.overflow/],
    ["components/app-navigation.tsx", /lockBodyScroll/],
    ["components/global-search.tsx", /lockBodyScroll/],
  ]),
];

export function auditMobileReliability(base = root) {
  const cache = new Map();
  const results = mobileReliabilityContracts.map(item => {
    const failures = item.checks.flatMap(([path, pattern]) => {
      const source = cache.get(path) ?? readFileSync(resolve(base, path), "utf8");
      cache.set(path, source);
      return pattern.test(source) ? [] : [`${path} no longer satisfies ${pattern}`];
    });
    return { id: item.id, label: item.label, passed: failures.length === 0, failures };
  });
  return { passed: results.every(item => item.passed), results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const audit = auditMobileReliability();
  for (const item of audit.results) console.log(`${item.passed ? "PASS" : "FAIL"} · ${item.label}`);
  if (!audit.passed) {
    for (const failure of audit.results.flatMap(item => item.failures)) console.error(`  ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`Mobile reliability gate passed: ${audit.results.length}/${audit.results.length} critical contracts.`);
  }
}
