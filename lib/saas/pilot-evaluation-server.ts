import 'server-only';
import {evaluationFlags} from './flags';
import {createClient} from '@/lib/supabase/individual-server';
import {createServiceClient} from '@/lib/supabase/service';
import {loadVerifiedIdentity,type IdentityClient} from './identity';
import {pilotIdentity} from './pilot';
import {INTEGRATED_REVISION,journeyQuestions,validateRegistration} from '../questionnaire-engine/integration/journey';
import {frozenRevision} from '../questionnaire-engine/integration/frozen-revision';
import {recoveredCompletion} from './persisted-completion';
/** Existing stored registration only. No public creation, scope assignment or credit grants. */
export async function loadPilotEvaluation(id:string){
 if(!evaluationFlags(process.env).completion)throw Error('Disabled');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw Error('Unavailable');
 const client=await createClient(),identity=pilotIdentity(await loadVerifiedIdentity(client as unknown as IdentityClient),process.env);
 if(!identity)throw Error('Unauthorized');
 const permission=await client.rpc('dna_authorize_participant',{p_participant:id,p_resource:'lead',p_action:'update'});
 if(permission.error||permission.data!==true)throw Error('Unavailable');
 const db=await createServiceClient();
 const {data:p,error}=await db.from('participants_v2').select('id,institution_id,unit_id,v1_revision,v1_registration,quiz_completed').eq('id',id).maybeSingle();
 if(error||!p?.institution_id||!identity.institutionIds.includes(p.institution_id)||!p.unit_id||p.v1_revision!==INTEGRATED_REVISION||!p.v1_registration)throw Error('Unavailable');
 const [institution,unit]=await Promise.all([db.from('institutions').select('id').eq('id',p.institution_id).eq('active',true).maybeSingle(),db.from('units_v2').select('id').eq('id',p.unit_id).eq('institution_id',p.institution_id).eq('active',true).maybeSingle()]);
 if(institution.error||unit.error||!institution.data||!unit.data)throw Error('Unavailable');
 const registration=validateRegistration(p.v1_registration);frozenRevision();
 const {data:r,error:resultError}=await db.from('questionnaire_results').select('participant_id,v1_revision,v1_snapshot_key,v1_debit_id').eq('participant_id',id).maybeSingle();
 if(resultError)throw Error('Completion unavailable');
 let debit=null;
 if(r?.v1_debit_id){const receipt=await db.from('credit_events_v2').select('id,participant_id,institution_id,unit_id,type,amount').eq('id',r.v1_debit_id).maybeSingle();if(receipt.error)throw Error('Completion unavailable');debit=receipt.data;}
 const completion=recoveredCompletion(p,r,debit);
 return {participantId:p.id,name:registration.name,revision:p.v1_revision,completed:completion!==null,questions:completion?[]:journeyQuestions().map(q=>({id:q.id,text:q.situation,description:q.title,order:q.number,required:true,type:'single_choice',alternatives:q.options.map((a,i)=>({id:a.id,question_id:q.id,text:a.text,order:i+1}))}))};
}
