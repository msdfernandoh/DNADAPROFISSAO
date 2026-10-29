import 'server-only';
import {createServiceClient} from '@/lib/supabase/service';
import {composePublishedEditorial,verifyPublishedEditorial,PUBLIC_EDITION,PUBLIC_EDITION_SOURCE_HASH,type DeliveredJourney} from './published-editorial';
/** Call only AFTER participant ownership, private-token or live stored-target authorization. Original snapshot stays untouched. */
export async function currentStoredPublication(db:Awaited<ReturnType<typeof createServiceClient>>,j:DeliveredJourney){
 const original=j.publication;if(!original)throw Error('Published original required');
 verifyPublishedEditorial(j,original.version);
 const approval=await db.from('report_editorial_approvals').select('version,source_hash').eq('version',PUBLIC_EDITION).eq('active',true).maybeSingle();
 if(approval.error)throw Error('Editorial approval unavailable');
 if(!approval.data||approval.data.source_hash!==PUBLIC_EDITION_SOURCE_HASH)return original;
 if(original.version===PUBLIC_EDITION)return original;
 const existing=await db.from('evaluation_editorial_editions').select('publication').eq('participant_id',j.scope.participantId).eq('version',PUBLIC_EDITION).maybeSingle();
 if(existing.error)throw Error('Editorial edition unavailable');
 if(existing.data)return verifyPublishedEditorial({...j,publication:existing.data.publication},PUBLIC_EDITION);
 const publication=composePublishedEditorial(j),saved=await db.rpc('dna_store_editorial_edition',{p_participant:j.scope.participantId,p_publication:publication});
 if(saved.error||!saved.data)throw Error('Editorial edition could not be preserved');
 return verifyPublishedEditorial({...j,publication:saved.data},PUBLIC_EDITION);
}
