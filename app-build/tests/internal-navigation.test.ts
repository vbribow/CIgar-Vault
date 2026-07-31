import assert from "node:assert/strict";
import {readdirSync,readFileSync}from"node:fs";
import path from"node:path";
import test from"node:test";

const root=path.resolve(import.meta.dirname,"..");
function walk(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.name==="node_modules"?[]:entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)])}
const pages=walk(path.join(root,"app")).filter(file=>file.endsWith("/page.tsx"));
const routes=pages.map(file=>(file.slice(path.join(root,"app").length,-"/page.tsx".length)||"/").replace(/\/\([^/]+\)/g,""));
function matchesRoute(url:string){return routes.some(route=>{const expected=route.split("/"),actual=url.split("/");return expected.length===actual.length&&expected.every((part,index)=>/^\[.+\]$/.test(part)||part===actual[index])})}
test("every literal internal navigation link resolves to an application page",()=>{const files=[...walk(path.join(root,"app")),...walk(path.join(root,"components"))].filter(file=>file.endsWith(".tsx"));const missing:string[]=[];for(const file of files){const source=readFileSync(file,"utf8");for(const match of source.matchAll(/href\s*=\s*["'](\/[^"']*)["']/g)){const pathname=match[1].split(/[?#]/)[0]||"/";if(!pathname.startsWith("/api/")&&!matchesRoute(pathname))missing.push(`${path.relative(root,file)} → ${match[1]}`)}}assert.deepEqual(missing,[])});
test("Industry Hub history and protection cards lead to substantive guides",()=>{const industry=readFileSync(path.join(root,"app/industry/page.tsx"),"utf8");for(const href of ["/learn/release-chronology","/learn/habanos-authenticity"]){assert.match(industry,new RegExp(`href=[\"']${href}[\"']`));assert.equal(matchesRoute(href),true)}});
