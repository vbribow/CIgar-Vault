import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(
  new URL("../components/photo-inventory-intake.tsx", import.meta.url),
  "utf8",
);

test("documenting consecutive cigars never requires a page refresh", () => {
  assert.match(intake, /Document another cigar/);
  assert.match(intake, /Your saved draft stays in the review queue/);
  assert.match(intake, /key=\{`intake-\$\{captureSession\}`\}/);
  assert.match(intake, /setQuery\(""\)/);
  assert.match(intake, /identificationInput\.current\?\.focus\(\)/);
});

test("selected cigar photos remain visible while AI identification is running", () => {
  assert.match(intake, /analysisKind === "photos"/);
  assert.match(intake, /Reviewing your selected photos/);
  assert.match(intake, /photos\.map\(\(photo, index\)/);
  assert.match(intake, /AI suggestions are not authentication/);
  assert.match(intake, /aria-busy=\{analyzing && analysisKind === "photos"\}/);
});
