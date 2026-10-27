import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import questions from '../lib/questionnaire-engine/__fixtures__/individual/questions.json';
import cases from '../lib/questionnaire-engine/__fixtures__/individual/cases.json';
import catalog from '../lib/questionnaire-engine/__fixtures__/individual/catalog.json';
import sources from '../lib/questionnaire-engine/__fixtures__/individual/sources.json';
import pairs from '../lib/questionnaire-engine/individual/pair-references.json';
import { createIndividualInstrument, answersFromLetters } from '../lib/questionnaire-engine/individual/instrument';
import { analyzeIndividual, classifyIndividualScores, participantAnalysis, compareIndividualAnalyses } from '../lib/questionnaire-engine/individual/analyze-individual';
import { PROVIDED_RULES } from '../lib/questionnaire-engine/individual/provided-content';
import type { IndividualAnalysis, IndividualInput } from '../lib/questionnaire-engine/individual/types';
const revision = 'dna-official-2026-10-26.v1';
const instrument = createIndividualInstrument(questions, revision);
const input = (f: typeof cases.casos[number]): IndividualInput => ({ revision, answers: answersFromLetters(f.respostas) });
const results = cases.casos.map(f => analyzeIndividual(instrument, input(f)));
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log('PASS ' + name); }
const section = (r: IndividualAnalysis, n: number) => r.participant.sections[n - 1];
const change = (i: IndividualInput, q: string, l: string) => ({ ...i, answers: i.answers.map(a => a.questionId === q ? { ...a, alternativeId: q + ':' + l } : a) });
const blocks = (r: IndividualAnalysis) => [...r.participant.sections.flatMap(s => s.blocks), ...r.commercial.facts, ...r.commercial.questions, ...r.commercial.hypotheses];
test('official source fixtures unchanged by byte hash', () => {
    for (const s of sources) {
        if (!('target' in s) || !s.target)
            continue;
        const bytes = readFileSync(path.join(process.cwd(), 'lib/questionnaire-engine/__fixtures__/individual', s.target));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), s.sha256);
    }
});
test('official 15 questions,60 options,86 positive weights and reference catalog', () => { assert.equal(instrument.questions.length, 15); assert.equal(instrument.engine.alternatives.length, 60); assert.equal(instrument.engine.weights.length, 86); assert.equal(catalog.length, 39); assert.equal(catalog.reduce((n, c) => n + Object.keys(c.modalidades_referencia).length, 0), 45); });
for (const [i, f] of cases.casos.entries())
    test('fixture exact scores and ordered pair: ' + f.nome, () => { assert.deepEqual(results[i].scores, f.pontuacao_esperada); assert.equal(results[i].classification.pair, f.principal_esperado + '+' + f.secundario_esperado); });
test('scores match independent direct summation for 225 single-answer neighbors', () => {
    for (const f of cases.casos)
        for (const q of questions)
            for (const o of q.options) {
                const id = 'Q' + String(q.number).padStart(2, '0');
                if (f.respostas[id as keyof typeof f.respostas] === o.letter)
                    continue;
                const i = change(input(f), id, o.letter), r = analyzeIndividual(instrument, i);
                const sum = { L: 0, C: 0, E: 0, H: 0, P: 0 };
                for (const a of i.answers) {
                    const qu = questions.find(x => 'Q' + String(x.number).padStart(2, '0') === a.questionId)!;
                    const op = qu.options.find(x => a.alternativeId === a.questionId + ':' + x.letter)!;
                    for (const [k, w] of Object.entries(op.weights))
                        sum[k as keyof typeof sum] += w as number;
                }
                assert.deepEqual(r.scores, sum);
            }
});
test('Ana Beatriz Camila change topic reflection and commercial question', () => {
    assert.deepEqual(results.slice(0, 3).map(r => r.classification.pair), ['E+L', 'E+L', 'E+L']);
    const expected = ['Espaço para planos pessoais', 'Precisar ver utilidade no aprendizado', 'Necessidade de marcos perceptíveis'];
    for (let i = 0; i < 3; i++) {
        assert.ok(section(results[i], 6).blocks.some(b => b.text === expected[i]));
        assert.ok(results[i].commercial.questions.some(b => b.ruleId === 'answer:Q05:' + ['B', 'D', 'C'][i]));
    }
    assert.equal(new Set(results.slice(0, 3).map(r => JSON.stringify(section(r, 6).blocks.filter(b => b.claimType !== 'declared').map(b => b.text)))).size, 3);
});
test('equal scores Comparacao A/B: substantive Q05 B/D and Q06 B/A changes', () => { const [a, b] = results.slice(3); assert.deepEqual(a.scores, b.scores); assert.equal(a.classification.pair, b.classification.pair); assert.notDeepEqual(section(a, 6).blocks.map(x => x.text), section(b, 6).blocks.map(x => x.text)); assert.ok(a.commercial.questions.some(x => x.ruleId === 'answer:Q05:B')); assert.ok(b.commercial.questions.some(x => x.ruleId === 'answer:Q05:D')); assert.ok(a.commercial.questions.some(x => x.ruleId === 'answer:Q06:B')); assert.ok(b.commercial.questions.some(x => x.ruleId === 'answer:Q06:A')); assert.notEqual(a.analysisKey, b.analysisKey); });
test('withdraw Q11 A: no old self-criticism interpretation or commercial prompt survives', () => {
    for (const letter of ['B', 'C']) {
        const r = analyzeIndividual(instrument, change(input(cases.casos[0]), 'Q11', letter));
        assert.ok(blocks(r).every(b => b.ruleId !== 'answer:Q11:A'));
        assert.ok(r.gaps.some(g => g.id === 'editorial:Q11:' + letter));
        assert.ok(!JSON.stringify(participantAnalysis(r)).includes('O que eu posso aprender com isso?'));
    }
});
test('withdraw Q05 B: no old routine block survives', () => {
    for (const letter of ['A', 'C', 'D']) {
        const r = analyzeIndividual(instrument, change(input(cases.casos[0]), 'Q05', letter));
        assert.ok(blocks(r).every(b => b.ruleId !== 'answer:Q05:B'));
        assert.ok(!section(r, 6).blocks.some(b => b.text === 'Espaço para planos pessoais'));
    }
});
for (const [vector, state, main, seconds] of [['ACBEDDCAADCBBCC', 'tied_main', null, []], ['CAADDDBACCCACCE', 'tied_secondary', 'C', ['H', 'P']]] as const)
    test('ties without fabricated pair: ' + state, () => { const answers = instrument.questions.map((q, i) => ({ questionId: 'Q' + String(q.number).padStart(2, '0'), alternativeId: 'Q' + String(q.number).padStart(2, '0') + ':' + vector[i] })); const r = analyzeIndividual(instrument, { revision, answers }); assert.equal(r.classification.state, state); assert.equal(r.classification.main, main); assert.deepEqual(r.classification.secondaryCandidates, seconds); assert.equal(r.classification.pair, null); assert.equal(r.participant.pairReference, null); assert.equal(r.coverage.length, 15); assert.ok(section(r, 6).blocks.length > 0); });
test('all 20 ordered V1 references; opposite pairs differ; not final participant blocks', () => {
    assert.equal(pairs.length, 20);
    assert.equal(new Set(pairs.map(p => p.code)).size, 20);
    assert.notEqual(pairs.find(p => p.code === 'E+L')!.text, pairs.find(p => p.code === 'L+E')!.text);
    for (const r of results) {
        assert.equal(r.participant.pairReference?.code, r.classification.pair);
        assert.equal(r.participant.pairReference?.editorialStatus, 'pending_carla');
        assert.ok(r.participant.sections.flatMap(s => s.blocks).every(b => b.source !== 'ANEXO_B_20_CRUZAMENTOS_V1.md'));
    }
});
test('all 60 alternatives examined, traced, routed once; absent text is a gap', () => {
    let checked = 0;
    for (const q of questions)
        for (const o of q.options) {
            const qid = 'Q' + String(q.number).padStart(2, '0');
            const r = analyzeIndividual(instrument, change(input(cases.casos[0]), qid, o.letter));
            const e = r.evidence.find(e => e.questionId === qid)!;
            assert.equal(e.selectedText, o.text);
            assert.equal(r.coverage.length, 15);
            assert.equal(r.coverage.filter(x => x.questionId === qid).length, 1);
            assert.equal(r.participant.sections.flatMap(s => s.blocks).filter(b => b.ruleId === 'literal_selection:' + qid).length, 1);
            const provided = PROVIDED_RULES.some(rule => rule.question === qid && rule.letter === o.letter);
            if (!provided)
                assert.ok(r.gaps.some(g => g.questionId === qid));
            checked++;
        }
    assert.equal(checked, 60);
});
test('every interpretation references selected answer and no hypothetical rule leaks', () => {
    for (const r of results)
        for (const b of blocks(r)) {
            assert.ok(b.evidenceRefs.length > 0);
            assert.ok(b.source && b.contentVersion);
            for (const ref of b.evidenceRefs)
                assert.ok(r.evidence.some(e => e.id === ref));
            if (b.ruleId.startsWith('answer:')) {
                const [, q, l] = b.ruleId.split(':');
                assert.ok(r.evidence.some(e => e.questionId === q && e.letter === l));
            }
        }
});
test('15 distinct primary evidence routes without repeated participant deepening', () => {
    for (const r of results) {
        assert.equal(r.participant.sections.length, 9);
        for (const e of r.evidence) {
            const used = r.participant.sections.filter(s => s.blocks.some(b => b.evidenceRefs.includes(e.id)));
            assert.equal(used.length, 1);
            assert.equal(used[0].number, e.primarySection);
        }
    }
});
test('different context choices recorded only for review, not psychological conclusion', () => { assert.equal(results[3].contextualDifferences.length, 1); assert.equal(results[4].contextualDifferences.length, 0); assert.equal(results[3].contextualDifferences[0].editorialStatus, 'pending_carla'); });
test('determinism, input purity and identical answers allowed identical analysis', () => { const i = input(cases.casos[0]), before = JSON.stringify(i), config = JSON.stringify(instrument); assert.deepEqual(analyzeIndividual(instrument, i), analyzeIndividual(instrument, i)); assert.equal(JSON.stringify(i), before); assert.equal(JSON.stringify(instrument), config); assert.deepEqual(analyzeIndividual(instrument, { ...i, answers: [...i.answers].reverse() }), results[0]); });
test('canonical profile/option ordering cannot decide ties', () => { const raw = questions.map(q => ({ ...q, options: [...q.options].reverse() })).reverse(); const alt = createIndividualInstrument(raw, revision); alt.engine.profiles.reverse(); const i = input(cases.casos[0]); assert.deepEqual(analyzeIndividual(alt, i).scores, results[0].scores); assert.deepEqual(analyzeIndividual(alt, i).classification, results[0].classification); });
test('insufficiency structural differs from invalid input and unresolved method', () => { const r = classifyIndividualScores({ L: 0, C: 0, E: 0, H: 0, P: 0 }); assert.equal(r.state, 'structurally_insufficient'); assert.equal(r.pair, null); assert.equal(results[0].methodologicalSufficiency, 'not_homologated'); });
test('no inferred interest education courses or active offers', () => {
    for (const r of results) {
        assert.deepEqual(r.commercial.declared, {});
        assert.deepEqual(r.participant.careerPaths, []);
        assert.deepEqual(r.commercial.careerPaths, []);
        assert.ok(r.gaps.some(g => g.id === 'course-matrix'));
        assert.equal(r.productionReady, false);
    }
});
test('declared context preserved, does not change points or invent career matches', () => { const r = analyzeIndividual(instrument, { ...input(cases.casos[0]), declared: { interest: 'Tecnologia', education: 'graduado', objective: 'Explorar possibilidades' } }); assert.deepEqual(r.scores, results[0].scores); assert.equal(r.commercial.declared.interest, 'Tecnologia'); assert.notEqual(r.analysisKey, results[0].analysisKey); assert.deepEqual(r.commercial.careerPaths, []); });
test('participant projection has no commercial prompts or internal sales data', () => { const p = participantAnalysis(results[0]); assert.ok(!('commercial' in p)); assert.ok(!JSON.stringify(p).includes('Uma rotina de estudos caberia como na sua semana hoje?')); assert.ok(p.sections.flatMap(s => s.blocks).every(b => b.audience === 'participant')); });
const base = input(cases.casos[0]);
for (const [name, invalid] of Object.entries({ incomplete: { ...base, answers: base.answers.slice(1) }, extra: { ...base, answers: [...base.answers, base.answers[0]] }, duplicate: { ...base, answers: [...base.answers.slice(0, 14), base.answers[0]] }, foreignAlternative: change(base, 'Q01', 'Z'), crossQuestion: { ...base, answers: base.answers.map((a, i) => i ? a : { ...a, alternativeId: 'Q02:A' }) }, externalQuestion: { ...base, answers: base.answers.map((a, i) => i ? a : { ...a, questionId: 'Q16' }) }, wrongRevision: { ...base, revision: 'other' } }))
    test('reject ' + name, () => assert.throws(() => analyzeIndividual(instrument, invalid)));
test('malformed official schema rejected before calculation', () => {
    assert.throws(() => createIndividualInstrument(questions.slice(1), revision));
    for (const change of [() => ({ bad: true }), () => ({ ...questions[0], number: 2 }), () => ({ ...questions[0], options: [{ letter: 'A', text: 'X', weights: { X: 4 } }] })])
        assert.throws(() => createIndividualInstrument([change(), ...questions.slice(1)], revision));
});
test('runtime core is offline, no SDK env fetch application routes or database dependency', () => {
    const dir = path.join(process.cwd(), 'lib/questionnaire-engine/individual');
    for (const f of readdirSync(dir).filter(f => f.endsWith('.ts'))) {
        const text = readFileSync(path.join(dir, f), 'utf8');
        assert.ok(!/supabase|process\.env|fetch\(|https?:|dotenv|app\/api/.test(text), f);
    }
});
test('comparison API explains equal-score differences without names', () => { const diff = compareIndividualAnalyses(results[3], results[4]); assert.equal(diff.sameScores, true); assert.equal(diff.sameClassification, true); assert.ok(diff.answerDifferences.some(d => d.questionId === 'Q05' && d.from === 'B' && d.to === 'D')); assert.ok(diff.changedInterpretationSections.includes(6)); assert.ok(diff.changedInterpretationSections.includes(7)); assert.equal(diff.commercialQuestionsChanged, true); });
test('comparison permits identical content for identical answers', () => { const diff = compareIndividualAnalyses(results[0], results[0]); assert.deepEqual(diff.answerDifferences, []); assert.deepEqual(diff.changedInterpretationSections, []); assert.equal(diff.commercialQuestionsChanged, false); });
test('comparison rejects mixed revisions and interpretation versions', () => { assert.throws(() => compareIndividualAnalyses(results[0], { ...results[0], revision: 'different' })); assert.throws(() => compareIndividualAnalyses(results[0], { ...results[0], contentVersion: 'different' })); });
test('unmatched conditions remain auditable without leaking their text', () => {
    const r = analyzeIndividual(instrument, change(input(cases.casos[0]), 'Q05', 'A'));
    const audit = r.coverage.find(c => c.questionId === 'Q05')!;
    assert.equal(audit.ruleChecks.length, 3);
    assert.ok(audit.ruleChecks.every(check => !check.matched));
    assert.ok(r.gaps.some(g => g.id === 'editorial:Q05:A'));
    assert.ok(blocks(r).every(b => !b.ruleId.startsWith('answer:Q05:')));
});
console.log('\n' + passed + ' passed, 0 failed');
