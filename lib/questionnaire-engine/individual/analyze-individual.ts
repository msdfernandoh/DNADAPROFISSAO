import { createHash } from 'node:crypto';
import { calculateQuestionnaireResult } from '../calculate-result';
import { validateIndividualAnswers, questionCode, IndividualInputError } from './instrument';
import { CONTENT_VERSION, PRIMARY_SECTION, SECTION_TITLES, literalEvidenceBlock, selectProvidedBlocks } from './provided-content';
import pairReferences from './pair-references.json';
import { PROFILE_CODES, type IndividualInstrument, type IndividualInput, type IndividualAnalysis, type Classification, type ProfileCode, type Evidence, type Gap } from './types';
export const ANALYSIS_VERSION = 'dna-individual-2026-10-26.v1';
export function classifyIndividualScores(scores: Record<ProfileCode, number>): Classification {
    if (PROFILE_CODES.some(c => !Number.isFinite(scores[c]) || scores[c] < 0))
        throw new IndividualInputError('invalid_scores');
    const values = [...new Set(PROFILE_CODES.map(c => scores[c]))].sort((a, b) => b - a);
    const groups = values.map(score => ({ score, profiles: PROFILE_CODES.filter(c => scores[c] === score) }));
    if (!groups[0]?.score)
        return { state: 'structurally_insufficient', groups, main: null, secondaryCandidates: [], pair: null };
    if (groups[0].profiles.length > 1)
        return { state: 'tied_main', groups, main: null, secondaryCandidates: [], pair: null };
    const main = groups[0].profiles[0], seconds = groups[1]?.score > 0 ? groups[1].profiles : [];
    if (!seconds.length)
        return { state: 'structurally_insufficient', groups, main, secondaryCandidates: [], pair: null };
    if (seconds.length > 1)
        return { state: 'tied_secondary', groups, main, secondaryCandidates: seconds, pair: null };
    return { state: 'defined', groups, main, secondaryCandidates: seconds, pair: main + '+' + seconds[0] };
}
export function analyzeIndividual(instrument: IndividualInstrument, input: IndividualInput): IndividualAnalysis {
    const answers = validateIndividualAnswers(instrument, input);
    const declared: NonNullable<IndividualInput['declared']> = {};
    for (const key of ['interest', 'education', 'objective', 'priorCourse'] as const) {
        const v = input.declared?.[key];
        if (v !== undefined) {
            if (typeof v !== 'string')
                throw new IndividualInputError('invalid_declared_context');
            if (v.trim())
                declared[key] = v.trim();
        }
    }
    // Reuse the existing summation, but never its legacy tie breaker or profile fallbacks.
    const legacy = calculateQuestionnaireResult({ ...instrument.engine, answers });
    const scores = Object.fromEntries(PROFILE_CODES.map(c => [c, legacy.scores[c]])) as Record<ProfileCode, number>;
    const classification = classifyIndividualScores(scores);
    const evidence: Evidence[] = answers.map(a => { const q = instrument.questions.find(q => questionCode(q.number) === a.questionId)!; const o = q.options.find(o => a.alternativeId === a.questionId + ':' + o.letter)!; return { id: instrument.revision + ':' + a.alternativeId, questionId: a.questionId, alternativeId: a.alternativeId, revision: instrument.revision, letter: o.letter, scenario: q.title, selectedText: o.text, claimType: 'declared', primarySection: PRIMARY_SECTION[a.questionId] }; });
    const selected = selectProvidedBlocks(evidence);
    const gaps: Gap[] = evidence.filter(e => !selected.matched.get(e.id)?.length).map(e => ({ id: 'editorial:' + e.questionId + ':' + e.letter, section: e.primarySection, questionId: e.questionId, reason: 'Resposta examinada e fato literal disponível; aprofundamento/reflexão específicos ainda sem regra editorial fornecida.' }));
    // Commercial questions do not establish a full participant narrative for that answer.
    for (const e of evidence)
        if (selected.matched.get(e.id)?.length && !selected.participant.some(b => b.evidenceRefs.includes(e.id)))
            gaps.push({ id: 'participant-text:' + e.questionId + ':' + e.letter, section: e.primarySection, questionId: e.questionId, reason: 'Pergunta comercial fornecida; texto aprofundado do participante ainda pendente.' });
    gaps.push({ id: 'identity-copy', section: 1, questionId: null, reason: 'Pontuações e forças calculadas; narrativa de abertura por caso ainda exige homologação.' }, { id: 'pair-copy', section: 5, questionId: null, reason: classification.pair ? 'Cruzamento V1 selecionado como referência; cenas e adaptação individual não homologadas.' : 'Sem par inequívoco; narrativa de empate/insuficiência pendente, análise das respostas preservada.' }, { id: 'course-matrix', section: 8, questionId: null, reason: 'Matriz de associação/ranqueamento não aprovada; nenhuma recomendação gerada.' }, { id: 'closing-copy', section: 9, questionId: null, reason: 'Fechamento individual ainda depende de texto/regra editorial aprovado.' });
    const sections = SECTION_TITLES.map((title, i) => ({ number: i + 1, title, blocks: [...evidence.filter(e => e.primarySection === i + 1).map(e => literalEvidenceBlock(e, 'participant')), ...selected.participant.filter(b => b.section === i + 1)], gapIds: gaps.filter(g => g.section === i + 1).map(g => g.id) }));
    const contextualDifferences: IndividualAnalysis['contextualDifferences'] = [];
    // Choices in distinct hypothetical contexts are not a diagnosis or a resolved conflict.
    const q02 = evidence.find(e => e.questionId === 'Q02')!, q06 = evidence.find(e => e.questionId === 'Q06')!;
    if (q02.letter === 'B' && q06.letter === 'B')
        contextualDifferences.push({ id: 'review:instructions-versus-experiment', evidenceRefs: [q02.id, q06.id], kind: 'different_context_choices', editorialStatus: 'pending_carla' });
    const hash = createHash('sha256').update(JSON.stringify({ analysisVersion: ANALYSIS_VERSION, contentVersion: CONTENT_VERSION, revision: instrument.revision, questions: instrument.questions, answers, declared, pairReferences })).digest('hex');
    return { analysisVersion: ANALYSIS_VERSION, contentVersion: CONTENT_VERSION, revision: instrument.revision, analysisKey: hash, scores, classification, evidence, coverage: evidence.map(e => ({ questionId: e.questionId, alternativeId: e.alternativeId, examined: true, evaluatedRules: ['literal_selection:' + e.questionId, ...(selected.evaluated.get(e.id) || []).map(check => check.ruleId)],
            ruleChecks: selected.evaluated.get(e.id) || [], selectedBlockIds: [...sections.flatMap(s => s.blocks), ...selected.commercial].filter(b => b.evidenceRefs.includes(e.id)).map(b => b.id), gapIds: gaps.filter(g => g.questionId === e.questionId).map(g => g.id) })), participant: { audience: 'participant', sections, pairReference: pairReferences.find(p => p.code === classification.pair) || null, careerPaths: [], status: 'editorial_review_required' }, commercial: { audience: 'commercial', facts: evidence.map(e => literalEvidenceBlock(e, 'commercial')), questions: selected.commercial, declared, hypotheses: selected.participant.filter(b => b.claimType === 'hypothesis').map(b => ({ ...b, id: b.id + ':commercial', audience: 'commercial' })), avoidAssuming: selected.avoid, careerPaths: [], nextStep: 'Confirmar leitura e interesse profissional declarado antes de orientar cursos; combinar retorno sem presumir data.', status: 'editorial_review_required' }, contextualDifferences, gaps, methodologicalSufficiency: 'not_homologated', productionReady: false };
}
export function participantAnalysis(analysis: IndividualAnalysis) { return { revision: analysis.revision, scores: analysis.scores, classification: analysis.classification, ...analysis.participant }; }
export function commercialAnalysis(analysis: IndividualAnalysis) { return { revision: analysis.revision, scores: analysis.scores, classification: analysis.classification, ...analysis.commercial }; }
/** Comparison is evidence-based; semantic/editorial approval remains a human decision. */
export function compareIndividualAnalyses(a: IndividualAnalysis, b: IndividualAnalysis) {
    if (a.revision !== b.revision || a.analysisVersion !== b.analysisVersion || a.contentVersion !== b.contentVersion)
        throw new IndividualInputError('incomparable_versions');
    const answerDifferences = a.evidence.flatMap(e => { const other = b.evidence.find(o => o.questionId === e.questionId); return other && other.alternativeId !== e.alternativeId ? [{ questionId: e.questionId, from: e.letter, to: other.letter, section: e.primarySection, evidenceRefs: [e.id, other.id] }] : []; });
    const changedInterpretationSections = a.participant.sections.filter(section => {
        const other = b.participant.sections.find(s => s.number === section.number)!;
        const analyticalText = (blocks: typeof section.blocks) => blocks.filter(block => block.claimType !== 'declared').map(block => ({ ruleId: block.ruleId, text: block.text }));
        return JSON.stringify(analyticalText(section.blocks)) !== JSON.stringify(analyticalText(other.blocks));
    }).map(s => s.number);
    const questions = (r: IndividualAnalysis) => r.commercial.questions.map(q => ({ ruleId: q.ruleId, text: q.text }));
    return { sameScores: PROFILE_CODES.every(c => a.scores[c] === b.scores[c]), sameClassification: JSON.stringify(a.classification) === JSON.stringify(b.classification), answerDifferences, changedInterpretationSections, commercialQuestionsChanged: JSON.stringify(questions(a)) !== JSON.stringify(questions(b)) };
}
