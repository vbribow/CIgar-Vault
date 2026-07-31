import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../app/learn/page.tsx"), "utf8");

test("every collector learning depth links to a working Hojavía destination", () => {
  for (const destination of ["/learn/seed-to-smoke", "/learn/availability-status", "/learn/release-chronology", "/learn/habanos-authenticity", "/community", "/collections"]) {
    assert.match(source, new RegExp(`\"${destination}\"`));
  }
  assert.match(source, /pathways\.map\(\(\[stage,title,body,href,action\]/);
  assert.match(source, /<a href=\{href\}/);
});
