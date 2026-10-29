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
function pageHarness(screen,fetcher){const h=hooks({0:{revision:'official',questions:Array.from({length:15},(_,i)=>({id:'Q'+(i+1)}))},1:'',2:true,3:screen==='quiz'?id:null,4:{}});let destination;const page=load('components/saas/PublicDnaJourney.tsx',{'react':h.react,'react/jsx-runtime':jsx,'next/link':{default:'Link'},'@/components/dna/registration':{Registration:'Registration'},'@/components/questionnaire-public/QuizV2':{QuizV2:'Quiz'}},{fetch:fetcher,sessionStorage:{setItem(){}},window:{location:{assign:value=>destination=value}}});return{h,location:()=>destination,render(){h.reset();return children(page.PublicDnaJourney()).find(n=>n.type===(h.values[3]?'Quiz':'Registration'));}};}
for(const [name,response]of failing)test('new participant flow stays on registration and quiz after persistence failure: '+name,async()=>{
 const p=pageHarness('register',async()=>response());await assert.rejects(()=>p.render().props.onComplete({name:'x',phone:'00000000000',email:'x@example.invalid',city:'x',course:'',escolaridade:'ensino_medio_completo'},'completo'));assert.equal(p.h.values[3],null);
 const q=pageHarness('quiz',async()=>response());await assert.rejects(()=>q.render().props.submitAnswers([]));assert.equal(q.h.values[3],id);assert.equal(q.location(),undefined);
});
test('new participant flow advances only after confirmed registration and stored result URL',async()=>{
 const form={name:'x',phone:'00000000000',email:'x@example.invalid',city:'x',course:'',escolaridade:'ensino_medio_completo'};
 const p=pageHarness('register',async()=>Response.json({id}));await p.render().props.onComplete(form,'completo');assert.equal(p.h.values[3],id);
 const q=pageHarness('quiz',async()=>Response.json({state:'committed',url:'/meu-dna/'+id}));assert.equal((await q.render().props.submitAnswers([])).state,'committed');assert.equal(q.location(),'/meu-dna/'+id);
});
test('no credit retains participant answers and never redirects to a fake result',async()=>{const q=pageHarness('quiz',async()=>Response.json({state:'no_credit',answersSaved:true}));assert.equal((await q.render().props.submitAnswers([])).state,'no_credit');assert.equal(q.location(),undefined);});
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
