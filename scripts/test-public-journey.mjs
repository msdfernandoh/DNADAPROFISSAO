import {test} from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
const {buildRestoredReview,restoredReviewNames}=require('../.local-tests/journey/lib/questionnaire-engine/integration/restored-review-cases.js');
const {createJourney,INTEGRATED_REVISION}=require('../.local-tests/journey/lib/questionnaire-engine/integration/journey.js');
const {composePublishedEditorial,verifyPublishedEditorial,publishedParticipantReport,PUBLIC_EDITION}=require('../.local-tests/journey/lib/saas/published-editorial.js');
for(const name of restoredReviewNames)test('Published projection: '+name,()=>{
 const j=buildRestoredReview(name).journey,before=JSON.stringify(j),publication=composePublishedEditorial(j),delivered={...j,publication};
 assert.equal(JSON.stringify(j),before);assert.equal(publication.participant.length,9);assert.equal(publication.commercial.length,9);
 assert.equal(verifyPublishedEditorial(delivered,PUBLIC_EDITION).version,PUBLIC_EDITION);
 const publicReport=publishedParticipantReport(delivered,PUBLIC_EDITION),json=JSON.stringify(publicReport);assert.doesNotMatch(json,/evidenceRefs|selectedText|whatsapp|actorId|audit|comercial|Q\d{2}/i);
 assert.equal(publicReport.profiles.compatibilityPercentage,false);assert.deepEqual(publication.courses,[]);
 assert.match(publication.commercial[3].paragraphs.join(' '),/Nenhum curso foi apresentado/);
});
test('Exactly the same declared and eligible courses appear for both audiences',()=>{
 const base=buildRestoredReview('Ana').journey;
 const j=createJourney({revision:INTEGRATED_REVISION,registration:{...base.registration,escolaridade:'ensino_medio_completo',orientationMode:'area_undecided',declaredArea:'tecnologia'},answers:base.analysis.evidence.map(e=>({questionId:e.questionId,alternativeId:e.alternativeId}))},{scope:base.scope,institutionName:'UniFECAF Sinop',release:'released',reading:'unknown'});
 const p=composePublishedEditorial(j);assert.ok(p.courses.length>=2);
 for(const c of p.courses){assert.ok(p.participant[7].paragraphs.some(t=>t.includes(c.name)));assert.ok(p.commercial[5].paragraphs.some(t=>t.includes(c.name)));assert.ok(p.commercial[3].paragraphs.some(t=>t.includes(c.name)));}
 assert.deepEqual(p.courses.map(c=>c.id),j.orientation.exploratoryCourses.map(c=>c.courseId));assert.match(p.commercial[7].paragraphs[0],/identificação.*reflexão.*escolha.*profissão.*condições.*matrícula/);
});
test('Published edition and content cannot be replaced by a query flag or modified paragraph',()=>{
 const j=buildRestoredReview('Ana').journey,p=composePublishedEditorial(j);assert.throws(()=>verifyPublishedEditorial({...j,publication:p},'unapproved'));
 const changed=structuredClone(p);changed.participant[0].paragraphs[0]='Modified';assert.throws(()=>verifyPublishedEditorial({...j,publication:changed},PUBLIC_EDITION));
});
test('Release approval hash matches the actual restored source files',()=>{
 const edition=JSON.parse(readFileSync('lib/saas/published-edition.json','utf8'));const hash=createHash('sha256').update(edition.files.map(f=>readFileSync(f,'utf8').replace(/\r\n/g,'\n')).join('\n')).digest('hex');assert.equal(hash,edition.sourceHash);
});
function serverHarness(owns=false){let serviceReads=0;const module={exports:{}};const code=ts.transpileModule(readFileSync('lib/saas/public-journey-server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const deps={'server-only':{},'@/lib/security/participant-session':{ownsParticipant:async()=>owns},'@/lib/supabase/service':{createServiceClient:async()=>{serviceReads++;throw Error('Unexpected service read');}},'../questionnaire-engine/integration/journey':require('../.local-tests/journey/lib/questionnaire-engine/integration/journey.js'),'../questionnaire-engine/integration/frozen-revision':{},'./published-editorial':{}};
 runInNewContext(code,{module,exports:module.exports,require(name){if(!(name in deps))throw Error('Unexpected '+name);return deps[name];}});return {api:module.exports,reads:()=>serviceReads};}
test('Foreign participant ID is refused before service lookup',async()=>{const h=serverHarness();await assert.rejects(()=>h.api.loadOwnPublicEvaluation('00000000-0000-4000-8000-000000000001'));assert.equal(h.reads(),0);});
test('Public adapter accepts only fifteen distinct frozen answers, never scores or attribution',()=>{
 const h=serverHarness(),answers=buildRestoredReview('Ana').journey.analysis.evidence.map(e=>({questionId:e.questionId,alternativeId:e.alternativeId})),data={revision:INTEGRATED_REVISION,answers};assert.equal(h.api.validatePublicAnswers(data).length,15);assert.equal(h.api.validatePublicAnswers({...data,answers:answers.slice(0,5)},true).length,5);
 for(const bad of [{...data,scores:{L:99}},{...data,institutionId:'other'},{...data,answers:answers.slice(0,14)},{...data,answers:[answers[0],...answers.slice(0,14)]},{...data,answers:[{...answers[0],alternativeId:'Q01:Z'},...answers.slice(1)]}])assert.throws(()=>h.api.validatePublicAnswers(bad));
});
test('Main participant entry does not import the legacy 24-question registration/quiz/result flow',()=>{
 const home=readFileSync('app/page.tsx','utf8');assert.match(home,/\/dna/);assert.doesNotMatch(home,/components\/dna\/(quiz|registration|thank-you)|registerParticipant|completeParticipant/);
 const landing=readFileSync('components/dna/landing.tsx','utf8');assert.match(landing,/15 situações/);assert.doesNotMatch(landing,/24 perguntas/);
 const funnel=readFileSync('components/saas/PublicDnaJourney.tsx','utf8');assert.match(funnel,/QuizV2/);assert.match(funnel,/\/api\/dna/);assert.doesNotMatch(funnel,/percentages|\/resultado/);
});
