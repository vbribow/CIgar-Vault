import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import robots from "../app/robots";
import {
  cedrivaOrganizationJsonLd,
  learningCollectionJsonLd,
  publicPageMetadata,
  publicStaticPages,
} from "../lib/seo";
import { brand } from "../lib/brand";

test("private application pages default to noindex while public metadata opts in explicitly", () => {
  const rootLayout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(rootLayout, /robots:\{index:false,follow:false\}/);

  const publicMetadata = publicPageMetadata("Example", "Description", "/learn/example");
  assert.deepEqual(publicMetadata.alternates, { canonical: "/learn/example" });
  assert.equal(publicMetadata.robots && typeof publicMetadata.robots !== "string" ? publicMetadata.robots.index : undefined, !brand.isPreview);
  assert.equal(publicMetadata.robots && typeof publicMetadata.robots !== "string" ? publicMetadata.robots.follow : undefined, !brand.isPreview);
});

test("robots and sitemap expose knowledge while protecting collector workflows", () => {
  const rules = robots();
  const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
  assert.ok(rule);
  if (brand.isPreview) {
    assert.equal(rule.disallow, "/");
    return;
  }
  assert.ok(Array.isArray(rule.allow) && rule.allow.includes("/learn"));
  assert.ok(Array.isArray(rule.allow) && rule.allow.includes("/industry"));
  assert.ok(Array.isArray(rule.disallow) && rule.disallow.includes("/inventory"));
  assert.ok(Array.isArray(rule.disallow) && rule.disallow.includes("/api/"));

  const paths = publicStaticPages.map((page) => page.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.includes("/manifesto"));
  assert.ok(paths.includes("/learn/seed-to-smoke"));
  assert.ok(paths.includes("/industry/registry"));
  assert.ok(!paths.some((path) => path.startsWith("/inventory")));

  const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /robots\.txt\|sitemap\.xml/);
});

test("structured data describes only visible Cedriva organization and learning content", () => {
  const organization = cedrivaOrganizationJsonLd();
  assert.equal(organization["@context"], "https://schema.org");
  assert.deepEqual(organization["@graph"].map((item) => item["@type"]), ["Organization", "WebSite"]);

  const learning = learningCollectionJsonLd();
  assert.equal(learning["@type"], "CollectionPage");
  assert.ok(learning.hasPart.length >= 7);
  assert.ok(learning.hasPart.every((item) => item.url.startsWith("https://")));
});
