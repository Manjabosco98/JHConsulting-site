import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./helpers/load-ts.mjs";

const jsx={"react/jsx-runtime":{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}};
const icons={"lucide-react":new Proxy({},{get:(_target,key)=>key})};
function nodes(node){
  if(!node||typeof node!=="object")return [];
  if(Array.isArray(node))return node.flatMap(nodes);
  if(typeof node.type==="function")return nodes(node.type(node.props));
  return [node,...nodes(node.props?.children)];
}
const fixture={
  services:{total:4,active:3},
  contacts:{total:15,NEW:7,CONTACTED:2,NEGOTIATING:1,CONVERTED:3,ARCHIVED:2},
  recentContacts:[],recentServices:[],missingSettings:[]
};
test("overview shows business actions and useful empty states without a project link",async()=>{
  const module=loadTs("src/app/admin/(painel)/page.tsx",{mocks:{
    ...jsx,...icons,"next/link":{default:({children,...props})=>({type:"a",props:{...props,children}})},
    "@/lib/auth/admin":{requireAdminWith:async value=>value},
    "@/lib/supabase/server":{createClient:async()=>({})},
    "@/lib/repositories/dashboard":{getDashboardData:async()=>fixture}
  }});
  const tree=await module.default();
  const rendered=nodes(tree);
  const links=rendered.filter(n=>n.type==="a").map(n=>n.props.href);
  assert.ok(links.includes("/admin/contatos?status=NEW"));
  assert.ok(links.includes("/admin/servicos/novo"));
  assert.ok(links.includes("/admin/configuracoes"));
  assert.ok(links.every(href=>!href.includes("projetos")));
  assert.ok(JSON.stringify(tree).includes("Nenhum atendimento em aberto."));
});

const fields=["company_name","professional_name","role","description","bio","email","phone","whatsapp","linkedin_url","github_url","instagram_url","location","service_area"];
function settings(errors={}){
  return loadTs("src/components/admin/settings/SettingsForm.tsx",{mocks:{
    ...jsx,...icons,react:{useActionState:()=>[{fieldErrors:errors,status:"idle",message:null},()=>{},false],useState:initial=>[initial,()=>{}]}
  }}).SettingsForm({action:()=>{},initialValues:Object.fromEntries(fields.map(name=>[name,"original-"+name]))});
}
test("collapsed legacy fields retain every original value in the same settings form",()=>{
  const all=nodes(settings());
  const inputs=all.filter(n=>["input","textarea"].includes(n.type));
  assert.deepEqual(inputs.map(n=>n.props.name).sort(),fields.toSorted());
  for(const node of inputs)assert.equal(node.props.value,"original-"+node.props.name);
  assert.ok(all.filter(n=>n.type==="details").every(n=>!n.props.open));
});
test("validation errors reveal collapsed legacy fields so they can be corrected",()=>{
  const details=nodes(settings({professional_name:"Informe o responsável.",github_url:"URL inválida."})).filter(n=>n.type==="details");
  assert.equal(details.length,2);
  assert.ok(details.every(n=>n.props.open===true));
});
