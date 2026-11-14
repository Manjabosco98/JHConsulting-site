import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

test("admin navigation: portfolio removed; technical registry separated from daily work", () => {
  const { isActiveNav, adminNavItems, adminTechnicalNavItems } = loadTs("src/lib/admin/navigation.ts");
  assert.deepEqual(plain(adminNavItems), [
    {href:"/admin",label:"Visão geral"}, {href:"/admin/contatos",label:"Contatos"},
    {href:"/admin/servicos",label:"Serviços"}, {href:"/admin/configuracoes",label:"Configurações"}
  ]);
  assert.deepEqual(plain(adminTechnicalNavItems), [{href:"/admin/tecnologias",label:"Tecnologias"}]);
  assert.equal(isActiveNav("/admin/servicos/novo", "/admin/servicos"), true);
  assert.equal(isActiveNav("/admin/servicos-antigos", "/admin/servicos"), false);
  assert.equal(isActiveNav("/admin/servicos", "/admin"), false);
});

const counts = { total:1218, NEW:1201, CONTACTED:7, NEGOTIATING:3, CONVERTED:5, ARCHIVED:2 };
const services = Array.from({length:8}, (_,i)=>({id:"s"+i,title:"Serviço "+i,active:i<7,updated_at:"2026-01-01T10:00:00Z"}));
const recentQuery = "contacts select(id, name, company, project_type, status, created_at) status not in (CONVERTED,ARCHIVED) order created_at desc limit 5";
function respond(overrides={}) {
  return (key)=>{
    if(key in overrides) return overrides[key];
    if(key.startsWith("services select")) return {data:services,error:null};
    if(key==="contacts count") return {count:counts.total,error:null};
    if(key.startsWith("contacts count status=")) return {count:counts[key.split("=")[1]],error:null};
    if(key===recentQuery) return {data:[{id:"c1",name:"Ana",company:"",project_type:"Automação",status:"NEW",created_at:"2026-01-01T10:00:00Z"}],error:null};
    if(key.startsWith("site_settings")) return {data:{email:"comercial@example.com",whatsapp:null},error:null};
    throw new Error("Consulta indevida: "+key);
  };
}
const loadDashboard=()=>loadTs("src/lib/repositories/dashboard.ts");

test("overview counts every status exactly beyond the API row limit and never reads projects", async()=>{
  const db=fakeDb(respond());
  const data=plain(await loadDashboard().getDashboardData(db));
  assert.deepEqual(data.contacts,counts);
  assert.deepEqual(data.services,{total:8,active:7});
  assert.equal(data.recentContacts[0].name,"Ana");
  assert.equal(data.recentServices.length,4);
  assert.equal("projects" in data,false);
  assert.equal("recentProjects" in data,false);
  assert.ok(db.log.every(key=>!key.startsWith("projects ")&&!key.startsWith("technologies ")));
  assert.ok(db.log.includes(recentQuery),"converted and archived contacts must not appear in the follow-up queue");
});

test("overview handles empty catalog, no open contacts and missing commercial settings", async()=>{
  const data=plain(await loadDashboard().getDashboardData(fakeDb(respond({
    "services select(id, title, active, updated_at) order display_order asc order created_at desc":{data:null,error:null},
    [recentQuery]:{data:null,error:null},
    "site_settings select(email, whatsapp) single":{data:null,error:null}
  }))));
  assert.deepEqual(data.services,{total:0,active:0});
  assert.deepEqual(data.recentServices,[]);
  assert.deepEqual(data.recentContacts,[]);
  assert.equal(data.missingSettings,null);
  const withRow=await loadDashboard().getDashboardData(fakeDb(respond()));
  assert.deepEqual(plain(withRow.missingSettings),["WhatsApp"]);
});

test("overview failures keep database details out of the interface", async(t)=>{
  const logged=t.mock.method(console,"error",()=>{});
  await assert.rejects(loadDashboard().getDashboardData(fakeDb(respond({
    "services select(id, title, active, updated_at) order display_order asc order created_at desc":{data:null,error:{message:"relation secret_table"}}
  }))),error=>error.message==="Não foi possível carregar o painel."&&!error.message.includes("secret"));
  assert.match(logged.mock.calls[0].arguments[0],/secret_table/);
});
