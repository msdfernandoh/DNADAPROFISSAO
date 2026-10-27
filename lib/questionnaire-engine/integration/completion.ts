import type { IntegratedJourney } from './journey';
/** Production adapter must perform these effects in ONE database transaction. None is supplied here. */
export type AtomicCompletionRequest = {
    evaluationId: string;
    institutionId: string;
    snapshotKey: string;
};
export type AtomicCompletionResult = {
    state: 'committed';
    snapshotKey: string;
    debitId: string;
    replay: boolean;
} | {
    state: 'no_credit' | 'persistence_failure';
    answersPreserved: true;
};
export interface AtomicCompletionPort {
    commit(request: AtomicCompletionRequest): Promise<AtomicCompletionResult>;
}
export async function commitValidatedJourney(journey: IntegratedJourney, evaluationId: string, port: AtomicCompletionPort): Promise<AtomicCompletionResult> {
    if (!evaluationId || journey.analysis.evidence.length !== 15)
        throw new Error('Valid complete evaluation required');
    // One call: never save result, mark completion and debit through independent network writes.
    return port.commit({ evaluationId, institutionId: journey.scope.institutionId, snapshotKey: journey.snapshot });
}
