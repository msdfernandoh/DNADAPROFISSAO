import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildReviewCase} from '../lib/questionnaire-engine/integration/review-cases';
import {profileDisplaySummary} from '../lib/questionnaire-engine/integration/profile-summary';
import {classifyIndividualScores} from '../lib/questionnaire-engine/individual/analyze-individual';
import {participantDraftPreview} from '../lib/questionnaire-engine/integration/journey';
import pairs from '../lib/questionnaire-engine/individual/pair-references.json';
test('Ana displays actual calculated main and secondary, not a personality or compatibility claim',()=>{
 const j=buildReviewCase('Ana'),before=JSON.stringify(j.analysis),p=profileDisplaySummary(j.analysis);
 assert.deepEqual(p.main,{code:'E',name:'Estratégico e Analítico',points:35});
 assert.deepEqual(p.secondary,{code:'L',name:'Liderança e Negócios',points:15});
 assert.equal(p.distribution.find(x=>x.code==='P')?.points,4);
 assert.equal(p.compatibilityPercentage,false);assert.equal(p.unit,'points');assert.equal(JSON.stringify(j.analysis),before);
});
for(const [name,state]of [['Empate_principal','tied_main'],['Empate_secundario','tied_secondary']] as const)test('display preserves '+state,()=>{
 const j=buildReviewCase(name),p=profileDisplaySummary(j.analysis);assert.equal(p.state,state);assert.equal(p.secondary,null);
 if(state==='tied_main'){assert.equal(p.main,null);assert(p.coPredominant.length>1)}else{assert(p.main);assert(p.secondaryTies.length>1)}
});
test('insufficient scores do not fabricate two predominant profiles',()=>{const scores={L:0,C:0,E:0,H:0,P:0};const p=profileDisplaySummary({scores,classification:classifyIndividualScores(scores)});assert.equal(p.state,'structurally_insufficient');assert.equal(p.main,null);assert.equal(p.secondary,null);});
test('display names match existing approved source labels for all ordered pairs',()=>{const p=profileDisplaySummary(buildReviewCase('Ana').analysis);for(const pair of pairs){const [a,b]=pair.code.split('+');assert.equal(pair.title,p.distribution.find(x=>x.code===a)!.name+' + '+p.distribution.find(x=>x.code===b)!.name);}});
test('same scores remain same display despite individual narrative differences',()=>{assert.deepEqual(profileDisplaySummary(buildReviewCase('Comparacao_A').analysis),profileDisplaySummary(buildReviewCase('Comparacao_B').analysis));});
test('private participant draft includes computed display without changing public release',()=>{const j=buildReviewCase('Ana');const p=participantDraftPreview(j,{id:'fictional-reviewer',active:true,role:'platform_owner',explicitGlobalOwner:true,institutionIds:[],unitIds:[]});assert.equal(p.profiles.main?.points,35);assert.equal(j.delivery.effectiveRelease,'not_released');assert.equal(j.readiness.contentHomologated,false);});
