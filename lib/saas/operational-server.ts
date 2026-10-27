import 'server-only';
import {createClient} from '@/lib/supabase/individual-server';
import {loadVerifiedIdentity,type IdentityClient} from './identity';
import type {ProtectedResource,Operation} from './authorization';
/** No resource data are returned here. PostgreSQL must authorize the stored target, not client scope claims.
 * Not wired to public routes until JWT/RLS tests and migrations have been approved. */
export async function authorizeStoredParticipant(participantId:string,resource:ProtectedResource,action:Operation){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(participantId))return false;
 const db=await createClient();const identity=await loadVerifiedIdentity(db as unknown as IdentityClient);if(!identity)return false;
 const {data,error}=await db.rpc('dna_authorize_participant',{p_participant:participantId,p_resource:resource,p_action:action});
 return !error&&data===true;
}
