import {createHash} from 'node:crypto';
import {canReadReport,type ReportActor} from '../questionnaire-engine/integration/access';
import {profileDisplaySummary} from '../questionnaire-engine/integration/profile-summary';
import type {IntegratedJourney} from '../questionnaire-engine/integration/journey';
import {frozenRevision} from '../questionnaire-engine/integration/frozen-revision';

/** Approval is a persisted, version-bound service record; browser flags cannot approve content. */
export type ReportApproval={revision:string;editorialVersion:string;sourceHash:string;approvedBy:string;approvedAt:string;active:boolean};
export function approvedParticipantReport(j:IntegratedJourney,actor:ReportActor|null,approval:ReportApproval|null){
 if(!canReadReport(actor,j.scope,'participant'))throw Error('Report not authorized');
 if(!approval?.active||!approval.approvedBy||!Number.isFinite(Date.parse(approval.approvedAt))||approval.revision!==j.analysis.revision||approval.editorialVersion!==j.editorial.version)
  throw Error('Approved revision required');
 const hash=createHash('sha256').update(JSON.stringify(j.editorial.participant.sections)).digest('hex');
 // sourceHash binds the approved ruleset through the persisted revision; a separate hash identifies this individual rendering.
 if(approval.sourceHash!==frozenRevision().sourceHash)throw Error('Approved source required');
 if(j.readiness.missingSections.length||j.readiness.unsafeSections.length||j.editorial.participant.sections.length!==9)throw Error('Incomplete individual report');
 return {audience:'participant' as const,name:j.registration.name,profiles:profileDisplaySummary(j.analysis),sections:j.editorial.participant.sections.map(s=>({number:s.number,title:s.title,paragraphs:s.paragraphs.map(p=>p.text)})),renderHash:hash};
}
