import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file,deps={},globals={}){const module={exports:{}};runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,process:{env:{NODE_ENV:'production'}},Headers,...globals,require(id){if(!(id in deps))throw Error('Unexpected dependency '+id);return deps[id];}});return module.exports;}
const persistence=load('lib/saas/session-persistence.ts');
for(const remember of [true,false])test('Auth cookie lifetime follows remember='+remember,()=>{
 const original={maxAge:40000000,expires:new Date(2030,1,1),httpOnly:true,secure:true,sameSite:'lax',path:'/'};
 const options=persistence.sessionCookieOptions(original,remember);assert.equal(options.maxAge,remember?2592000:undefined);assert.equal(options.expires,undefined);assert.equal(options.httpOnly,true);assert.equal(options.secure,true);assert.equal(options.sameSite,'lax');assert.equal(original.maxAge,40000000);
 const deletion={...original,maxAge:0};assert.equal(persistence.sessionCookieOptions(deletion,remember),deletion);
});
for(const remember of [true,false])test('Login persists preference and applies it to every cookie chunk: '+remember,async()=>{
 let config;const writes=[];
 const api=load('lib/supabase/individual-server.ts',{'server-only':{},'../saas/session-persistence':persistence,'next/headers':{cookies:async()=>({getAll:()=>[],set:(...args)=>writes.push(args)})},'@supabase/ssr':{createServerClient(url,key,c){config=c;return{};}}});
 await api.createClient({remember});config.cookies.setAll([0,1].map(i=>({name:'dna-saas-auth.'+i,value:'fictional',options:{maxAge:40000000,httpOnly:true,secure:true}})));
 for(const write of writes.filter(w=>w[0].startsWith('dna-saas-auth')))assert.equal(write[2].maxAge,remember?2592000:undefined);
 const pref=writes.find(w=>w[0]===persistence.REMEMBER_COOKIE);assert.equal(pref[1],remember?'1':'0');assert.equal(pref[2].httpOnly,true);assert.equal(pref[2].secure,true);
});
for(const remember of [true,false])test('Proxy refresh respects saved session lifetime: '+remember,async()=>{
 let config;const writes=[];
 const proxy=load('proxy.ts',{'./lib/saas/session-persistence':persistence,'./lib/saas/flags':{v1Flags:()=>({individualAccess:true})},'next/server':{NextResponse:{next:()=>({headers:new Headers(),cookies:{set:(...args)=>writes.push(args)}})}},'@supabase/ssr':{createServerClient(url,key,c){config=c;return{auth:{async getUser(){config.cookies.setAll([{name:'dna-saas-auth',value:'refreshed-fictional',options:{maxAge:40000000,httpOnly:true,secure:true}}]);}}};}}});
 const response=await proxy.proxy({cookies:{getAll:()=>[{name:persistence.REMEMBER_COOKIE,value:remember?'1':'0'}],set(){}}});assert.equal(writes[0][2].maxAge,remember?2592000:undefined);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const nodes=t=>!t||typeof t!=='object'?[]:[t,...[t.props?.children].flat(5).flatMap(nodes)];
test('Password visibility toggles and remember is submitted without storing the password',async()=>{
 let i=0,payload,location;const state=[];
 const api=load('components/saas/IndividualAccess.tsx',{'react':{useState(v){const index=i++;if(!(index in state))state[index]=v;return[state[index],next=>state[index]=typeof next==='function'?next(state[index]):next];}},'@/lib/dna-data':{G:{}},'./individual-access.module.css':{default:new Proxy({},{get:(_,k)=>k})},'react/jsx-runtime':jsx},{FormData:class{get(key){return{email:' fictional@example.invalid ',password:'fictional',remember:'on'}[key];}},fetch:async(url,options)=>{payload=JSON.parse(options.body);return{ok:true};},window:{location:{assign:path=>location=path}}});
 const render=()=>{i=0;return api.IndividualAccess({});};let tree=render();assert.equal(nodes(tree).find(n=>n.props?.name==='password').props.type,'password');
 const toggle=nodes(tree).find(n=>n.props?.children==='Mostrar senha');assert.equal(toggle.props.type,'button');toggle.props.onClick();tree=render();assert.equal(nodes(tree).find(n=>n.props?.name==='password').props.type,'text');assert.ok(nodes(tree).find(n=>n.props?.children==='Ocultar senha'));assert.equal(nodes(tree).find(n=>n.props?.name==='remember').props.type,'checkbox');
 await tree.props.onSubmit({preventDefault(){},currentTarget:{}});assert.equal(payload.email,'fictional@example.invalid');assert.equal(payload.remember,true);assert.equal(location,'/equipe');
});
test('Input contrast and autofill keep visible text and field boundaries',()=>{
 const css=readFileSync('components/saas/individual-access.module.css','utf8');
 const luminance=hex=>{const a=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 assert.ok(contrast('f5f7ff','151b2d')>4.5);assert.ok(contrast('909bb9','151b2d')>3);assert.match(css,/-webkit-text-fill-color:#f5f7ff!important/);assert.match(css,/border:1px solid #909bb9/);
});
