import {currentStoredPublication} from './current-publication-server';
import 'server-only';
import {evaluationFlags} from './flags';
import {createClient} from '@/lib/supabase/individual-server';
import {createServiceClient} from '@/lib/supabase/service';
import {loadVerifiedIdentity,type IdentityClient} from './identity';
import {pilotIdentity} from './pilot';
import {participantDraftPreview,commercialReport,type IntegratedJourney} from '../questionnaire-engine/integration/journey';
import {approvedParticipantReport} from './approved-report';
import {verifyPublishedEditorial,publishedParticipantReport,type DeliveredJourney} from './published-editorial';
/** Private draft only: authorization is checked on the stored target before reading a snapshot. */
export async function previewStoredEvaluation(id:string){
 if(!evaluationFlags(process.env).draftPreview)throw Error('Preview disabled');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid participant');
 const client=await createClient(),identity=pilotIdentity(await loadVerifiedIdentity(client as unknown as IdentityClient),process.env);
 if(!identity)throw Error('Unauthorized');
 const decision=await client.rpc('dna_authorize_participant',{p_participant:id,p_resource:'commercial_report',p_action:'read'});
 if(decision.error||decision.data!==true)throw Error('Unavailable');
 const db=await createServiceClient();
 const {data:p,error}=await db.from('participants_v2').select('id,institution_id,unit_id,assigned_user_id').eq('id',id).maybeSingle();
 if(error||!p?.institution_id||!identity.institutionIds.includes(p.institution_id)||!p.unit_id)throw Error('Unavailable');
 const {data:r,error:re}=await db.from('questionnaire_results').select('v1_revision,v1_snapshot,v1_snapshot_key').eq('participant_id',id).maybeSingle();
 if(re||!r?.v1_snapshot||!r.v1_revision)throw Error('Unavailable');
 const j=r.v1_snapshot as IntegratedJourney;
 if(j.snapshot!==r.v1_snapshot_key||j.analysis?.revision!==r.v1_revision||j.scope?.participantId!==p.id||j.scope.institutionId!==p.institution_id||j.scope.unitId!==p.unit_id||j.scope.assignedUserId!==p.assigned_user_id||j.readiness?.contentHomologated!==false)throw Error('Snapshot unavailable');
 const actor={id:identity.userId,active:true,role:p.assigned_user_id===identity.userId?'seller' as const:'manager' as const,institutionIds:[p.institution_id],unitIds:[p.unit_id]};
 const delivered=j as DeliveredJourney;
 if(delivered.publication){
  const approval=await db.from('report_editorial_approvals').select('version,source_hash,active').eq('version',delivered.publication.version).eq('active',true).maybeSingle();
  if(approval.error||!approval.data||approval.data.source_hash!==delivered.publication.sourceHash)throw Error('Approval unavailable');
  const publication=await currentStoredPublication(db,delivered);
  return {status:'approved' as const,published:true as const,participant:publishedParticipantReport({...delivered,publication},publication.version),commercial:{sections:publication.commercial,whatsapp:publication.whatsapp,courses:publication.courses},offersActive:false as const};
 }
 const approvalResult=await db.from('report_revision_approvals').select('revision,editorial_version,source_hash,approved_by,approved_at,active').eq('revision',r.v1_revision).eq('active',true).maybeSingle();
 if(approvalResult.error)throw Error('Approval unavailable');
 const a=approvalResult.data;
 const approved=a?approvedParticipantReport(j,actor,{revision:a.revision,editorialVersion:a.editorial_version,sourceHash:a.source_hash,approvedBy:a.approved_by,approvedAt:a.approved_at,active:a.active}):null;
 return {status:approved?'approved' as const:'draft_awaiting_homologation' as const,published:false as const,participant:approved||participantDraftPreview(j,actor),commercial:commercialReport(j,actor),offersActive:false as const};
}
