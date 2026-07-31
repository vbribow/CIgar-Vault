import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rename, rm, stat, writeFile, cp } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

export const requiredReleaseFiles = [
  "client/.vite/manifest.json",
  "server/.vite/manifest.json",
  "server/index.js",
  "server/vinext-server.json",
  "server/ssr/index.js",
  "server/ssr/vinext-server.json",
] as const;

export type ReleaseManifestEntry = {
  path: string;
  bytes: number;
  sha256: string;
};

export type RollbackRehearsalResult = {
  artifact: string;
  files: number;
  bytes: number;
  baselineSha256: string;
  invalidCandidateRejected: true;
  activeReleaseProtected: true;
  validCandidateActivated: true;
  postActivationDamageDetected: true;
  previousReleaseRestored: true;
  cleanupCompleted: true;
};

function assertTemporaryWorkspace(path: string) {
  const root = resolve(tmpdir()) + sep;
  const target = resolve(path) + sep;
  if (!target.startsWith(root) || basename(resolve(path)).length < 8) {
    throw new Error("Rollback rehearsal workspace must be a specific temporary directory.");
  }
}

async function filesBelow(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) paths.push(...await filesBelow(root, absolute));
    else if (entry.isFile()) paths.push(relative(root, absolute));
    else throw new Error(`Release artifact contains unsupported entry: ${relative(root, absolute)}`);
  }
  return paths.sort();
}

export async function releaseManifest(root: string): Promise<ReleaseManifestEntry[]> {
  const entries: ReleaseManifestEntry[] = [];
  for (const path of await filesBelow(root)) {
    const contents = await readFile(join(root, path));
    entries.push({
      path,
      bytes: contents.byteLength,
      sha256: createHash("sha256").update(contents).digest("hex"),
    });
  }
  return entries;
}

export function manifestFingerprint(entries: ReleaseManifestEntry[]) {
  const payload = entries.map(entry => `${entry.path}\0${entry.bytes}\0${entry.sha256}`).join("\n");
  return createHash("sha256").update(payload).digest("hex");
}

export async function validateReleaseArtifact(root: string) {
  const errors: string[] = [];
  for (const path of requiredReleaseFiles) {
    try {
      if (!(await stat(join(root, path))).isFile()) errors.push(`${path} is not a file`);
    } catch {
      errors.push(`${path} is missing`);
    }
  }

  for (const path of ["client/.vite/manifest.json", "server/.vite/manifest.json", "server/vinext-server.json", "server/ssr/vinext-server.json"]) {
    try {
      JSON.parse(await readFile(join(root, path), "utf8"));
    } catch {
      errors.push(`${path} is not valid JSON`);
    }
  }

  const clientAssets = join(root, "client", "assets");
  try {
    const checks = await Promise.all((await readdir(clientAssets))
      .filter(name => name.endsWith(".js"))
      .map(async name => (await readFile(join(clientAssets, name), "utf8")).includes("oh-ha-VEE-ah")));
    if (!checks.some(Boolean)) errors.push("client assets do not contain the approved Hojavía pronunciation");
  } catch {
    errors.push("client assets are missing or unreadable");
  }

  return errors;
}

function manifestsMatch(left: ReleaseManifestEntry[], right: ReleaseManifestEntry[]) {
  return manifestFingerprint(left) === manifestFingerprint(right);
}

export async function rehearseLocalReleaseRollback(artifactRoot: string): Promise<RollbackRehearsalResult> {
  const artifact = resolve(artifactRoot);
  const validationErrors = await validateReleaseArtifact(artifact);
  if (validationErrors.length) throw new Error(`Source release artifact is invalid: ${validationErrors.join("; ")}`);

  const workspace = await mkdtemp(join(tmpdir(), "hojavia-rollback-"));
  assertTemporaryWorkspace(workspace);
  const knownGood = join(workspace, "known-good");
  const active = join(workspace, "active");
  const candidate = join(workspace, "candidate");
  const previous = join(workspace, "previous");
  try {
    await Promise.all([
      cp(artifact, knownGood, { recursive: true, errorOnExist: true }),
      cp(artifact, active, { recursive: true, errorOnExist: true }),
      cp(artifact, candidate, { recursive: true, errorOnExist: true }),
    ]);
    const baseline = await releaseManifest(knownGood);
    const activeBefore = await releaseManifest(active);
    if (!manifestsMatch(baseline, activeBefore)) throw new Error("Initial active copy does not match the known-good release.");

    await rm(join(candidate, "server", "index.js"));
    const candidateErrors = await validateReleaseArtifact(candidate);
    if (!candidateErrors.some(error => error.includes("server/index.js is missing"))) {
      throw new Error("Invalid candidate was not rejected.");
    }
    const activeAfterRejection = await releaseManifest(active);
    if (!manifestsMatch(baseline, activeAfterRejection)) throw new Error("Rejected candidate changed the active release.");

    await rm(candidate, { recursive: true });
    await cp(artifact, candidate, { recursive: true, errorOnExist: true });
    if ((await validateReleaseArtifact(candidate)).length) throw new Error("Valid candidate failed pre-activation validation.");
    await rename(active, previous);
    await rename(candidate, active);
    if (!manifestsMatch(baseline, await releaseManifest(active))) throw new Error("Activated release does not match the verified candidate.");

    const activeEntry = join(active, "server", "index.js");
    await writeFile(activeEntry, `${await readFile(activeEntry, "utf8")}\n// simulated post-activation damage\n`);
    if (manifestsMatch(baseline, await releaseManifest(active))) throw new Error("Post-activation damage was not detected.");

    await rm(active, { recursive: true });
    await rename(previous, active);
    if (!manifestsMatch(baseline, await releaseManifest(active))) throw new Error("Rollback did not restore the known-good artifact.");

    const bytes = baseline.reduce((total, entry) => total + entry.bytes, 0);
    return {
      artifact,
      files: baseline.length,
      bytes,
      baselineSha256: manifestFingerprint(baseline),
      invalidCandidateRejected: true,
      activeReleaseProtected: true,
      validCandidateActivated: true,
      postActivationDamageDetected: true,
      previousReleaseRestored: true,
      cleanupCompleted: true,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
