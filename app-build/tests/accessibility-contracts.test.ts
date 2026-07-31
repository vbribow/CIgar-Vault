import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("every route receives a keyboard skip link and focusable content target", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");
  assert.match(layout, /className="skipLink" href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(styles, /\.skipLink:focus\{transform:translateY\(0\)\}/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test("critical Vault and Account file or text controls have explicit accessible names", () => {
  const intake = readFileSync(new URL("../components/photo-inventory-intake.tsx", import.meta.url), "utf8");
  const fileImport = readFileSync(new URL("../components/inventory-file-import.tsx", import.meta.url), "utf8");
  assert.match(intake, /aria-label="Describe the cigar or collection to identify"/);
  assert.match(fileImport, /aria-label="Choose CSV or XLSX inventory file"/);
});

test("core text and control palette pairs meet WCAG AA normal-text contrast", () => {
  const styles = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");
  const explorerStyles = readFileSync(new URL("../app/discover/guided-explorer.css", import.meta.url), "utf8");
  const catalogStyles = readFileSync(new URL("../app/collection-catalog/catalog.css", import.meta.url), "utf8");
  const blendingStyles = readFileSync(new URL("../app/learn/blending/blending.css", import.meta.url), "utf8");
  const notificationStyles = readFileSync(new URL("../app/notifications/notifications.css", import.meta.url), "utf8");
  const luminance = (hex: string) => {
    const channels = hex.match(/\w\w/g)!.map(value => Number.parseInt(value, 16) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const contrast = (foreground: string, background: string) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const pairs = [
    ["ivory on background", "#f2ece3", "#0f0d0b"],
    ["muted on background", "#aaa096", "#0f0d0b"],
    ["muted on panel", "#aaa096", "#1a1613"],
    ["gold on background", "#dfc18b", "#0f0d0b"],
    ["success on background", "#76b88a", "#0f0d0b"],
    ["danger on background", "#d98378", "#0f0d0b"],
    ["button text on brass", "#17100a", "#c09a5b"],
    ["Hojavía button text on live copper", "#17100a", "#b66a43"],
    ["Hojavía readable copper on green body", "#d2916c", "#102c29"],
    ["Hojavía readable copper on guide gradient", "#d2916c", "#1d1713"],
    ["guided-explorer inactive progress on lightest gradient stop", "#c9c1b2", "#382414"],
    ["image caption over a worst-case white image through its overlay", "#f1e5d6", "#343130"],
    ["collection monogram over its brightest composited accent", "#f5f1e8", "#362b11"],
    ["blending-process arrow on maduro panel", "#d2916c", "#0d0907"],
    ["notification timestamp on lightest gradient stop", "#c9c1b2", "#251b15"],
  ] as const;
  for (const [name, foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${name} must remain at least 4.5:1`);
  }
  assert.match(styles, /--accent-text:#d2916c/);
  assert.match(styles, /html\[data-brand="hojavia"\] \.button\{[^}]*color:#17100a/);
  assert.match(styles, /\.workspaceGuide span\{color:var\(--accent-text\)/);
  assert.match(styles, /\.textLink:is\(button\)\{border:0;background:transparent/);
  assert.match(explorerStyles, /\.explorerProgress span\{[^}]*color:var\(--muted\)/);
  assert.match(catalogStyles, /\.templateMonogram\{position:relative;[^}]*background:#130f0c/);
  assert.match(catalogStyles, /\.templateMonogram:before\{[^}]*opacity:\.18/);
  assert.match(blendingStyles, /\.maduroProcess i\{color:var\(--accent-text\)\}/);
  assert.match(notificationStyles, /\.notificationItem>div:nth-child\(2\)>small\{color:var\(--muted\)\}/);
});
