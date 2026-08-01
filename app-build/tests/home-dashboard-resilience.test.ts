import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/page.tsx", "utf8");

test("the private dashboard never calculates from partial evidence", () => {
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /evidenceResults\?\.every\(result => result\.status === "fulfilled"\)/);
  assert.match(page, /Private dashboard protected/);
  assert.match(page, /Rather than present partial information as complete/);
  assert.match(page, /summary will remain paused/);
});
