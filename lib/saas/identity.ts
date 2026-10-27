export type Membership = { id: string; institution_id: string; user_id: string; role_code: 'institution_admin' | 'unit_manager' | 'seller'; active: boolean; scope_pending: boolean };
export type PermissionGrant = { membership_id: string; institution_id: string; resource: string; action: string; scope_type: 'institution' | 'assigned_leads'; allowed: boolean };
export type VerifiedIdentity = { userId: string; displayName: string; globalOwner: boolean; memberships: Membership[]; grants: PermissionGrant[]; institutionIds: string[] };
export type QueryResult = { data: unknown; error: unknown };
export interface IdentityQuery extends PromiseLike<QueryResult> { eq(column: string, value: unknown): IdentityQuery; in(column: string, values: string[]): IdentityQuery; maybeSingle(): PromiseLike<QueryResult> }
export interface IdentityClient {
 auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: unknown }> };
 from(table: string): { select(columns: string): IdentityQuery };
}
export class IdentityUnavailable extends Error {}
function rows(data: unknown): Record<string,unknown>[] { if (!Array.isArray(data)||data.some(x=>!x||typeof x!=='object'||Array.isArray(x))) throw new IdentityUnavailable('Invalid identity data'); return data as Record<string,unknown>[]; }
function row(data:unknown):Record<string,unknown>|null { if(data===null)return null;if(!data||typeof data!=='object'||Array.isArray(data))throw new IdentityUnavailable('Invalid identity row');return data as Record<string,unknown>; }
/** Uses the current user's ordinary Supabase client: never service_role or browser role claims. */
export async function loadVerifiedIdentity(client: IdentityClient): Promise<VerifiedIdentity | null> {
 const auth = await client.auth.getUser();
 if (auth.error || !auth.data.user?.id) return null;
 const userId=auth.data.user.id;
 const profileResult=await client.from('user_profiles').select('id, display_name, active').eq('id',userId).maybeSingle();
 if(profileResult.error)throw new IdentityUnavailable('Identity read unavailable');
 const profile=row(profileResult.data);if(!profile||profile.id!==userId||profile.active!==true)return null;
 const ownerResult=await client.from('platform_owners').select('user_id, active').eq('user_id',userId).eq('active',true).maybeSingle();
 if(ownerResult.error)throw new IdentityUnavailable('Owner read unavailable');
 const owner=row(ownerResult.data);
 const membershipResult=await client.from('institution_memberships').select('id, institution_id, user_id, role_code, active, scope_pending').eq('user_id',userId).eq('active',true);
 if(membershipResult.error)throw new IdentityUnavailable('Membership read unavailable');
 const candidates=rows(membershipResult.data).filter(m=>m.user_id===userId&&m.active===true&&m.scope_pending===false&&typeof m.id==='string'&&typeof m.institution_id==='string'&&['institution_admin','unit_manager','seller'].includes(String(m.role_code)));
 const requested=[...new Set(candidates.map(m=>m.institution_id as string))];
 let institutions:Record<string,unknown>[]=[];
 if(requested.length){const result=await client.from('institutions').select('id, active').in('id',requested).eq('active',true);if(result.error)throw new IdentityUnavailable('Institution read unavailable');institutions=rows(result.data);}
 const institutionIds=institutions.filter(i=>i.active===true&&requested.includes(String(i.id))).map(i=>i.id as string);
 const memberships=candidates.filter(m=>institutionIds.includes(m.institution_id as string)) as unknown as Membership[];
 let grants:PermissionGrant[]=[];
 if(memberships.length){const result=await client.from('user_permission_grants').select('membership_id, institution_id, resource, action, scope_type, allowed').in('membership_id',memberships.map(m=>m.id));if(result.error)throw new IdentityUnavailable('Permission read unavailable');
 grants=rows(result.data).filter(g=>memberships.some(m=>m.id===g.membership_id&&m.institution_id===g.institution_id)&&typeof g.allowed==='boolean'&&['institution','assigned_leads'].includes(String(g.scope_type))&&typeof g.resource==='string'&&typeof g.action==='string') as unknown as PermissionGrant[];}
 return {userId,displayName:typeof profile.display_name==='string'?profile.display_name:'',globalOwner:owner?.user_id===userId&&owner.active===true,memberships,grants,institutionIds};
}
export function canReviewDrafts(identity:VerifiedIdentity|null): boolean { return identity?.globalOwner===true; }
/** Scoped foundation only. Lead/unit permissions remain disabled until their schema and RLS are validated. */
export function canReadInstitution(identity:VerifiedIdentity|null,institutionId:string):boolean {
 if(!identity||!institutionId)return false;
 const members=identity.memberships.filter(m=>m.institution_id===institutionId&&m.active&&!m.scope_pending);
 if(identity.grants.some(g=>members.some(m=>m.id===g.membership_id)&&g.resource==='institutions'&&g.action==='read'&&g.scope_type==='institution'&&!g.allowed))return false;
 return identity.globalOwner||members.some(m=>m.role_code==='institution_admin')||identity.grants.some(g=>members.some(m=>m.id===g.membership_id)&&g.resource==='institutions'&&g.action==='read'&&g.scope_type==='institution'&&g.allowed);
}
