import {frozenRevision} from '../questionnaire-engine/integration/frozen-revision';
import {createJourney,INTEGRATED_REVISION,type Registration} from '../questionnaire-engine/integration/journey';
import {authorizeOperation,type OperationalScope,type UnitAssignment} from './authorization';
import type {VerifiedIdentity} from './identity';
export type StoredEvaluation={scope:OperationalScope; questionnaireId:string; revision:string; registration:Registration; institutionName:string; unitName:string; units:UnitAssignment[]};
export type CompletionCommand={actorId:string;sessionId:string;participantId:string;institutionId:string;unitId:string;questionnaireId:string;revision:string;revisionSourceHash:string;answers:{questionId:string;alternativeId:string}[];scores:Record<string,number>;snapshot:ReturnType<typeof createJourney>;snapshotKey:string};
/** Only answers and revision come from the browser. Registration, identity and attribution are server records. */
export function prepareAtomicCompletion(input:unknown,identity:VerifiedIdentity|null,stored:StoredEvaluation):CompletionCommand{
 if(!identity?.sessionId)throw Error('Verified live session required');
 const scope=stored.scope;
 const ownParticipant=scope.participantUserId===identity.userId;
 if(!scope.unitId||!scope.institutionId||!scope.institutionActive||(!ownParticipant&&!authorizeOperation(identity,stored.units,{resource:'lead',action:'update',target:scope}).allowed))throw Error('Unauthorized evaluation');
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid completion');
 const data=input as Record<string,unknown>;
 if(Object.keys(data).some(k=>!['answers','revision'].includes(k))||stored.revision!==INTEGRATED_REVISION||data.revision!==stored.revision)throw Error('Invalid completion revision or claims');
 const snapshot=createJourney({revision:stored.revision,answers:data.answers,registration:stored.registration},{scope,institutionName:stored.institutionName,unitName:stored.unitName,release:'not_released',reading:'unknown'});
 return{actorId:identity.userId,sessionId:identity.sessionId,participantId:scope.participantId,institutionId:scope.institutionId,unitId:scope.unitId,questionnaireId:stored.questionnaireId,revision:stored.revision,revisionSourceHash:frozenRevision().sourceHash,answers:snapshot.analysis.evidence.map(e=>({questionId:e.questionId,alternativeId:e.alternativeId})),scores:{...snapshot.analysis.scores},snapshot,snapshotKey:snapshot.snapshot};
}
export interface CompletionRpc {rpc(name:string,params:Record<string,unknown>):PromiseLike<{data:unknown;error:unknown}>}
export async function executeAtomicCompletion(client:CompletionRpc,command:CompletionCommand){
 const {data,error}=await client.rpc('dna_complete_evaluation_v1',{p_command:command});
 if(error)throw Error('Atomic completion failed; retain answers and retry the same request');
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid completion receipt');
 const r=data as Record<string,unknown>;
 if(r.state==='no_credit'&&r.answersSaved===true)return{state:'no_credit' as const,answersSaved:true};
 if(r.state!=='committed'||r.snapshotKey!==command.snapshotKey||typeof r.debitId!=='string'||typeof r.replay!=='boolean')throw Error('Invalid completion receipt');
 return{state:'committed' as const,snapshotKey:r.snapshotKey,debitId:r.debitId,replay:r.replay};
}
