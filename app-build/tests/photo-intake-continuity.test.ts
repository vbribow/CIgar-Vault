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
