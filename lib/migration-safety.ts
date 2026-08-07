import { createHash } from "node:crypto";

export type MigrationSource = {
  filename: string;
  sql: string;
};

export type MigrationSafetyAudit = {
  migrationCount: number;
  manifestSha256: string;
  duplicateVersions: Array<{ version: string; files: string[] }>;
  destructiveStatements: Array<{ file: string; line: number; statement: string }>;
  replacementStatements: Array<{ file: string; line: number; statement: string }>;
  runtimeDataMutationFunctions: string[];
  releaseDecision: "pass" | "review_required";
};

const filenamePattern = /^(\d{12,14})_[a-z0-9][a-z0-9_]*\.sql$/;
const destructivePattern = /\b(drop\s+table|drop\s+column|truncate(?:\s+table)?|alter\s+table\b.*\brename\b|alter\s+table\b.*\balter\s+column\b.*\btype\b)\b/i;
const replacementPattern = /\bdrop\s+(constraint|policy|trigger)\s+if\s+exists\b/i;
const runtimeDmlPattern = /\b(delete\s+from|update\s+[a-z0-9_."]+\s+set|insert\s+into)\b/i;

function meaningfulLines(sql: string) {
  return sql.split(/\r?\n/).map((text, index) => ({
    line: index + 1,
    text: text.replace(/--.*$/, "").trim(),
  })).filter(item => item.text);
}

export function auditMigrationSet(sources: MigrationSource[]): MigrationSafetyAudit {
  const versions = new Map<string, string[]>();
  const destructiveStatements: MigrationSafetyAudit["destructiveStatements"] = [];
  const replacementStatements: MigrationSafetyAudit["replacementStatements"] = [];
  const runtimeDataMutationFunctions: string[] = [];

  for (const source of [...sources].sort((a, b) => a.filename.localeCompare(b.filename))) {
    const match = filenamePattern.exec(source.filename);
    const version = match?.[1] || "invalid";
    versions.set(version, [...(versions.get(version) || []), source.filename]);
    for (const item of meaningfulLines(source.sql)) {
      if (destructivePattern.test(item.text)) destructiveStatements.push({ file: source.filename, line: item.line, statement: item.text });
      if (replacementPattern.test(item.text)) replacementStatements.push({ file: source.filename, line: item.line, statement: item.text });
    }
    if (/create\s+or\s+replace\s+function/i.test(source.sql) && runtimeDmlPattern.test(source.sql)) {
      runtimeDataMutationFunctions.push(source.filename);
    }
  }

  const duplicateVersions = [...versions.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([version, files]) => ({ version, files: files.sort() }))
    .sort((a, b) => a.version.localeCompare(b.version));
  const manifestPayload = [...sources]
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map(source => `${source.filename}\0${createHash("sha256").update(source.sql).digest("hex")}`)
    .join("\n");
  const manifestSha256 = createHash("sha256").update(manifestPayload).digest("hex");

  return {
    migrationCount: sources.length,
    manifestSha256,
    duplicateVersions,
    destructiveStatements,
    replacementStatements,
    runtimeDataMutationFunctions: runtimeDataMutationFunctions.sort(),
    releaseDecision: duplicateVersions.length || destructiveStatements.length ? "review_required" : "pass",
  };
}
