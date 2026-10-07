import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {isPublicAppPath} from "../lib/public-path";

test("public account-entry and referral paths share one fail-safe definition",()=>{
  for(const path of ["/login","/recover","/auth/callback","/r/invite","/partners/join","/partners/invite/token","/industry/news","/learn/foundations"])assert.equal(isPublicAppPath(path),true,path);
  for(const path of ["/account","/inventory","/api/account/export","/partner-workspace"])assert.equal(isPublicAppPath(path),false,path);
});

test("email callbacks use the shared safe next parser and canonical production origin",()=>{
  for(const file of ["../app/auth/confirm/route.ts","../app/auth/callback/route.ts"]){
    const source=readFileSync(new URL(file,import.meta.url),"utf8");
    assert.match(source,/safeAuthNext\(url\.searchParams\.get\("next"\)\)/);
    assert.match(source,/appOrigin\(url\.origin/);
    assert.doesNotMatch(source,/requested\.startsWith/);
  }
});

test("protected-route redirects preserve only a safe internal path and query",()=>{
  const source=readFileSync(new URL("../lib/supabase/proxy.ts",import.meta.url),"utf8");
  assert.match(source,/safeAuthNext\(`\$\{request\.nextUrl\.pathname\}\$\{request\.nextUrl\.search\}`\)/);
  assert.match(source,/safeAuthNext\(request\.nextUrl\.searchParams\.get\("next"\)\)/);
});
