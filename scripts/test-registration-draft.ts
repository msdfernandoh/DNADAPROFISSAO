import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareRegistrationDraft,type RegistrationDraftContext} from '../lib/saas/registration-draft';
import {buildReviewCase} from '../lib/questionnaire-engine/integration/review-cases';
import {frozenRevision} from '../lib/questionnaire-engine/integration/frozen-revision';
import type {VerifiedIdentity} from '../lib/saas/identity';
const example=buildReviewCase('Ana'),revision=frozenRevision();
const identity:VerifiedIdentity={userId:'fixture-manager',sessionId:'fixture-session',displayName:'Fixture',globalOwner:false,institutionIds:['sinop'],memberships:[{id:'member',institution_id:'sinop',user_id:'fixture-manager',role_code:'unit_manager',active:true,scope_pending:false}],grants:[{membership_id:'member',institution_id:'sinop',resource:'lead',action:'create',scope_type:'institution',allowed:true}]};
const context:RegistrationDraftContext={scope:{participantId:'server-generated',institutionId:'sinop',institutionActive:true,unitId:'unit',assignedUserId:null,participantUserId:null,reportReleased:false,contentHomologated:false},unitActive:true,units:[{membershipId:'member',institutionId:'sinop',unitId:'unit',active:true}],revision:{revision:revision.revision,sourceHash:revision.sourceHash,questionnaireId:'stored-questionnaire'}};
test('registration binds server scope and frozen revision without completion or content release',()=>{
 const before=JSON.stringify({identity,context,input:example.registration});const draft=prepareRegistrationDraft(example.registration,identity,context);
 assert.equal(draft.institution_id,'sinop');assert.equal(draft.unit_id,'unit');assert.equal(draft.questionnaire_id,'stored-questionnaire');assert.equal(draft.v1_revision,revision.revision);assert.equal(draft.revisionSourceHash,revision.sourceHash);
 assert.equal(draft.quiz_completed,false);assert.equal(draft.report_released,false);assert.equal(draft.content_homologated,false);assert.equal(draft.assigned_user_id,null);assert.equal(draft.v1_registration.course_interest,null);assert.equal(draft.v1_registration.escolaridade,null);assert(Object.isFrozen(draft));assert(Object.isFrozen(draft.v1_registration));assert(!('credits' in draft));assert(!('scores' in draft));assert.equal(JSON.stringify({identity,context,input:example.registration}),before);
});
for(const key of ['institution_id','unit_id','assigned_user_id','participant_user_id','questionnaire_id','v1_revision','revisionSourceHash','scores','quiz_completed','report_released'])test('registration rejects browser claim '+key,()=>{assert.throws(()=>prepareRegistrationDraft({...example.registration,[key]:'forged'},identity,context));});
test('registration denies missing session, seller create, revoked and foreign scope',()=>{
 for(const user of [null,{...identity,sessionId:undefined},{...identity,memberships:identity.memberships.map(m=>({...m,role_code:'seller' as const}))},{...identity,memberships:identity.memberships.map(m=>({...m,active:false}))},{...identity,institutionIds:['other']},{...identity,grants:identity.grants.map(g=>({...g,allowed:false}))}])assert.throws(()=>prepareRegistrationDraft(example.registration,user,context));
});
test('registration denies inactive, unassigned unit and mismatched frozen mapping',()=>{
 for(const c of [{...context,unitActive:false},{...context,units:[]},{...context,scope:{...context.scope,institutionActive:false}},{...context,revision:{...context.revision,sourceHash:'wrong'}},{...context,revision:{...context.revision,questionnaireId:''}},{...context,revision:{...context.revision,revision:'future'}}])assert.throws(()=>prepareRegistrationDraft(example.registration,identity,c));
});
