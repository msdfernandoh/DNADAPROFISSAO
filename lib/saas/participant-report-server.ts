import 'server-only';
import {createHash} from 'node:crypto';
import {createServiceClient} from '@/lib/supabase/service';
import {approvedParticipantReport} from './approved-report';
import type {IntegratedJourney} from '../questionnaire-engine/integration/journey';
export async function participantReportByToken(token:string){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error('Unavailable');
 const db=await createServiceClient();
 const link=await db.from('participant_report_links').select('participant_id,expires_at,revoked').eq('token_hash',createHash('sha256').update(token).digest('hex')).maybeSingle();
 if(link.error||!link.data||link.data.revoked||Date.parse(link.data.expires_at)<=Date.now())throw Error('Unavailable');
 const id=link.data.participant_id;
 const [participant,result]=await Promise.all([
  db.from('participants_v2').select('id,institution_id,unit_id,quiz_completed').eq('id',id).maybeSingle(),
  db.from('questionnaire_results').select('v1_revision,v1_snapshot,v1_snapshot_key,v1_debit_id').eq('participant_id',id).maybeSingle()
 ]);
 const p=participant.data,r=result.data,j=r?.v1_snapshot as IntegratedJourney;
 if(participant.error||result.error||!p?.quiz_completed||!r?.v1_debit_id||!j||j.snapshot!==r.v1_snapshot_key||j.scope.participantId!==p.id||j.scope.institutionId!==p.institution_id||j.scope.unitId!==p.unit_id||j.analysis.revision!==r.v1_revision)throw Error('Unavailable');
 const [institution,unit,approval]=await Promise.all([
  db.from('institutions').select('active').eq('id',p.institution_id).maybeSingle(),
  db.from('units_v2').select('active').eq('id',p.unit_id).eq('institution_id',p.institution_id).maybeSingle(),
  db.from('report_revision_approvals').select('*').eq('revision',r.v1_revision).eq('active',true).maybeSingle()
 ]);
 if(institution.error||unit.error||approval.error||!institution.data?.active||!unit.data?.active||!approval.data)throw Error('Unavailable');
 const a=approval.data;
 return approvedParticipantReport(j,{id:'private-report-recipient',role:'participant',participantId:p.id,active:true,institutionIds:[p.institution_id],unitIds:[p.unit_id]},
 {revision:a.revision,editorialVersion:a.editorial_version,sourceHash:a.source_hash,approvedBy:a.approved_by,approvedAt:a.approved_at,active:a.active});
}
