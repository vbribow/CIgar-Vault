import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("keyboard users can bypass repeated navigation without disturbing page landmarks", () => {
  const layout = source("app/layout.tsx");
  const styles = source("app/styles.css");
  assert.match(layout, /className="skipLink" href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(styles, /\.skipLink:focus\{transform:translateY\(0\)\}/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /:focus-visible/);
});

test("privacy preferences always release pending state and announce success or recovery", () => {
  const panel = source("components/account-preferences-panel.tsx");
  assert.match(panel, /if \(busy\) return/);
  assert.match(panel, /aria-busy=\{busy\}/);
  assert.match(panel, /finally \{\s*setBusy\(false\)/);
  assert.match(panel, /Please check your connection and try again/);
  assert.match(panel, /role=\{failed \? "alert" : "status"\}/);
  assert.match(panel, /aria-atomic="true"/);
});

