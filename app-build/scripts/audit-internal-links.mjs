import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  }))).flat();
}

function routePattern(filePath) {
  const directory = path.dirname(filePath).slice("app".length).replaceAll("\\", "/");
  const route = directory === "" ? "/" : directory;
  return route.replace(/\[\.\.\.[^\]]+\]/g, "**").replace(/\[[^\]]+\]/g, "*");
}

function matchesRoute(pathname, pattern) {
  const escaped = pattern
    .split("/")
    .map(segment => segment === "**" ? ".*" : segment === "*" ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("/");
  return new RegExp(`^${escaped}$`).test(pathname);
}

function literalInternalLinks(source) {
  const links = [];
  const patterns = [
    /href\s*=\s*["'](\/(?!\/)[^"']*)["']/g,
    /href\s*=\s*\{\s*["'](\/(?!\/)[^"']*)["']\s*\}/g,
    /href\s*:\s*["'](\/(?!\/)[^"']*)["']/g,
    /router\.(?:push|replace)\(\s*["'](\/(?!\/)[^"']*)["']/g,
    /window\.location\.href\s*=\s*["'](\/(?!\/)[^"']*)["']/g,
    /window\.location\.(?:assign|replace)\(\s*["'](\/(?!\/)[^"']*)["']/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) links.push(match[1]);
  }
  return links;
}

const appFiles = await walk("app");
const routePatterns = appFiles.filter(file =>
  file.endsWith(`${path.sep}page.tsx`)
  || file === path.join("app", "page.tsx")
  || file.endsWith(`${path.sep}route.ts`)
).map(routePattern);
const sourceFiles = (await Promise.all(["app", "components", "lib"].map(walk))).flat().filter(file => /\.[jt]sx?$/.test(file));
const sources = new Map(await Promise.all(sourceFiles.map(async file => [file, await readFile(file, "utf8")])));
const staticIds = new Set();
for (const source of sources.values()) {
  for (const pattern of [/\bid\s*=\s*["']([^"']+)["']/g, /\bid\s*:\s*["']([^"']+)["']/g]) {
    let match;
    while ((match = pattern.exec(source))) staticIds.add(match[1]);
  }
}
const failures = [];

for (const file of sourceFiles) {
  const source = sources.get(file);
  for (const href of literalInternalLinks(source)) {
    const pathname = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    if (!routePatterns.some(pattern => matchesRoute(pathname, pattern))) {
      failures.push({ file, href, reason: "Missing route" });
      continue;
    }
    const fragment = href.includes("#") ? decodeURIComponent(href.slice(href.indexOf("#") + 1)) : "";
    if (fragment && !staticIds.has(fragment)) failures.push({ file, href, reason: "Missing anchor" });
  }
}

if (failures.length) {
  console.error(JSON.stringify({ routes: routePatterns.length, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Internal navigation audit passed: ${routePatterns.length} routes · ${sourceFiles.length} source files.`);
}
