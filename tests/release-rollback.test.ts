import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  rehearseLocalReleaseRollback,
  releaseManifest,
  requiredReleaseFiles,
  validateReleaseArtifact,
} from "../lib/release-rollback";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "hojavia-release-fixture-"));
  for (const path of requiredReleaseFiles) {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, path.endsWith(".json") ? "{}" : `export default ${JSON.stringify(path)};`);
  }
  await mkdir(join(root, "client", "assets"), { recursive: true });
  await writeFile(join(root, "client", "assets", "brand.js"), `export const pronunciation="oh-ha-VEE-ah";`);
  return root;
}

test("release validation rejects a missing server entry without changing the source", async () => {
  const root = await fixture();
  try {
    assert.deepEqual(await validateReleaseArtifact(root), []);
    const before = await releaseManifest(root);
    await rm(join(root, "server", "index.js"));
    assert.match((await validateReleaseArtifact(root)).join("\n"), /server\/index\.js is missing/);
    assert.equal(before.some(entry => entry.path === "server/index.js"), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local rollback rehearsal rejects, activates, detects damage, and restores inside temporary storage", async () => {
  const root = await fixture();
  try {
    const before = await releaseManifest(root);
    const result = await rehearseLocalReleaseRollback(root);
    const after = await releaseManifest(root);
    assert.deepEqual(after, before);
    assert.equal(result.invalidCandidateRejected, true);
    assert.equal(result.activeReleaseProtected, true);
    assert.equal(result.validCandidateActivated, true);
    assert.equal(result.postActivationDamageDetected, true);
    assert.equal(result.previousReleaseRestored, true);
    assert.equal(result.cleanupCompleted, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
