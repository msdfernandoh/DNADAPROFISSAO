import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import questions from '../lib/questionnaire-engine/__fixtures__/individual/questions.json';
import cases from '../lib/questionnaire-engine/__fixtures__/individual/cases.json';
import { createIndividualInstrument, answersFromLetters } from '../lib/questionnaire-engine/individual/instrument';
import { analyzeIndividual } from '../lib/questionnaire-engine/individual/analyze-individual';
import { composeEditorialPreview, participantEditorialText, commercialEditorialText, editorialPreviewKey } from '../lib/questionnaire-engine/individual/editorial/compose-editorial';
const revision = 'dna-official-2026-10-26.v1', instrument = createIndividualInstrument(questions, revision);
const inputs = cases.casos.map(f => ({ revision, answers: answersFromLetters(f.respostas) }));
const analyses = inputs.map(i => analyzeIndividual(instrument, i));
const previews = analyses.map(composeEditorialPreview);
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log('PASS ' + name); }
const part = (i: number, s: number) => previews[i].participant.sections[s - 1].paragraphs.map(p => p.text).join(' ');
test('five readable participant previews with nine populated approved sections', () => { for (const p of previews) {
    assert.equal(p.participant.sections.length, 9);
    assert.ok(p.participant.sections.every(s => s.paragraphs.length && s.paragraphs.every(p => p.text.length > 50)));
    assert.equal(p.approval, 'pending_carla');
    assert.equal(p.productionReady, false);
} });
test('part6 uses distinct meanings not names or synonyms', () => { assert.match(part(0, 6), /espaço|semana/); assert.match(part(1, 6), /utilidade|aplicação/); assert.match(part(2, 6), /avanço|etapas/); assert.equal(new Set(previews.slice(0, 3).map(p => p.internal.selectedRules.find(r => r.section === 6)!.theme)).size, 3); assert.ok(!part(1, 6).includes('espaço para algo seu')); assert.ok(!part(2, 6).includes('ter mais disciplina')); });
test('equal score A/B changed parts6 and7 with Q05/Q06 evidence', () => { assert.deepEqual(analyses[3].scores, analyses[4].scores); for (const s of [6, 7])
    assert.notEqual(part(3, s), part(4, s)); assert.match(part(3, 7), /instruções|testar/); assert.match(part(4, 7), /parceria|companhia/); assert.equal(previews[3].internal.selectedRules.find(r => r.section === 7)!.id, 'learning:manual-and-experiment'); assert.equal(previews[4].internal.selectedRules.find(r => r.section === 7)!.id, 'learning:company-and-logic'); });
test('Beatriz usefulness and logic contextualized without contradiction', () => { const p = previews[1]; const context = p.participant.sections[6].paragraphs.find(p => p.ruleId === 'context:usefulness-and-logic')!; assert.ok(context); assert.match(context.text, /ligação clara/); assert.equal(context.evidenceRefs.length, 2); assert.ok(context.evidenceRefs.every(ref => /Q05:D|Q06:A/.test(ref))); assert.ok(p.internal.contextualInterpretations.includes('context:usefulness-and-logic')); });
test('changing Q05 removes old editorial narrative and contextual bridge', () => { const input = { ...inputs[1], answers: inputs[1].answers.map(a => a.questionId === 'Q05' ? { ...a, alternativeId: 'Q05:C' } : a) }; const p = composeEditorialPreview(analyzeIndividual(instrument, input)); assert.ok(!p.internal.contextualInterpretations.length); assert.ok(!p.participant.sections.flatMap(s => s.paragraphs).some(p => p.ruleId === 'motivation:usefulness' || p.ruleId === 'context:usefulness-and-logic')); });
test('changing Q06 removes old learning narrative and context', () => { const input = { ...inputs[1], answers: inputs[1].answers.map(a => a.questionId === 'Q06' ? { ...a, alternativeId: 'Q06:B' } : a) }; const p = composeEditorialPreview(analyzeIndividual(instrument, input)); assert.ok(!p.internal.contextualInterpretations.length); assert.ok(!p.participant.sections.flatMap(s => s.paragraphs).some(p => p.ruleId === 'learning:logic-after-manual' || p.ruleId === 'context:usefulness-and-logic')); });
test('Q11 withdrawal never leaves old self-demand draft', () => { const input = { ...inputs[0], answers: inputs[0].answers.map(a => a.questionId === 'Q11' ? { ...a, alternativeId: 'Q11:B' } : a) }; const p = composeEditorialPreview(analyzeIndividual(instrument, input)); assert.ok(!p.participant.sections[3].paragraphs.some(p => p.ruleId === 'difficulty:self-demand')); assert.ok(p.internal.gaps.some(g => g.section === 4)); });
test('every interpretation traced; process text never claims individual evidence', () => { for (const p of previews)
    for (const s of [...p.participant.sections, ...p.commercial.sections])
        for (const para of s.paragraphs) {
            assert.ok(para.ruleId);
            if (para.claimType !== 'process_information')
                assert.ok(para.evidenceRefs.length);
            for (const ref of para.evidenceRefs)
                assert.ok(p.internal.evidence.some(e => e.id === ref));
        } });
test('no repeated paragraphs and deep evidence never spread across participant sections', () => { for (const p of previews) {
    const paras = p.participant.sections.flatMap(s => s.paragraphs);
    assert.equal(new Set(paras.map(p => p.text)).size, paras.length);
    for (const e of p.internal.evidence) {
        const sections = p.participant.sections.filter(s => s.paragraphs.some(p => p.use === 'deepening' && p.evidenceRefs.includes(e.id)));
        assert.ok(sections.length <= 1);
    }
} });
test('participant projection excludes technical keys IDs evidence and commercial directions', () => { for (const p of previews) {
    const publicJSON = JSON.stringify(participantEditorialText(p));
    assert.ok(!/Q0[1-9]|Q1[0-5]|ruleId|evidenceRefs|analysisKey|pending_carla|commercial:/.test(publicJSON));
    assert.ok(!publicJSON.includes('Antes do contato'));
    assert.ok(!publicJSON.includes('Não chamar a pessoa'));
} });
test('commercial output distinct, consultive and reading not inferred', () => { for (const p of previews) {
    const t = commercialEditorialText(p);
    assert.equal(t.sections.length, 9);
    assert.match(JSON.stringify(t), /Abrir um link não comprova leitura/);
    assert.notDeepEqual(t, participantEditorialText(p));
} });
test('deterministic drafts do not mutate or recalculate behavioral analysis', () => { for (const a of analyses) {
    const before = JSON.stringify(a), p = composeEditorialPreview(a);
    assert.equal(JSON.stringify(a), before);
    assert.deepEqual(composeEditorialPreview(a), p);
    assert.equal(editorialPreviewKey(p), editorialPreviewKey(composeEditorialPreview(a)));
    assert.equal(p.sourceAnalysisKey, a.analysisKey);
} const source = readFileSync('lib/questionnaire-engine/individual/editorial/compose-editorial.ts', 'utf8'); assert.ok(!/calculateQuestionnaireResult|analyzeIndividual\(/.test(source)); });
test('all fifteen answers examined; missing editorial coverage explicit', () => { for (const p of previews) {
    assert.equal(p.internal.examinedQuestions.length, 15);
    assert.ok(p.internal.gaps.some(g => g.reason.includes('aprovação da Carla')));
    assert.ok(p.internal.gaps.some(g => g.reason.includes('aprofundamento editorial específico')));
} });
test('no courses invented and education gates never authorize an enrollment offer', () => { for (const education of [undefined, 'ensino_medio_incompleto', 'ensino_medio_completo', 'cursando_graduacao', 'graduado', 'pos_graduado', 'forged']) {
    const a = analyzeIndividual(instrument, { ...inputs[0], declared: { education } });
    assert.deepEqual(a.scores, analyses[0].scores);
    const p = composeEditorialPreview(a);
    assert.equal(p.internal.eligibility.enrollmentOfferAllowed, false);
    assert.equal(p.internal.eligibility.requiresServerValidation, true);
    const expected = !education ? 'needs_education' : ['graduado', 'pos_graduado'].includes(education) ? 'education_eligible_declaration' : education === 'forged' ? 'invalid_education' : 'education_ineligible';
    assert.equal(p.internal.eligibility.status, expected);
} });
test('tie preserves groups and no fabricated pair in editorial layer', () => { const vector = 'CAADDDBACCCACCE'; const answers = instrument.questions.map((q, i) => { const questionId = 'Q' + String(q.number).padStart(2, '0'); return { questionId, alternativeId: questionId + ':' + vector[i] }; }); const a = analyzeIndividual(instrument, { revision, answers }); const before = JSON.stringify(a.classification), p = composeEditorialPreview(a); assert.equal(JSON.stringify(a.classification), before); assert.equal(a.classification.pair, null); assert.match(p.participant.sections[4].paragraphs[0].text, /não ficou definida/); });
console.log('\n' + passed + ' editorial tests passed, 0 failed');
