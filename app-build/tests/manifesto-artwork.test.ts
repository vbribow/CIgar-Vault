import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("manifesto artwork has intrinsic dimensions and a resilient fallback", async () => {
  const [page, styles, primary, fallback] = await Promise.all([
    readFile(new URL("app/manifesto/page.tsx", root), "utf8"),
    readFile(new URL("app/manifesto/manifesto.css", root), "utf8"),
    readFile(new URL("public/editorial/cigar-roller-hojavia.png", root)),
    stat(new URL("public/editorial/cigar-roller.jpg", root)),
  ]);

  assert.match(page, /src=\{"\/editorial\/cigar-roller-hojavia\.png"\}/);
  assert.match(page, /width="1540" height="1021"/);
  assert.match(page, /fetchPriority="high"/);
  assert.match(styles, /url\("\/editorial\/cigar-roller\.jpg"\) center \/ cover no-repeat/);
  assert.equal(primary.toString("ascii", 1, 4), "PNG");
  assert.equal(primary.readUInt32BE(16), 1540);
  assert.equal(primary.readUInt32BE(20), 1021);
  assert.ok(fallback.size > 100_000);
});
