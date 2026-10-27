import type {VerifiedIdentity} from './identity';
import type {FeatureEnvironment} from './flags';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Mandatory server-only pilot scope; configuration restricts access but never grants a membership. */
export function pilotIdentity(identity:VerifiedIdentity|null,env:FeatureEnvironment):VerifiedIdentity|null {
 if(!identity?.sessionId||!uuid.test(identity.userId))return null;
 const institution=env.DNA_V1_PILOT_INSTITUTION_ID||'',raw=env.DNA_V1_PILOT_USER_IDS||'';
 if(!uuid.test(institution)||raw.length>4096)return null;
 const users=raw.split(',').map(s=>s.trim()).filter(Boolean);
 if(!users.length||users.length>20||users.some(id=>!uuid.test(id))||!users.includes(identity.userId))return null;
 const memberships=identity.memberships.filter(m=>m.user_id===identity.userId&&m.active&&!m.scope_pending&&m.institution_id===institution&&identity.institutionIds.includes(institution));
 // A global-owner record is not sufficient for a pilot login: current institutional membership is mandatory.
 if(!memberships.length)return null;
 return {...identity,globalOwner:false,memberships,institutionIds:[institution],grants:identity.grants.filter(g=>g.institution_id===institution&&memberships.some(m=>m.id===g.membership_id))};
}
