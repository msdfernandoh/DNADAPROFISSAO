import {test}from'node:test';import assert from'node:assert/strict';import {readFileSync}from'node:fs';import{createRequire}from'node:module';import{runInNewContext}from'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(path,deps,env={}){const module={exports:{}};runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,process:{env},Request,Response,URL,Error,require(n){if(!Object.hasOwn(deps,n))throw Error('Blocked dependency '+n);return deps[n];}});return module.exports;}
const flags=load('lib/saas/flags.ts',{}),security=load('lib/saas/request-security.ts',{}),origin='https://example.invalid',id='00000000-0000-4000-8000-000000000001';
const http={privateReply:(v,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}}),async smallJson(r){try{const v=await r.json();return v&&typeof v==='object'&&!Array.isArray(v)?v:null}catch{return null}}};
function completion(env={},receipt={state:'committed',snapshotKey:'snapshot',debitId:'debit',replay:false},failure=false){let calls=0;return{api:load('app/api/v1/evaluations/[id]/complete/route.ts',{'@/lib/saas/http':http,'@/lib/saas/flags':flags,'@/lib/saas/request-security':security,'@/lib/saas/completion-server':{async completeStoredEvaluation(pid,input){calls++;assert.equal(pid,id);if(failure)throw Error('internal private detail');return receipt;}}},env),calls:()=>calls};}
const env={DNA_V1_ACCESS_ENABLED:'true',DNA_V1_COMPLETION_ENABLED:'true',DNA_APP_ORIGIN:origin},ctx={params:Promise.resolve({id})};
const request=(body={answers:[],revision:'revision'},o=origin)=>new Request(origin+'/api/v1/evaluations/'+id+'/complete',{method:'POST',headers:{Origin:o},body:JSON.stringify(body)});
test('completion needs both independent flags and cannot be activated by browser data',async()=>{for(const e of [{},{DNA_V1_ACCESS_ENABLED:'true'},{DNA_V1_COMPLETION_ENABLED:'true'}]){const r=completion(e);assert.equal((await r.api.POST(request({enabled:true}),ctx)).status,404);assert.equal(r.calls(),0);}});
test('completion origin blocked before server work',async()=>{const r=completion(env);assert.equal((await r.api.POST(request({},'https://foreign.invalid'),ctx)).status,403);assert.equal(r.calls(),0);});
for(const key of ['scores','institutionId','unitId','snapshot','registration','responsible','actorId','revisionSourceHash'])test('completion route rejects browser authority '+key,async()=>{const r=completion(env);assert.equal((await r.api.POST(request({answers:[],revision:'revision',[key]:'forged'}),ctx)).status,400);assert.equal(r.calls(),0);});
test('completion sends a receipt without reports or server snapshot',async()=>{const r=completion(env);const res=await r.api.POST(request(),ctx);assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'no-store');assert.deepEqual(await res.json(),{state:'committed',snapshotKey:'snapshot',debitId:'debit',replay:false});assert.equal(r.calls(),1);});
test('no credit never reports a successful completion',async()=>{const r=completion(env,{state:'no_credit',answersSaved:true});assert.equal((await r.api.POST(request(),ctx)).status,409);});
test('server failure does not leak internal details or claim persistence',async()=>{const r=completion(env,{},true);const res=await r.api.POST(request(),ctx);assert.equal(res.status,503);assert(!(await res.text()).includes('internal private detail'));});
test('draft preview defaults OFF and does not access the database',async()=>{for(const e of [{},env,{...env,DNA_V1_INTERNAL_PREVIEW_ENABLED:'true',DNA_V1_COMPLETION_ENABLED:'false'}]){let calls=0;const api=load('app/api/v1/evaluations/[id]/preview/route.ts',{'@/lib/saas/http':http,'@/lib/saas/flags':flags,'@/lib/saas/report-preview-server':{async previewStoredEvaluation(){calls++;return{}}}},e);assert.equal((await api.GET(new Request(origin),ctx)).status,404);assert.equal(calls,0);}});
test('enabled private preview remains explicitly a draft with inactive offers',async()=>{const api=load('app/api/v1/evaluations/[id]/preview/route.ts',{'@/lib/saas/http':http,'@/lib/saas/flags':flags,'@/lib/saas/report-preview-server':{async previewStoredEvaluation(){return{status:'draft_awaiting_homologation',offersActive:false}}}},{...env,DNA_V1_INTERNAL_PREVIEW_ENABLED:'true'});const res=await api.GET(new Request(origin),ctx);assert.equal(res.status,200);assert.deepEqual(await res.json(),{status:'draft_awaiting_homologation',offersActive:false});});

function backend(config={},envOverride=env){
 let services=0;
 const client={async rpc(){return{data:config.databaseAllowed??false,error:null}}};
 const identity={userId:id,sessionId:id,institutionIds:['sinop'],memberships:[],grants:[]};
 const server=load('lib/saas/completion-server.ts',{
 'server-only':{},
 '@/lib/supabase/individual-server':{async createClient(){return client}},
 '@/lib/supabase/service':{async createServiceClient(){services++;throw Error('service reached')}},
 './identity':{async loadVerifiedIdentity(){return config.identityDenied?null:identity}},
 './pilot':{pilotIdentity:i=>config.pilotDenied?null:i},
 './flags':flags,
 './completion-service':{prepareAtomicCompletion(){throw Error('not expected')},executeAtomicCompletion(){throw Error('not expected')}}
 },envOverride);
 return {server,services:()=>services};
}
test('server entry point also defaults OFF before creating privileged client',async()=>{const h=backend({},{});await assert.rejects(()=>h.server.completeStoredEvaluation(id,{}),/disabled/);assert.equal(h.services(),0);});
for(const config of [{identityDenied:true},{pilotDenied:true},{databaseAllowed:false}])test('privileged evaluation lookup blocked by current identity, pilot and database authorization '+JSON.stringify(config),async()=>{const h=backend(config);await assert.rejects(()=>h.server.completeStoredEvaluation(id,{}));assert.equal(h.services(),0);});
