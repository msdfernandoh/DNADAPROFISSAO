import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(path,deps){const module={exports:{}};runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,Request,Response,Uint8Array,TextDecoder,Error,console:{error(){}},require(n){if(!(n in deps))throw Error('Blocked '+n);return deps[n]}});return module.exports;}
const http=load('lib/saas/http.ts',{'next/server':{NextResponse:{json:(v,o)=>Response.json(v,o)}}});
const form={name:'Teste fictício',phone:'00000000000',email:'fixture@example.invalid',city:null,course_interest:null,escolaridade:'ensino_medio_completo',tipo_questionario:'completo',vendor_slug:null},id='00000000-0000-4000-8000-000000000001';
function harness(fail=false){
 const calls=[];
 const chain={insert(payload){calls.push(['insert',payload]);return chain},select(){return chain},async single(){return{data:fail?null:{id},error:fail?{message:'fixture failure'}:null}}};
 const route=load('app/api/participants/route.ts',{
  '@/lib/saas/http':http,
  'next/server':{NextResponse:{json:(v,o)=>Response.json(v,o)}},
  '@/lib/security/participant-session':{async setParticipantSession(...args){calls.push(['session',...args])},async ownsParticipant(){return false}},
  '@/lib/supabase/service':{async createServiceClient(){calls.push(['client']);return{from(table){calls.push(['table',table]);return chain}}}}
 });return{route,calls};
}
const req=body=>new Request('https://example.invalid/api/participants',{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)});
for(const key of ['primary_profile','secondary_profile','percentages','quiz_completed','quiz_completed_at','status','institution_id','unit_id','seller_id','role','id','__proto__'])test('registration rejects forged authority before DB: '+key,async()=>{const h=harness();assert.equal((await h.route.POST(req(JSON.stringify(form).slice(0,-1)+','+JSON.stringify(key)+':true}'))).status,400);assert.deepEqual(h.calls,[])});
for(const value of [null,[],{},'invalid json',{...form,name:{}},{...form,email:2},{...form,phone:''},{...form,city:{}},{...form,name:'x'.repeat(251)},'x'.repeat(9000)])test('malformed registration is rejected without DB access',async()=>{const h=harness();assert.equal((await h.route.POST(req(value))).status,400);assert.deepEqual(h.calls,[])});
test('existing registration creates only unfinished row and participant-bound session',async()=>{for(const type of ['completo','rapido']){const h=harness(),r=await h.route.POST(req({...form,tipo_questionario:type}));assert.equal(r.status,200);const payload=h.calls.find(c=>c[0]==='insert')[1];assert.equal(payload.quiz_completed,false);assert.equal(payload.status,'Aguardando teste');assert.equal(payload.tipo_questionario,type);assert(!('percentages' in payload));assert(!('primary_profile' in payload));assert.deepEqual(h.calls.at(-1),['session',id,'v1']);}});
test('failed registration never creates participant session or reports success',async()=>{const h=harness(true);assert.equal((await h.route.POST(req(form))).status,500);assert(!h.calls.some(c=>c[0]==='session'));});
