import type { Answer } from '../types';
import { PROFILE_CODES, type OfficialQuestion, type IndividualInstrument, type IndividualInput } from './types';
export class IndividualInputError extends Error {
    constructor(public readonly code: string) { super(code); this.name = 'IndividualInputError'; }
}
export function questionCode(n: number): string { return 'Q' + String(n).padStart(2, '0'); }
export function createIndividualInstrument(raw: unknown, revision: string): IndividualInstrument {
    if (typeof revision !== 'string' || !revision.trim())
        throw new IndividualInputError('revision_required');
    if (!Array.isArray(raw) || raw.length !== 15)
        throw new IndividualInputError('exactly_15_questions_required');
    const questions: OfficialQuestion[] = JSON.parse(JSON.stringify(raw));
    const seen = new Set<number>();
    for (const q of questions) {
        if (!q || !Number.isInteger(q.number) || q.number < 1 || q.number > 15 || seen.has(q.number) || typeof q.title !== 'string' || !q.title.trim() || typeof q.situation !== 'string' || !q.situation.trim() || !Array.isArray(q.options) || q.options.length < 2)
            throw new IndividualInputError('invalid_question');
        seen.add(q.number);
        const letters = new Set<string>();
        for (const o of q.options) {
            if (!o || typeof o.letter !== 'string' || !/^[A-Z]$/.test(o.letter) || letters.has(o.letter) || typeof o.text !== 'string' || !o.text.trim() || !o.weights || typeof o.weights !== 'object' || Array.isArray(o.weights))
                throw new IndividualInputError('invalid_alternative');
            letters.add(o.letter);
            const entries = Object.entries(o.weights);
            if (!entries.length || !entries.some(([, v]) => typeof v === 'number' && v > 0) || entries.some(([k, v]) => !PROFILE_CODES.includes(k as typeof PROFILE_CODES[number]) || !Number.isSafeInteger(v) || v < 0))
                throw new IndividualInputError('invalid_weight');
        }
    }
    questions.sort((a, b) => a.number - b.number);
    const profiles = PROFILE_CODES.map((code, i) => ({ id: code, code, name: code, sort_order: i, active: true }));
    const alternatives = questions.flatMap(q => q.options.map((o, i) => ({ id: questionCode(q.number) + ':' + o.letter, question_id: questionCode(q.number), text: o.text, order: i + 1, active: true })));
    const weights = questions.flatMap(q => q.options.flatMap(o => Object.entries(o.weights).map(([code, weight]) => ({ alternative_id: questionCode(q.number) + ':' + o.letter, profile_id: code, profile_code: code, weight: weight! }))));
    return { revision, questions, engine: { profiles, questions: questions.map(q => ({ id: questionCode(q.number), text: q.situation, order: q.number, active: true })), alternatives, weights, scoringMode: 'normalized_sum' } };
}
export function validateIndividualAnswers(instrument: IndividualInstrument, input: IndividualInput): Answer[] {
    if (input.revision !== instrument.revision)
        throw new IndividualInputError('revision_mismatch');
    if (!Array.isArray(input.answers) || input.answers.length !== 15)
        throw new IndividualInputError('exactly_15_answers_required');
    const seen = new Set<string>();
    for (const a of input.answers) {
        if (!a || typeof a.questionId !== 'string' || typeof a.alternativeId !== 'string' || seen.has(a.questionId))
            throw new IndividualInputError('invalid_or_duplicate_answer');
        const q = instrument.engine.questions.find(q => q.id === a.questionId);
        const alt = instrument.engine.alternatives.find(o => o.id === a.alternativeId);
        if (!q || !alt || alt.question_id !== a.questionId)
            throw new IndividualInputError('answer_not_in_revision');
        seen.add(a.questionId);
    }
    return instrument.engine.questions.map(q => ({ ...input.answers.find(a => a.questionId === q.id)! }));
}
export function answersFromLetters(choices: Record<string, string>): Answer[] { return Object.entries(choices).map(([questionId, letter]) => ({ questionId, alternativeId: questionId + ':' + letter })); }
