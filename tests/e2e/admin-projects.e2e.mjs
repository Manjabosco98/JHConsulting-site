// Retired module regression. Read-only; no login, new users or database writes.
import assert from "node:assert/strict";
const base=process.env.E2E_BASE_URL??"http://127.0.0.1:4173";
for(const path of ["/admin/projetos","/admin/projetos/novo","/admin/projetos/qualquer-id"]){
  const response=await fetch(base+path,{redirect:"manual"});
  assert.equal(response.status,307,path);
  assert.equal(new URL(response.headers.get("location"),base).pathname,"/admin",path);
  console.log("PASS",path,"redirects to the overview");
}
const anon=await fetch(base+"/admin",{redirect:"manual"});
assert.equal(anon.status,307);
assert.equal(new URL(anon.headers.get("location"),base).pathname,"/admin/login");
console.log("PASS anonymous overview remains protected");
