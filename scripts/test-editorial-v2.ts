import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import questions from '../lib/questionnaire-engine/__fixtures__/individual/questions.json';
import cases from '../lib/questionnaire-engine/__fixtures__/individual/cases.json';
import { createIndividualInstrument, answersFromLetters } from '../lib/questionnaire-engine/individual/instrument';
import { analyzeIndividual } from '../lib/questionnaire-engine/individual/analyze-individual';
import { composeEditorialPreview } from '../lib/questionnaire-engine/individual/editorial/compose-editorial';
import { composeEditorialPreviewV2, compareEditorialParagraphs, editorialRuleInventory, participantEditorialText } from '../lib/questionnaire-engine/individual/editorial/compose-editorial-v2';
const revision = 'dna-official-2026-10-26.v1', instrument = createIndividualInstrument(questions, revision);
const inputs = cases.casos.map(f => ({ revision, answers: answersFromLetters(f.respostas) })), analyses = inputs.map(i => analyzeIndividual(instrument, i)), outputs = analyses.map(a => composeEditorialPreviewV2(a));
let passed = 0;
function test(n: string, f: () => void) { f(); passed++; console.log('PASS ' + n); }
test('60 alternatives inventoried without promoting draft to approved', () => { const inv = editorialRuleInventory(questions); assert.equal(inv.length, 60); assert.equal(new Set(inv.map(r => r.question + r.alternative)).size, 60); assert.ok(inv.every(r => !r.publicationApproved)); assert.ok(inv.some(r => r.coverage === 'literal_only')); assert.ok(inv.some(r => r.rules.some(rule => rule.batch === 'v2'))); });
test('base version files preserved byte-for-byte', () => { const base = 'docs/especificacoes-2026-10-26/previas-editoriais-v2/base-v1/'; const manifest = JSON.parse(readFileSync(base + 'MANIFESTO.json', 'utf8')); for (const [name, hash] of Object.entries(manifest.hashes))
    assert.equal(createHash('sha256').update(readFileSync('lib/questionnaire-engine/individual/editorial/' + name)).digest('hex'), hash); });
test('original Q05 and Q06 narratives and Beatriz contextualization preserved', () => { for (let i = 0; i < 5; i++) {
    const old = composeEditorialPreview(analyses[i]);
    for (const s of [6, 7])
        assert.deepEqual(outputs[i].participant.sections[s - 1], old.participant.sections[s - 1]);
} assert.ok(outputs[1].participant.sections[6].paragraphs.some(p => p.ruleId === 'context:usefulness-and-logic')); });
test('same answers do not force artificial variation', () => assert.deepEqual(composeEditorialPreviewV2(analyses[0]), composeEditorialPreviewV2(analyses[0])));
test('paragraph comparison distinguishes same evidence from shared fixed process', () => { const dif = compareEditorialParagraphs(outputs[0], outputs[1]); assert.ok(dif[1].comparisons.some(c => c.status === 'same_evidence_same_text')); assert.ok(dif[5].comparisons.some(c => c.status === 'changed_evidence_or_rule')); assert.ok(dif[7].comparisons.every(c => c.status === 'shared_process_information')); assert.ok(dif[0].comparisons.some(c => c.status === 'same_template_different_evidence')); });
test('novelty Q05A covered without losing legacy themes', () => { const a = analyzeIndividual(instrument, { ...inputs[0], answers: inputs[0].answers.map(x => x.questionId === 'Q05' ? { ...x, alternativeId: 'Q05:A' } : x) }); const p = composeEditorialPreviewV2(a); assert.equal(p.participant.sections[5].paragraphs[0].ruleId, 'v2:motivation-novelty'); assert.ok(p.commercial.sections[3].paragraphs.some(p => p.ruleId === 'v2:commercial:novelty-question')); assert.ok(p.participant.sections.flatMap(s => s.paragraphs).every(p => !p.ruleId.startsWith('motivation:room'))); });
test('learning group and goal are supported without inferred modality or course', () => { for (const letter of ['C', 'D']) {
    const a = analyzeIndividual(instrument, { ...inputs[0], answers: inputs[0].answers.map(x => x.questionId === 'Q06' ? { ...x, alternativeId: 'Q06:' + letter } : x) });
    const p = composeEditorialPreviewV2(a);
    assert.ok(p.participant.sections[6].paragraphs[0].ruleId.startsWith('v2:learning'));
    assert.ok(p.commercial.sections[3].paragraphs.some(p => p.ruleId === 'v2:commercial:learning-question:' + letter));
    assert.equal(p.internal.eligibility.enrollmentOfferAllowed, false);
} });
for (const release of ['not_released', 'unknown', 'released'] as const)
    test('editable WhatsApp with actual release context ' + release, () => { const p = composeEditorialPreviewV2(analyses[0], { release, reading: 'unknown' }); assert.equal(p.whatsapp.editable, true); assert.equal(p.whatsapp.automaticSend, false); if (release === 'not_released')
        assert.ok(!p.whatsapp.text.includes('já foi disponibilizado')); if (release === 'released')
        assert.ok(p.whatsapp.text.includes('disponibilizado')); if (release === 'unknown')
        assert.ok(p.whatsapp.text.includes('confirmar')); });
test('reading state changes commercial only, never evidence or scores', () => { const notread = composeEditorialPreviewV2(analyses[0], { release: 'released', reading: 'not_read' }), disagreed = composeEditorialPreviewV2(analyses[0], { release: 'released', reading: 'disagreed' }); assert.notEqual(notread.whatsapp.text, disagreed.whatsapp.text); assert.deepEqual(notread.participant, disagreed.participant); assert.deepEqual(notread.internal.evidence, disagreed.internal.evidence); });
for (const [v, state] of [['ACBEDDCAADCBBCC', 'tied_main'], ['CAADDDBACCCACCE', 'tied_secondary']])
    test('tie readable opening preserves exact groups ' + state, () => { const a = analyzeIndividual(instrument, { revision, answers: questions.map((q, i) => { const id = 'Q' + String(q.number).padStart(2, '0'); return { questionId: id, alternativeId: id + ':' + v[i] }; }) }); const before = JSON.stringify(a); const p = composeEditorialPreviewV2(a); assert.equal(a.classification.state, state); assert.equal(a.classification.pair, null); assert.equal(before, JSON.stringify(a)); assert.ok(p.participant.sections[0].paragraphs[0].text.includes(state === 'tied_main' ? 'mesma pontuação' : 'segunda posição')); assert.ok(p.participant.sections[5].paragraphs.length); });
test('all new claims cite selected evidence; participant text has no technical IDs', () => { for (const p of outputs) {
    for (const s of [...p.participant.sections, ...p.commercial.sections])
        for (const para of s.paragraphs) {
            if (para.claimType !== 'process_information')
                assert.ok(para.evidenceRefs.length);
            for (const id of para.evidenceRefs)
                assert.ok(p.internal.evidence.some(e => e.id === id));
        }
    assert.ok(!/Q0[1-9]|Q1[0-5]|ruleId|evidenceRefs/.test(JSON.stringify(participantEditorialText(p))));
    assert.equal(p.productionReady, false);
} });
test('new audit never attributes unmatched conditions to selected text', () => { for (const p of outputs)
    for (const check of p.audit)
        if (check.selected) {
            assert.equal(check.matched, true);
            assert.ok(p.participant.sections.flatMap(s => s.paragraphs).some(p => p.ruleId === check.ruleId));
        } });
test('opening explains supported interaction beyond profile names', () => { assert.ok(outputs[0].participant.sections[0].paragraphs.some(p => p.ruleId === 'v2:opening:understanding-and-direction')); assert.ok(outputs[3].participant.sections[0].paragraphs.some(p => p.ruleId === 'v2:opening:action-and-care')); assert.ok(outputs[3].participant.sections[0].paragraphs.find(p => p.ruleId === 'v2:opening:action-and-care')!.evidenceRefs.every(ref => ref.includes('Q08:C'))); });
test('scores and classifications stay unchanged with delivery and expansion', () => { for (const a of analyses) {
    const before = JSON.stringify(a);
    composeEditorialPreviewV2(a, { release: 'released', reading: 'identified' });
    assert.equal(JSON.stringify(a), before);
} });
console.log('\n' + passed + ' v2 tests passed, 0 failed');
