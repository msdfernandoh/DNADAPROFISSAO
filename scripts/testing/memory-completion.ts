import type { AtomicCompletionPort, AtomicCompletionRequest, AtomicCompletionResult } from '../../lib/questionnaire-engine/integration/completion';
/** Fictional adapter for LOCAL demonstration/tests only; not a PostgreSQL/RLS implementation. */
export class MemoryCompletion implements AtomicCompletionPort {
    private balances = new Map<string, number>();
    private committed = new Map<string, {
        snapshotKey: string;
        debitId: string;
    }>();
    private tail: Promise<unknown> = Promise.resolve();
    failNext = false;
    constructor(mode: 'local-fictional', balances: Record<string, number>) {
        if (mode !== 'local-fictional')
            throw new Error('Local fictional mode required');
        for (const [id, balance] of Object.entries(balances)) {
            if (!Number.isSafeInteger(balance) || balance < 0)
                throw new Error('Explicit fictional balance required');
            this.balances.set(id, balance);
        }
    }
    balance(id: string) { return this.balances.get(id) ?? 0; }
    commit(request: AtomicCompletionRequest): Promise<AtomicCompletionResult> {
        const operation = this.tail.then((): AtomicCompletionResult => {
            const key = request.institutionId + ':' + request.evaluationId;
            const old = this.committed.get(key);
            if (old) {
                if (old.snapshotKey !== request.snapshotKey)
                    throw new Error('Completed snapshot cannot be overwritten');
                return { state: 'committed', ...old, replay: true };
            }
            if (this.balance(request.institutionId) <= 0)
                return { state: 'no_credit', answersPreserved: true };
            if (this.failNext) {
                this.failNext = false;
                return { state: 'persistence_failure', answersPreserved: true };
            }
            const row = { snapshotKey: request.snapshotKey, debitId: 'fictional-debit-' + (this.committed.size + 1) };
            this.committed.set(key, row);
            this.balances.set(request.institutionId, this.balance(request.institutionId) - 1);
            return { state: 'committed', ...row, replay: false };
        });
        this.tail = operation.catch(() => { });
        return operation;
    }
}
