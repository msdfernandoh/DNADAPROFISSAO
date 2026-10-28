// Official-domain acceptance with one authorized fictional participant. No historic participant lookup.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{buildReviewCase}=require('../../.local-tests/journey/lib/questionnaire-engine/integration/review-cases.js');
let raw='';for await(const chunk of process.stdin)raw+=chunk;const secret=JSON.parse(raw);raw='';
const origin='https://www.dnadaprofissao.com.br',cookies=new Map();
async function request(path,method='GET',body){
 const response=await fetch(origin+path,{method,redirect:'manual',headers:{Origin:origin,Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 for(const header of response.headers.getSetCookie()){const pair=header.split(';')[0],index=pair.indexOf('=');cookies.set(pair.slice(0,index),pair.slice(index+1));}
 const type=response.headers.get('content-type')||'';const value=type.includes('json')?await response.json():await response.text();return {status:response.status,value};
}
const proof={date:new Date().toISOString(),origin,checks:[],participantId:null};const pass=label=>{proof.checks.push(label);console.log('PASS '+label);};
try{
 const login=await request('/api/v1/identity','POST',{email:'msdcarla@gmail.com',password:secret.password});secret.password='';assert.equal(login.status,200,JSON.stringify(login.value));pass('Carla authenticated on official domain');
 const fixture=buildReviewCase('Ana'),registration={...fixture.registration,name:'Validação piloto Sinop (fictícia)',email:'piloto-sinop@example.invalid',phone:'66999990000',city:'Sinop'};
 const created=await request('/api/v1/evaluations','POST',registration);assert.equal(created.status,201,JSON.stringify(created.value));const id=created.value.id;proof.participantId=id;pass('authorized fictional registration persisted');
 const answers=fixture.analysis.evidence.map(e=>({questionId:e.questionId,alternativeId:e.alternativeId})),revision=fixture.analysis.revision;
 const draft=await request('/api/v1/evaluations/'+id+'/draft','POST',{revision,answers:answers.slice(0,5)});assert.equal(draft.status,200,JSON.stringify(draft.value));assert.equal(draft.value.answerCount,5);pass('five answers saved before interruption');
 const resumed=await request('/equipe/avaliacoes/'+id);assert.equal(resumed.status,200);assert.ok(resumed.value.includes('Q05'));pass('interrupted evaluation reloads from official server');
 const done=await request('/api/v1/evaluations/'+id+'/complete','POST',{revision,answers});assert.equal(done.status,200,JSON.stringify(done.value));assert.equal(done.value.state,'committed');assert.equal(done.value.replay,false);proof.debitId=done.value.debitId;pass('fifteen answers completed atomically');
 const replay=await request('/api/v1/evaluations/'+id+'/complete','POST',{revision,answers});assert.equal(replay.status,200);assert.equal(replay.value.replay,true);assert.equal(replay.value.debitId,done.value.debitId);pass('repeat completion reuses the same debit');
 const result=await request('/equipe/avaliacoes/'+id);assert.equal(result.status,200);assert.ok(result.value.includes('Avaliação concluída'));pass('persisted completion survives reload');
 const report=await request('/equipe/avaliacoes/'+id+'/relatorios');assert.equal(report.status,200);assert.ok(report.value.includes('Relatório comercial'));pass('authorized team sees approved reports');
 const link=await request('/api/v1/evaluations/'+id+'/report-link','POST');assert.equal(link.status,200,JSON.stringify(link.value));assert.ok(link.value.url.startsWith(origin+'/relatorio/'));
 const participant=await fetch(link.value.url);assert.equal(participant.status,200);const html=await participant.text();assert.ok(html.includes('Suas forças nas respostas'));assert.ok(!html.includes('Exclusivo da equipe')&&!html.includes('Relatório comercial'));pass('private participant link excludes commercial content');
 await request('/api/v1/identity','DELETE');
 const denied=await request('/equipe/avaliacoes/'+id+'/relatorios');assert.equal(denied.status,404);pass('commercial report denied after logout');
 await writeFile('.local-tests/official-pilot-acceptance.json',JSON.stringify(proof,null,2));
 console.log(JSON.stringify({participantId:id,passed:proof.checks.length,debitId:proof.debitId}));
}finally{if(cookies.size)await request('/api/v1/identity','DELETE');}
