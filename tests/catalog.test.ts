import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("production catalog supplements master choices with owned cigar vitolas", () => {
  const source = readFileSync(new URL("../lib/catalog.ts", import.meta.url), "utf8");
  assert.match(source, /\.\.\.master/);
  assert.match(source, /\.\.\.inventory\.map/);
  assert.match(source, /item\.brand, item\.line, item\.vitola/);
});
