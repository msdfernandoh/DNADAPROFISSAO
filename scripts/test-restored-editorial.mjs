import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {restoreHumanized,restoredPairs,restoredProfiles}=require('../.local-tests/journey/lib/questionnaire-engine/individual/editorial/restore-humanized.js');
const {buildRestoredReview,restoredReviewNames}=require('../.local-tests/journey/lib/questionnaire-engine/integration/restored-review-cases.js');
const original=require('../lib/questionnaire-engine/individual/pair-references.json');
for(const name of [...restoredReviewNames,...restoredPairs().map(p=>p.code)])test('Restoration: '+name,()=>{
 const {journey,careerPreference}=buildRestoredReview(name),before=JSON.stringify(journey),r=restoreHumanized(journey,careerPreference);
 assert.equal(JSON.stringify(journey),before,'No mutation of the official result');
 assert.equal(r.approval,'awaiting_carla');assert.deepEqual(r.scores,journey.analysis.scores);
 assert.equal(journey.analysis.evidence.length,15);
 if(name.includes('+'))assert.equal(journey.analysis.classification.pair,name);
 for(const sections of [r.participant,r.commercial]){
  assert.deepEqual(sections.map(s=>s.number),[1,2,3,4,5,6,7,8,9]);
  for(const s of sections){assert.ok(s.paragraphs.length);assert.ok(s.paragraphs.reduce((n,p)=>n+p.text.length,0)>70,'Substantive section '+s.number);
   for(const p of s.paragraphs){assert.ok(p.source);assert.ok(p.origin);assert.ok(p.evidenceRefs.every(id=>r.evidence.some(e=>e.id===id)));assert.doesNotMatch(p.text,/teste vocacional|productionReady|evidenceRefs|ruleId/i);}}
 }
 if(name==='Empate')assert.equal(r.pair,null);
 if(name==='Carreira pública')assert.match(r.participant[7].paragraphs.map(p=>p.text).join(' '),/Você informou interesse em carreira pública/);
});
test('Twenty literal ordered combinations with distinct supplements',()=>{
 const list=restoredPairs();assert.equal(list.length,20);assert.equal(new Set(list.map(p=>p.code)).size,20);
 assert.equal(new Set(list.map(p=>p.analogy)).size,20);assert.equal(new Set(list.map(p=>p.contradiction)).size,20);
 for(const p of list){assert.equal(p.text,original.find(o=>o.code===p.code).text);for(const key of ['displayTitle','scene','analogy','synergy','tension','contradiction','routine','attention','action'])assert.ok(p[key]?.length>20,key);}
});
test('Five profiles have scenes, relationships, learning and provenance',()=>{
 const profiles=restoredProfiles();assert.deepEqual(profiles.map(p=>p.code),['L','C','E','H','P']);for(const p of profiles){assert.equal(p.scenes.length,3);assert.ok(p.decisions&&p.relations&&p.learning&&p.original.analogy);}
});
test('Equal scores preserve different answer-based readings',()=>{
 const a=restoreHumanized(buildRestoredReview('Mesmos pontos A').journey),b=restoreHumanized(buildRestoredReview('Mesmos pontos B').journey);
 assert.deepEqual(a.scores,b.scores);assert.notDeepEqual(a.evidence,b.evidence);
 const changes=a.participant.filter((s,i)=>JSON.stringify(s.paragraphs.map(p=>p.text))!==JSON.stringify(b.participant[i].paragraphs.map(p=>p.text)));
 assert.ok(changes.length>=2,'Different answers must change at least two substantive sections');
});
test('The restored version cannot inherit approval through the public route',()=>{
 const page=readFileSync(new URL('../app/relatorio/[token]/page.tsx',import.meta.url),'utf8');assert.doesNotMatch(page,/restoreHumanized|restored-review/);assert.match(page,/participantReportByToken/);
 const review=readFileSync(new URL('../app/equipe/revisao-relatorios/page.tsx',import.meta.url),'utf8');assert.match(review,/currentIdentity/);assert.match(review,/institution_admin/);assert.match(review,/internalPreview/);
});
test('Main reading has no literal labels or technical provenance',()=>{
 for(const name of [...restoredReviewNames,...restoredPairs().map(p=>p.code)]){
  const r=restoreHumanized(buildRestoredReview(name).journey);
  const text=[...r.participant,...r.commercial].flatMap(s=>s.paragraphs.map(p=>p.text)).join(' ');
  assert.doesNotMatch(text,/obsessiv|perfeccionista|controlador|ansios[oa]|insegur[oa]|impulsiv[oa]|Q\d{2}|Texto recuperado|Texto novo|Texto adaptado|origem e evidências|\.md\b|\.json\b/i,name);
  assert.ok(r.evidence.every(e=>e.selectedText&&e.alternativeId),'Literal alternatives remain in restricted audit data');
 }
});
test('Ana and P+H share a purchase answer, not an identity narrative',()=>{
 const a=restoreHumanized(buildRestoredReview('Ana').journey),b=restoreHumanized(buildRestoredReview('P+H').journey);
 assert.equal(a.evidence.find(e=>e.questionId==='Q09').letter,b.evidence.find(e=>e.questionId==='Q09').letter);
 const changes=a.participant.filter((s,i)=>JSON.stringify(s.paragraphs.map(p=>p.text))!==JSON.stringify(b.participant[i].paragraphs.map(p=>p.text)));
 assert.ok(changes.length>=6);assert.match(b.participant[1].paragraphs[0].text,/não permite concluir/);
});
test('Original scenes require multiple matching answers; traces remain outside the report',()=>{
 for(const pair of restoredPairs()){
  const j=buildRestoredReview(pair.code).journey,r=restoreHumanized(j);
  if(r.audit.originalSceneSupported){assert.ok(Object.keys(r.audit.sceneConditions).length>=2);for(const [id,letter]of Object.entries(r.audit.sceneConditions))assert.equal(j.analysis.evidence.find(e=>e.questionId===id).letter,letter);}
 }
 const component=readFileSync(new URL('../components/questionnaire-report/EditorialDocument.tsx',import.meta.url),'utf8');assert.doesNotMatch(component,/p\.origin|p\.source|p\.evidenceRefs|provenance/);
 const route=readFileSync(new URL('../app/equipe/revisao-relatorios/page.tsx',import.meta.url),'utf8');assert.match(route,/<EditorialTracePanel report=/);
});
