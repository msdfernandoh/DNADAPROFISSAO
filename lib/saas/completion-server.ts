import 'server-only';
import {createServiceClient} from '@/lib/supabase/service';
import {createClient} from '@/lib/supabase/individual-server';
import {loadVerifiedIdentity,type IdentityClient} from './identity';
import {pilotIdentity} from './pilot';
import {evaluationFlags} from './flags';
import {prepareAtomicCompletion,executeAtomicCompletion} from './completion-service';
import type {Registration} from '../questionnaire-engine/integration/journey';
/** Server entry point behind an independent OFF-by-default gate and stored authorization. */
export async function completeStoredEvaluation(participantId:string,input:unknown){
 if(!evaluationFlags(process.env).completion)throw Error('Completion disabled');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(participantId))throw Error('Invalid participant');
 const userClient=await createClient(),identity=pilotIdentity(await loadVerifiedIdentity(userClient as unknown as IdentityClient),process.env);
 if(!identity?.sessionId)throw Error('Verified individual identity required');
 const authorization=await userClient.rpc('dna_authorize_participant',{p_participant:participantId,p_resource:'lead',p_action:'update'});
 if(authorization.error||authorization.data!==true)throw Error('Evaluation unavailable');
 const db=await createServiceClient();
 const {data:p,error}=await db.from('participants_v2').select('id,institution_id,unit_id,questionnaire_id,assigned_user_id,participant_user_id,v1_revision,v1_registration').eq('id',participantId).maybeSingle();
 if(error||!p?.institution_id||!identity.institutionIds.includes(p.institution_id)||!p.unit_id||!p.questionnaire_id||!p.v1_revision||!p.v1_registration)throw Error('Evaluation unavailable');
 const {data:i,error:ie}=await db.from('institutions').select('id,name,active').eq('id',p.institution_id).maybeSingle();
 const {data:u,error:ue}=await db.from('units_v2').select('id,name,active,institution_id').eq('id',p.unit_id).eq('institution_id',p.institution_id).maybeSingle();
 if(ie||ue||!i?.active||!u?.active)throw Error('Evaluation unavailable');
 const ids=identity.memberships.map(m=>m.id);
 const unitScopes=ids.length?await db.from('membership_unit_scopes').select('membership_id,institution_id,unit_id,active').in('membership_id',ids):{data:[],error:null};
 if(unitScopes.error)throw Error('Scope unavailable');
 const command=prepareAtomicCompletion(input,identity,{scope:{participantId:p.id,institutionId:p.institution_id,institutionActive:i.active,unitId:p.unit_id,assignedUserId:p.assigned_user_id,participantUserId:p.participant_user_id,reportReleased:false,contentHomologated:false},questionnaireId:p.questionnaire_id,revision:p.v1_revision,registration:p.v1_registration as Registration,institutionName:i.name,unitName:u.name,units:(unitScopes.data||[]).map(x=>({membershipId:x.membership_id,institutionId:x.institution_id,unitId:x.unit_id,active:x.active}))});
 // Stored scope and live session are checked again INSIDE PostgreSQL under locks.
 return executeAtomicCompletion(db,command);
}
