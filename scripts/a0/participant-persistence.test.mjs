import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(path,dependencies={},globals={}){const module={exports:{}};const code=ts.transpileModule(readFileSync(new URL('../../'+path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;runInNewContext(code,{Error,module,exports:module.exports,require(name){if(!Object.hasOwn(dependencies,name))throw Error('Dependency not mocked: '+name);return dependencies[name]},...globals});return module.exports;}
const id='00000000-0000-4000-8000-000000000001';
const good=()=>Response.json({success:true,data:{id}});
const failing=[['http400',()=>Response.json({error:'rejected'},{status:400})],['http500',()=>Response.json({error:'failure'},{status:500})],['invalidJson',()=>new Response('invalid')],['network',()=>{throw Error('network')}],['missingId',()=>Response.json({success:true,data:{}})],['falseSuccess',()=>Response.json({success:false,data:{id}})],['otherId',()=>Response.json({success:true,data:{id:'other'}})]];
for(const [name,response]of failing)test('no persistence success accepted: '+name,async()=>{const p=load('lib/questionnaire-platform/participant-persistence.ts',{}, {fetch:async()=>response()});await assert.rejects(()=>p.registerParticipant({name:'fictitious'}));await assert.rejects(()=>p.completeParticipant(id,{percentages:{A:1}}));});
test('confirmed creation and completion use POST then PATCH with same id',async()=>{const calls=[];const p=load('lib/questionnaire-platform/participant-persistence.ts',{}, {fetch:async(url,init)=>{calls.push([url,init]);return good()}});assert.equal(await p.registerParticipant({name:'fictitious'}),id);assert.equal(await p.completeParticipant(id,{id:'forged'}),id);assert.deepEqual(calls.map(c=>c[1].method),['POST','PATCH']);assert.equal(JSON.parse(calls[1][1].body).id,id);});
test('completion without id never makes fallback POST or any request',async()=>{let calls=0;const p=load('lib/questionnaire-platform/participant-persistence.ts',{}, {fetch:async()=>{calls++;return good()}});await assert.rejects(()=>p.completeParticipant(null,{}));assert.equal(calls,0);});
function hooks(initial={}){let index=0,refIndex=0;const values={...initial},refs={};return{values,reset(){index=0;refIndex=0},react:{useEffect(){},useMemo(fn){return fn()},useRef(initial){const i=refIndex++;return refs[i]??=( {current:initial} )},useState(initial){const i=index++;if(!(i in values))values[i]=initial;return[values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v}]}}};}
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function children(tree){if(!tree||typeof tree!=='object')return[];return[tree,...[tree.props?.children].flat(4).flatMap(children)];}
const data=load('lib/dna-data.ts');
function pageHarness(screen,fetcher){const h=hooks({0:screen,1:{name:'fictitious'},2:screen==='quiz'?id:null});const persistence=load('lib/questionnaire-platform/participant-persistence.ts',{}, {fetch:fetcher});const page=load('app/page.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/components/dna/landing':{Landing:'Landing'},'@/components/dna/registration':{Registration:'Registration'},'@/components/dna/quiz':{Quiz:'Quiz'},'@/components/dna/thank-you':{ThankYou:'ThankYou'},'@/lib/app-settings':{DEFAULT_DNA_RAPIDO_QUESTION_INDICES:[0]},'@/lib/vendor-utils':{normalizeVendorSlug:s=>s},'@/lib/questionnaire-platform/participant-persistence':persistence},{fetch:fetcher});return{h,render(){h.reset();return page.default()}};}
for(const [name,response]of failing)test('actual page stays on current screen after failure: '+name,async()=>{
 for(const screen of ['register','quiz']){const p=pageHarness(screen,async()=>response());const view=p.render();await assert.rejects(()=>view.props.onComplete(screen==='register'?{name:'x',phone:'00000000000',email:'x@example.invalid',city:'x',course:'',escolaridade:'ensino_medio_completo'}:{primary:'A',secondary:'B',pct:{A:60,B:40}},'completo'));assert.equal(p.h.values[0],screen);}
});
test('actual page advances only after matching persistence confirmation',async()=>{
 const form={name:'x',phone:'00000000000',email:'x@example.invalid',city:'x',course:'',escolaridade:'ensino_medio_completo'};
 const p=pageHarness('register',async()=>good());await p.render().props.onComplete(form,'completo');assert.equal(p.h.values[0],'quiz');assert.equal(p.h.values[2],id);
 const q=pageHarness('quiz',async()=>good());await q.render().props.onComplete({primary:'A',secondary:'B',pct:{A:60,B:40}});assert.equal(q.h.values[0],'thankyou');
});
test('registration retains form and clears pending state after failure; click can retry',async()=>{
 const h=hooks({0:{name:'Fictícia',phone:'00000000000',email:'x@example.invalid',course:'',escolaridade:'ensino_medio_completo'},1:'city',4:[{id:'city',name:'Sinop',state:'MT'}],5:true});
 const m=load('components/dna/registration.tsx',{'react':h.react,'react/jsx-runtime':jsx,'./logo':{Logo:'Logo'},'@/lib/dna-data':data,'@/lib/brazil-ufs':{BRAZIL_UFS:['MT']},'@/lib/city-utils':{CITY_SELECT_OTHER:'other',formatCityForParticipant:(n,s)=>n+' / '+s,formatCityLabel:(n,s)=>n+' / '+s}},{fetch:async()=>{throw Error('Unexpected effect')}});
 let calls=0;const props={onComplete:async()=>{calls++;if(calls===1)throw Error('synthetic failure')},dnaRapidoEnabled:false,settingsLoaded:true};
 h.reset();let tree=m.Registration(props);await children(tree).find(n=>n.type==='button').props.onClick();assert.equal(h.values[7],false);assert.equal(h.values[0].name,'Fictícia');assert.equal(h.values[6],'synthetic failure');
 h.reset();tree=m.Registration(props);await children(tree).find(n=>n.type==='button').props.onClick();assert.equal(calls,2);assert.equal(h.values[7],false);
});
test('quiz keeps answers and selection after save failure; retry uses same result',async()=>{
 const total=data.QUESTIONS.length;const prior=Object.fromEntries(Array.from({length:total-1},(_,i)=>[i,'A']));const h=hooks({0:total-1,1:prior,2:'A'});
 const m=load('components/dna/quiz.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/lib/dna-data':data,'@/lib/app-settings':{DEFAULT_DNA_RAPIDO_QUESTION_INDICES:[0],getQuickQuizStageInfo:()=>null}});
 const results=[];const props={onComplete:async r=>{results.push(JSON.stringify(r));if(results.length===1)throw Error('synthetic failure')}};
 h.reset();await children(m.Quiz(props)).find(n=>n.type==='button').props.onClick();assert.equal(h.values[0],total-1);assert.equal(Object.keys(h.values[1]).length,total);assert.equal(h.values[2],'A');assert.equal(h.values[3],false);assert.equal(h.values[4],'synthetic failure');
 h.reset();await children(m.Quiz(props)).find(n=>n.type==='button').props.onClick();assert.equal(results.length,2);assert.equal(results[0],results[1]);
});
test('pending quiz completion rejects duplicate click without a second request',async()=>{
 const total=data.QUESTIONS.length,h=hooks({0:total-1,1:Object.fromEntries(Array.from({length:total-1},(_,i)=>[i,'A'])),2:'A'});let finish,calls=0;
 const m=load('components/dna/quiz.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/lib/dna-data':data,'@/lib/app-settings':{DEFAULT_DNA_RAPIDO_QUESTION_INDICES:[0],getQuickQuizStageInfo:()=>null}});
 h.reset();const button=children(m.Quiz({onComplete:()=>{calls++;return new Promise(r=>{finish=r})}})).find(n=>n.type==='button');const first=button.props.onClick();await button.props.onClick();assert.equal(calls,1);finish();await first;
});

test('completion rejects another valid UUID returned by the server',async()=>{const p=load('lib/questionnaire-platform/participant-persistence.ts',{}, {fetch:async()=>Response.json({success:true,data:{id:'00000000-0000-4000-8000-000000000002'}})});await assert.rejects(()=>p.completeParticipant(id,{}));});
