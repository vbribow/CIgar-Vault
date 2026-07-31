import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("manifesto artwork has intrinsic dimensions and a resilient fallback", async () => {
  const [page, styles, primary, fallback] = await Promise.all([
    readFile(new URL("app/manifesto/page.tsx", root), "utf8"),
    readFile(new URL("app/manifesto/manifesto.css", root), "utf8"),
    readFile(new URL("public/editorial/cigar-roller-hojavia.jpg", root)),
    stat(new URL("public/editorial/cigar-roller.jpg", root)),
  ]);

  assert.match(page, /src=\{"\/editorial\/cigar-roller-hojavia\.jpg"\}/);
  assert.match(page, /width="1540" height="1021"/);
  assert.match(page, /fetchPriority="high"/);
  assert.match(styles, /url\("\/editorial\/cigar-roller\.jpg"\) center \/ cover no-repeat/);
  assert.equal(primary[0], 0xff);
  assert.equal(primary[1], 0xd8);
  assert.ok(primary.byteLength <= 425 * 1024);
  assert.ok(fallback.size > 100_000);
});
