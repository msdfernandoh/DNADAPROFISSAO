import 'server-only';
import {createServiceClient} from '@/lib/supabase/service';
import {ownsParticipant} from '@/lib/security/participant-session';
import {createJourney,INTEGRATED_REVISION,journeyQuestions,validateRegistration} from '../questionnaire-engine/integration/journey';
import {frozenRevision} from '../questionnaire-engine/integration/frozen-revision';
import {composeEntryEditorial,knownPublishedEdition,verifyPublishedEditorial,type DeliveredJourney} from './published-editorial';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function publicEntryContext(){
 const db=await createServiceClient(),r=await db.rpc('dna_public_entry_context');const c=r.data;
 if(r.error||!c||c.revision!==INTEGRATED_REVISION||c.sourceHash!==frozenRevision().sourceHash||!knownPublishedEdition(c.editorialVersion,c.editorialSourceHash))throw Error('Public journey unavailable');
 return c as {institutionId:string;institutionName:string;unitId:string;unitName:string;assignedUserId:string;revision:string;questionnaireId:string;sourceHash:string;editorialVersion:string;editorialSourceHash:string};
}
export function publicQuestions(){return journeyQuestions().map(q=>({id:q.id,text:q.situation,description:q.title,order:q.number,required:true,type:'single_choice',alternatives:q.options.map((o,i)=>({id:o.id,question_id:q.id,text:o.text,order:i+1}))}));}
export async function loadOwnPublicEvaluation(id:string){
 if(!uuid.test(id)||!await ownsParticipant(id,'v2'))throw Error('Unavailable');
 const context=await publicEntryContext(),db=await createServiceClient();
 const {data:p,error}=await db.from('participants_v2').select('id,institution_id,unit_id,questionnaire_id,assigned_user_id,v1_revision,v1_registration,v1_draft_answers,v1_public_entry,quiz_completed').eq('id',id).maybeSingle();
 if(error||!p?.v1_public_entry||p.institution_id!==context.institutionId||!p.unit_id||!p.assigned_user_id||p.v1_revision!==context.revision||p.questionnaire_id!==context.questionnaireId)throw Error('Unavailable');
 const unit=await db.from('units_v2').select('id,name,active').eq('id',p.unit_id).eq('institution_id',p.institution_id).maybeSingle();
 if(unit.error||!unit.data?.active)throw Error('Unit unavailable');
 return {db,context:{...context,unitId:p.unit_id,unitName:unit.data.name,assignedUserId:p.assigned_user_id},participant:p,registration:validateRegistration(p.v1_registration)};
}
export function validatePublicAnswers(input:unknown,partial=false){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid answers');
 const r=input as Record<string,unknown>;
 if(Object.keys(r).some(k=>!['revision','answers'].includes(k))||r.revision!==INTEGRATED_REVISION||!Array.isArray(r.answers)||r.answers.length>(15)||(!partial&&r.answers.length!==15))throw Error('Invalid revision or answer count');
 const allowed=new Map(journeyQuestions().map(q=>[q.id,new Set(q.options.map(o=>o.id))]));const used=new Set<string>();
 const answers=r.answers.map(a=>{if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!['questionId','alternativeId'].includes(k))||typeof a.questionId!=='string'||typeof a.alternativeId!=='string'||used.has(a.questionId)||!allowed.get(a.questionId)?.has(a.alternativeId))throw Error('Invalid alternative');used.add(a.questionId);return {questionId:a.questionId,alternativeId:a.alternativeId};});
 return answers;
}
export async function completeOwnPublicEvaluation(id:string,input:unknown){
 const answers=validatePublicAnswers(input),{db,context:c,participant:p,registration}=await loadOwnPublicEvaluation(id);
 if(p.quiz_completed){
  const r=await db.from('questionnaire_results').select('v1_snapshot,v1_snapshot_key,v1_debit_id').eq('participant_id',id).maybeSingle(),j=r.data?.v1_snapshot as DeliveredJourney;
  if(r.error||!j?.publication||j.snapshot!==r.data?.v1_snapshot_key||j.scope.participantId!==p.id||j.scope.institutionId!==p.institution_id||j.scope.unitId!==p.unit_id||j.scope.assignedUserId!==p.assigned_user_id||answers.some(a=>!j.analysis.evidence.some(e=>e.questionId===a.questionId&&e.alternativeId===a.alternativeId)))throw Error('Conflicting historical completion');
  verifyPublishedEditorial(j,j.publication.version);
  const debit=await db.from('credit_events_v2').select('id').eq('id',r.data.v1_debit_id).eq('participant_id',id).eq('institution_id',p.institution_id).eq('type','v1_consume').eq('amount',-1).maybeSingle();
  if(debit.error||!debit.data)throw Error('Inconsistent stored debit');
  return {state:'committed' as const,url:'/meu-dna/'+p.id,replay:true};
 }
 const journey=createJourney({revision:c.revision,registration,answers},{scope:{participantId:p.id,institutionId:p.institution_id,unitId:p.unit_id,assignedUserId:p.assigned_user_id},institutionName:c.institutionName,unitName:c.unitName,release:'released',reading:'unknown'});
 const snapshot={...journey,publication:composeEntryEditorial(journey,c.editorialVersion)};
 const command={actorId:null,sessionId:null,participantId:p.id,institutionId:p.institution_id,unitId:p.unit_id,questionnaireId:p.questionnaire_id,revision:p.v1_revision,revisionSourceHash:c.sourceHash,answers,scores:{...journey.analysis.scores},snapshot,snapshotKey:journey.snapshot};
 const r=await db.rpc('dna_complete_public_evaluation_v1',{p_command:command});
 if(r.error)throw Error('Completion unavailable');
 if(r.data?.state==='no_credit'&&r.data?.answersSaved===true)return {state:'no_credit' as const,answersSaved:true};
 if(r.data?.state!=='committed'||r.data.snapshotKey!==journey.snapshot)throw Error('Completion unavailable');
 return {state:'committed' as const,url:'/meu-dna/'+p.id,replay:r.data.replay===true};
}
