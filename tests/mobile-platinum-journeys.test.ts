import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const navigation = read("components/app-navigation.tsx");
const search = read("components/global-search.tsx");
const styles = read("app/styles.css");

test("mobile navigation dialogs contain focus and restore the collector's place", () => {
  assert.match(navigation, /mobileMoreSheet\.current\?\.querySelectorAll/);
  assert.match(navigation, /event\.key !== "Tab"/);
  assert.match(navigation, /mobileMoreTrigger\.current\?\.focus/);
  assert.match(navigation, /aria-describedby="mobile-more-description"/);
  assert.match(navigation, /aria-current=\{active\?"page":undefined\}/);
  assert.match(search, /palette\.current\?\.querySelectorAll/);
  assert.match(search, /document\.body\.style\.overflow = "hidden"/);
});

test("private search distinguishes interruption from an honest empty result", () => {
  assert.match(search, /Search is temporarily unavailable\. Your private Vault is unchanged/);
  assert.match(search, /role="alert"/);
  assert.match(search, /Try search again/);
  assert.match(search, /No matching records or workspaces/);
  assert.match(search, /Document a cigar/);
  assert.match(search, /Open Vault/);
  assert.match(search, /aria-busy=\{loading\}/);
});

test("mobile search actions remain touch reachable and safe-area aware", () => {
  assert.match(search, /aria-label="Clear search"/);
  assert.match(styles, /\.commandEmpty>div\{[^}]*flex-wrap:wrap/);
  assert.match(styles, /\.commandPalette>header\{[^}]*grid-template-columns:auto 1fr auto auto/);
});
