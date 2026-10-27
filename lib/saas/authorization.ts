import type { VerifiedIdentity } from './identity';
export type Operation = 'read'|'create'|'update'|'archive'|'transfer'|'administer';
export type ProtectedResource = 'lead'|'participant_report'|'commercial_report'|'permissions';
/** Loaded from the database, never request payload or user_metadata. */
export type OperationalScope = { participantId:string; institutionId:string; institutionActive:boolean; unitId:string|null; assignedUserId:string|null; participantUserId:string|null; reportReleased:boolean; contentHomologated:boolean };
export type UnitAssignment = { membershipId:string; institutionId:string; unitId:string; active:boolean };
export type AccessRequest = { resource:ProtectedResource; action:Operation; target:OperationalScope; targetUserId?:string };
export type AccessDecision = { allowed:boolean; reason:string; auditRequired:boolean };
export function authorizeOperation(identity:VerifiedIdentity|null, units:readonly UnitAssignment[], request:AccessRequest):AccessDecision {
 const deny=(reason:string):AccessDecision=>({allowed:false,reason,auditRequired:true});
 const allow=():AccessDecision=>({allowed:true,reason:'explicit_scope',auditRequired:true});
 if(!identity)return deny('unauthenticated');
 const t=request.target;
 if(!t.participantId||!t.institutionId||!t.institutionActive)return deny('missing_scope');
 if(request.resource==='permissions'&&(!request.targetUserId||request.targetUserId===identity.userId))return deny('self_elevation_or_missing_target');
 // Participants can never receive commercial content, or unpublished drafts.
 if(t.participantUserId===identity.userId&&request.resource==='participant_report'&&request.action==='read')
   return t.reportReleased&&t.contentHomologated?allow():deny('report_not_released');
 if(identity.globalOwner)return allow();
 const memberships=identity.memberships.filter(m=>m.active&&!m.scope_pending&&m.user_id===identity.userId&&m.institution_id===t.institutionId&&identity.institutionIds.includes(m.institution_id));
 if(!memberships.length)return deny('institution_scope');
 const matching=identity.grants.filter(g=>memberships.some(m=>m.id===g.membership_id)&&g.institution_id===t.institutionId&&g.resource===request.resource&&g.action===request.action);
 if(matching.some(g=>!g.allowed))return deny('explicit_denial');
 for(const m of memberships){
   // Even institution admins require explicit unit allocation for unit-scoped records.
   if(!t.unitId||!units.some(u=>u.active&&u.membershipId===m.id&&u.institutionId===t.institutionId&&u.unitId===t.unitId))continue;
   if(m.role_code==='seller'&&(!['read','update'].includes(request.action)||request.resource==='permissions'||t.assignedUserId!==identity.userId))continue;
   if(m.role_code==='unit_manager'&&request.resource==='permissions')continue;
   const grant=matching.some(g=>g.membership_id===m.id&&g.allowed&&(g.scope_type==='institution'||(g.scope_type==='assigned_leads'&&t.assignedUserId===identity.userId)));
   if(grant)return allow();
 }
 return deny('unit_responsibility_or_action');
}
