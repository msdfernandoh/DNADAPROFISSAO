import {INTEGRATED_REVISION} from '../questionnaire-engine/integration/journey';
type Evaluation={id:string;institution_id:string;unit_id:string;v1_revision:string;quiz_completed:boolean};
type Result={participant_id:string;v1_revision:string;v1_snapshot_key:string;v1_debit_id:string};
type Debit={id:string;participant_id:string;institution_id:string;unit_id:string;type:string;amount:number};
/** Pure consistency check after live stored-target authorization. Never calls completion or debit. */
export function recoveredCompletion(e:Evaluation,r:Result|null,debit:Debit|null){
 if(e.v1_revision!==INTEGRATED_REVISION)throw Error('Revision unavailable');
 if(!e.quiz_completed){if(r||debit)throw Error('Inconsistent unfinished evaluation');return null;}
 if(!r||!debit||r.participant_id!==e.id||r.v1_revision!==e.v1_revision||!/^[a-f0-9]{64}$/.test(r.v1_snapshot_key)||!r.v1_debit_id||r.v1_debit_id!==debit.id||debit.participant_id!==e.id||debit.institution_id!==e.institution_id||debit.unit_id!==e.unit_id||debit.type!=='v1_consume'||debit.amount!==-1)
  throw Error('Persisted completion unavailable');
 return {state:'committed' as const};
}
