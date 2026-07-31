import { resolve } from "node:path";
import { rehearseLocalReleaseRollback } from "../lib/release-rollback";

const artifactRoot = resolve(process.argv[2] || "dist");

try {
  const result = await rehearseLocalReleaseRollback(artifactRoot);
  console.log(JSON.stringify({
    status: "passed",
    scope: "local artifact only",
    productionChanged: false,
    externalServicesUsed: false,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    status: "failed",
    scope: "local artifact only",
    productionChanged: false,
    externalServicesUsed: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
