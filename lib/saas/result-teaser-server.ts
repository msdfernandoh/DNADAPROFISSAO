import 'server-only';
import {ownsParticipant} from '@/lib/security/participant-session';
import {createServiceClient} from '@/lib/supabase/service';
import {verifyPublishedEditorial,type DeliveredJourney} from './published-editorial';
import {resultTeaser,whatsappResultUrl} from './result-teaser';
export async function ownResultTeaser(id:string){
 if(!/^[a-f0-9-]{36}$/i.test(id)||!await ownsParticipant(id,'v2'))throw Error('Unavailable');
 const db=await createServiceClient();
 const [participant,result,contact]=await Promise.all([
  db.from('participants_v2').select('id,institution_id,unit_id,assigned_user_id,quiz_completed').eq('id',id).maybeSingle(),
  db.from('questionnaire_results').select('v1_snapshot,v1_snapshot_key,v1_debit_id').eq('participant_id',id).maybeSingle(),
  db.rpc('dna_result_contact',{p_participant:id})
 ]);
 const p=participant.data,r=result.data,j=r?.v1_snapshot as DeliveredJourney;
 if(participant.error||result.error||contact.error||!p?.quiz_completed||!r?.v1_debit_id||!j?.publication||j.snapshot!==r.v1_snapshot_key||j.scope.participantId!==p.id||j.scope.institutionId!==p.institution_id||j.scope.unitId!==p.unit_id||j.scope.assignedUserId!==p.assigned_user_id)throw Error('Unavailable');
 const a=await db.from('report_editorial_approvals').select('version,source_hash').eq('version',j.publication.version).eq('active',true).maybeSingle();
 if(a.error||!a.data||a.data.source_hash!==j.publication.sourceHash)throw Error('Unavailable');verifyPublishedEditorial(j,a.data.version);
 const destination=contact.data as {name:string;phone:string}|null;
 return {teaser:resultTeaser(j),contactName:destination?.name||null,whatsapp:destination?whatsappResultUrl(destination.phone,j.registration.name,id):null};
}
