import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReviewCase} from '../lib/questionnaire-engine/integration/review-cases';
import {prepareAtomicCompletion,executeAtomicCompletion,type StoredEvaluation} from '../lib/saas/completion-service';
import type {VerifiedIdentity} from '../lib/saas/identity';
const example=buildReviewCase('Ana');
const user:VerifiedIdentity={userId:'fictitious-participant',sessionId:'fictitious-session',displayName:'Fictício',globalOwner:false,institutionIds:[],memberships:[],grants:[]};
const stored:StoredEvaluation={scope:{participantId:example.scope.participantId,institutionId:example.scope.institutionId,institutionActive:true,unitId:'fictitious-unit',assignedUserId:null,participantUserId:user.userId,reportReleased:false,contentHomologated:false},questionnaireId:'fictitious-questionnaire',revision:example.analysis.revision,registration:example.registration,institutionName:'Instituição fictícia',unitName:'Unidade fictícia',units:[]};
const input={revision:stored.revision,answers:example.analysis.evidence.map(e=>({questionId:e.questionId,alternativeId:e.alternativeId}))};
test('P4 derives scores, snapshot, registration and assignment from server data',()=>{const c=prepareAtomicCompletion(input,user,stored);assert.deepEqual(c.scores,example.analysis.scores);assert.equal(c.actorId,user.userId);assert.equal(c.sessionId,user.sessionId);assert.equal(c.snapshot.registration.email,stored.registration.email);assert.equal(c.snapshot.delivery.effectiveRelease,'not_released');assert.equal(c.snapshot.readiness.productionReady,false);assert.equal(c.answers.length,15);});
for(const key of ['institutionId','unitId','responsible','scores','result','snapshot','role','eligibility','registration'])test('P4 rejects browser authority claim: '+key,()=>{assert.throws(()=>prepareAtomicCompletion({...input,[key]:'forged'},user,stored));});
test('P4 denies absent or revoked session, unrelated participant and inactive institution',()=>{assert.throws(()=>prepareAtomicCompletion(input,null,stored));assert.throws(()=>prepareAtomicCompletion(input,{...user,sessionId:undefined},stored));assert.throws(()=>prepareAtomicCompletion(input,{...user,userId:'other'},stored));assert.throws(()=>prepareAtomicCompletion(input,user,{...stored,scope:{...stored.scope,institutionActive:false}}));});
test('P4 rejects wrong revision incomplete duplicated and cross-question answers before RPC',()=>{for(const data of [{...input,revision:'wrong'},{...input,answers:input.answers.slice(1)},{...input,answers:[input.answers[0],...input.answers.slice(0,14)]},{...input,answers:[{...input.answers[0],alternativeId:input.answers[1].alternativeId},...input.answers.slice(1)]}])assert.throws(()=>prepareAtomicCompletion(data,user,stored));});
test('P4 makes one RPC call only and validates committed receipt',async()=>{const c=prepareAtomicCompletion(input,user,stored);let count=0;const result=await executeAtomicCompletion({async rpc(name,params){count++;assert.equal(name,'dna_complete_evaluation_v1');assert.equal(params.p_command,c);return{data:{state:'committed',snapshotKey:c.snapshotKey,debitId:'fictional-debit',replay:false},error:null};}},c);assert.equal(count,1);assert.equal(result.state,'committed');});
test('P4 no-credit receipt distinguishes saved answers from completion',async()=>{const c=prepareAtomicCompletion(input,user,stored);assert.deepEqual(await executeAtomicCompletion({async rpc(){return{data:{state:'no_credit',answersSaved:true},error:null}}},c),{state:'no_credit',answersSaved:true});});
for(const data of [null,{state:'committed'},{state:'committed',snapshotKey:'other',debitId:'id',replay:false},{state:'no_credit',answersSaved:false}])test('P4 invalid receipt never reports completion',async()=>{await assert.rejects(()=>executeAtomicCompletion({async rpc(){return{data,error:null}}},prepareAtomicCompletion(input,user,stored)));});
test('P4 RPC failure propagates without fallback writes or debit attempts',async()=>{let calls=0;await assert.rejects(()=>executeAtomicCompletion({async rpc(){calls++;return{data:null,error:{message:'database failure'}}}},prepareAtomicCompletion(input,user,stored)));assert.equal(calls,1);});

test('P4 frozen source pins all sixty alternatives without exposing scoring authority to the browser',()=>{
 const c=prepareAtomicCompletion(input,user,stored);
 assert.equal(c.revisionSourceHash,'2a1c84320d8994a2dc095dfc262d642d9c981bba38393f10ed1cb68aee97d7b2');
 assert.equal(c.snapshot.readiness.contentHomologated,false);
 assert.throws(()=>prepareAtomicCompletion({...input,revisionSourceHash:c.revisionSourceHash},user,stored));
});
