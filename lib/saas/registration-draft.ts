import {validateRegistration,INTEGRATED_REVISION} from '../questionnaire-engine/integration/journey';
import {frozenRevision} from '../questionnaire-engine/integration/frozen-revision';
import {authorizeOperation,type OperationalScope,type UnitAssignment} from './authorization';
import type {VerifiedIdentity} from './identity';

export type RegistrationDraftContext = {
 scope:OperationalScope;
 units:UnitAssignment[];
 unitActive:boolean;
 revision:{revision:string;sourceHash:string;questionnaireId:string};
};
/** Pure server preparation. No database write, credit event or browser-selected attribution.
 * Context and generated participant ID must come from an authorized server lookup.
 * Database must recheck this context atomically before a future insert. */
export function prepareRegistrationDraft(input:unknown,identity:VerifiedIdentity|null,context:RegistrationDraftContext){
 if(!identity?.sessionId||!context.unitActive||!context.scope.unitId)
  throw Error('Verified session and active unit required');
 if(!authorizeOperation(identity,context.units,{resource:'lead',action:'create',target:context.scope}).allowed)
  throw Error('Registration not authorized');
 const frozen=frozenRevision();
 if(context.revision.revision!==INTEGRATED_REVISION||context.revision.sourceHash!==frozen.sourceHash||!context.revision.questionnaireId)
  throw Error('Frozen revision unavailable');
 // The client supplies only registration fields; validateRegistration rejects scope/result claims.
 const registration=validateRegistration(input);
 return Object.freeze({
  id:context.scope.participantId,
  institution_id:context.scope.institutionId,
  unit_id:context.scope.unitId,
  assigned_user_id:context.scope.assignedUserId,
  participant_user_id:context.scope.participantUserId,
  questionnaire_id:context.revision.questionnaireId,
  v1_revision:frozen.revision,
  v1_registration:Object.freeze({...registration}),
  revisionSourceHash:frozen.sourceHash,
  quiz_completed:false as const,
  report_released:false as const,
  content_homologated:false as const,
 });
}
