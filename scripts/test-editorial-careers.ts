import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import questions from '../lib/questionnaire-engine/__fixtures__/individual/questions.json';
import cases from '../lib/questionnaire-engine/__fixtures__/individual/cases.json';
import { createIndividualInstrument, answersFromLetters } from '../lib/questionnaire-engine/individual/instrument';
import { analyzeIndividual } from '../lib/questionnaire-engine/individual/analyze-individual';
import { composeEditorialPreviewV2 } from '../lib/questionnaire-engine/individual/editorial/compose-editorial-v2';
import { closeEditorialV2, assertParticipantReadyForPreview } from '../lib/questionnaire-engine/individual/editorial/close-editorial-v2';
import { buildCourseMatrix } from '../lib/questionnaire-engine/careers/build-course-matrix';
import { demonstrateCareerLinks, evaluateLocalOffer, preliminaryEducation, AUTHORIZED_POST_INSTITUTIONS } from '../lib/questionnaire-engine/careers/demonstrate-career-links';
import type { CareerContext, OfferContext } from '../lib/questionnaire-engine/careers/types';
const revision = 'dna-official-2026-10-26.v1', instrument = createIndividualInstrument(questions, revision);
const analyses = cases.casos.map(f => analyzeIndividual(instrument, { revision, answers: answersFromLetters(f.respostas) }));
const names = ['Exploracao_L', 'Exploracao_C', 'Exploracao_H', 'Empate_principal', 'Empate_secundario'];
const extra = names.map(n => { const old = JSON.parse(readFileSync('docs/especificacoes-2026-10-26/previas-editoriais-v2/' + n + '-interno.json', 'utf8')); return { name: n, a: analyzeIndividual(instrument, { revision, answers: questions.map((q, i) => { const id = 'Q' + String(q.number).padStart(2, '0'); return { questionId: id, alternativeId: id + ':' + old.vector[i] }; }) }) }; });
let passed = 0;
function test(n: string, fn: () => void) { fn(); passed++; console.log('PASS ' + n); }
test('ten impacted cases have nine nonempty participant sections without development copy', () => { for (const a of [...analyses, ...extra.map(x => x.a)])
    assertParticipantReadyForPreview(closeEditorialV2(a)); });
test('empty sections and development text rejected rather than silently filled', () => { const p = closeEditorialV2(analyses[0]); p.participant.sections[4].paragraphs = []; assert.throws(() => assertParticipantReadyForPreview(p)); p.participant.sections[4].paragraphs = [{ text: 'Matriz pendente no pipeline da prévia', ruleId: 'bad', evidenceRefs: [], use: 'synthesis', claimType: 'process_information' }]; assert.throws(() => assertParticipantReadyForPreview(p)); });
test('L+C C+P H+C section5 requires pair AND specific evidence', () => { for (const r of extra.slice(0, 3)) {
    const p = closeEditorialV2(r.a);
    assert.ok(p.participant.sections[4].paragraphs[0].ruleId.startsWith('closure:interaction'));
    assert.ok(p.participant.sections[4].paragraphs[0].evidenceRefs.length >= 2);
} const changed = { ...extra[0].a, classification: { ...extra[0].a.classification, pair: 'C+L' } }; assert.ok(!closeEditorialV2(changed).participant.sections[4].paragraphs.some(p => p.ruleId === 'closure:interaction:direction-and-exchange')); });
test('ties adapt section title and interpret situations without choosing pair', () => { for (const r of extra.slice(3)) {
    const before = JSON.stringify(r.a.classification), p = closeEditorialV2(r.a);
    assert.equal(r.a.classification.pair, null);
    assert.equal(JSON.stringify(r.a.classification), before);
    assert.notEqual(p.participant.sections[4].title, 'Suas duas forças em ação');
    assert.ok(p.participant.sections[4].paragraphs[0].text.length > 250);
    assert.ok(!p.participant.sections[4].paragraphs[0].text.includes('A combinação entre duas forças não ficou definida'));
} });
test('Ana Beatriz Camila and A/B parts6/7 remain byte-equivalent to v2', () => { for (const a of analyses) {
    const old = composeEditorialPreviewV2(a), p = closeEditorialV2(a);
    for (const n of [5, 6])
        assert.deepEqual(p.participant.sections[n], old.participant.sections[n]);
} });
test('commercial summary addresses seller and no duplicate paragraphs across summary confirmation next', () => { for (const a of analyses) {
    const p = closeEditorialV2(a);
    assert.match(p.commercial.sections[0].paragraphs[0].text, /Use o resultado/);
    assert.notDeepEqual(p.commercial.sections[0], p.participant.sections[0]);
    const paras = [0, 1, 7].flatMap(i => p.commercial.sections[i].paragraphs.map(p => p.text));
    assert.equal(new Set(paras).size, paras.length);
} });
test('closure deterministic read-only and no invented courses', () => { for (const a of analyses) {
    const before = JSON.stringify(a);
    assert.deepEqual(closeEditorialV2(a), closeEditorialV2(a));
    assert.equal(JSON.stringify(a), before);
    assert.deepEqual(a.participant.careerPaths, []);
} });
const matrix = buildCourseMatrix();
test('107 courses,39 graduation,68 post, separate levels and identities', () => { assert.equal(matrix.length, 107); assert.equal(matrix.filter(c => c.level === 'graduacao').length, 39); assert.equal(matrix.filter(c => c.level === 'pos_graduacao').length, 68); assert.equal(new Set(matrix.map(c => c.id)).size, 107); const marketing = matrix.filter(c => c.name === 'Marketing Digital'); assert.equal(marketing.length, 2); assert.notEqual(marketing[0].id, marketing[1].id); });
test('source facts pending external verification; inferred mappings pending Carla', () => { for (const c of matrix) {
    assert.ok(c.sourceDescriptions.length && c.sourceId);
    assert.equal(c.provenance.externalVerification, 'not_performed');
    assert.equal(c.provenance.methodologyApproval, 'pending_carla');
    assert.equal(c.admission.specificRequirements, null);
    assert.equal(c.admission.acceptedPriorDegrees, null);
    assert.ok(c.activities.every(x => c.sourceDescriptions.includes(x.text)));
    assert.ok(c.declaredInterestCandidates.every(x => x.status === 'proposed_pending_review'));
    assert.ok(c.offers.every(o => o.status === 'not_enabled_in_local_matrix'));
} });
const context: CareerContext = { institution: 'UNIFECAF SINOP', interests: ['programação', 'logística'], objectives: ['explorar possibilidades'], education: 'ensino_medio_completo' };
for (const education of ['ensino_medio_completo', 'cursando_graduacao', 'graduado', undefined] as const)
    test('education demo ' + String(education), () => { const demo = demonstrateCareerLinks(analyses[1], { ...context, education }); assert.ok(demo.proposedCandidates.length <= 5); assert.deepEqual(demo.productionRecommendations, []); assert.ok(demo.proposedCandidates.every(c => c.explorationOnly && !c.enrollmentOfferAllowed && c.approval === 'proposed_pending_carla')); if (education !== 'graduado')
        assert.ok(demo.proposedCandidates.every(c => c.level !== 'pos_graduacao'));
    else
        assert.ok(demo.proposedCandidates.some(c => c.level === 'pos_graduacao')); if (!education)
        assert.ok(demo.questions.some(q => q.includes('escolaridade'))); });
test('missing interests/objectives never inferred from behavioral profile', () => { for (const a of analyses) {
    assert.deepEqual(demonstrateCareerLinks(a, { ...context, interests: [] }).proposedCandidates, []);
    assert.deepEqual(demonstrateCareerLinks(a, { ...context, objectives: [] }).proposedCandidates, []);
} });
test('same declared context different scores selects same candidate IDs, different answer evidence changes explanation', () => { const a = demonstrateCareerLinks(analyses[0], context), b = demonstrateCareerLinks(analyses[1], context); assert.deepEqual(a.proposedCandidates.map(c => c.courseId), b.proposedCandidates.map(c => c.courseId)); assert.notDeepEqual(a.proposedCandidates[0].behavioralExplanation, b.proposedCandidates[0].behavioralExplanation); assert.ok(b.proposedCandidates[0].behavioralExplanation.some(x => x.evidenceRefs.some(ref => ref.includes('Q05:D')))); });
test('zero-to-five boundary no arbitrary fixed profile list or silent truncation', () => { const five = demonstrateCareerLinks(analyses[1], { ...context, interests: ['programação', 'dados', 'gestão', 'logística', 'marketing digital'] }); assert.equal(five.proposedCandidates.length, 5); const tooMany = demonstrateCareerLinks(analyses[1], { ...context, education: 'graduado', interests: ['programação', 'dados', 'gestão', 'logística', 'marketing digital', 'recursos humanos'] }); assert.equal(tooMany.unresolvedSelection, true); assert.deepEqual(tooMany.proposedCandidates, []); });
test('all four institutions authorize 68 post catalog courses without enabling them', () => { assert.equal(AUTHORIZED_POST_INSTITUTIONS.length, 4); assert.ok(matrix.filter(c => c.level === 'pos_graduacao').every(c => c.institutionalPostAuthorization === 'four_institutions_approved')); for (const institution of AUTHORIZED_POST_INSTITUTIONS)
    assert.ok(demonstrateCareerLinks(analyses[1], { ...context, institution, education: 'graduado' }).proposedCandidates.some(c => c.level === 'pos_graduacao')); });
const post = matrix.find(c => c.level === 'pos_graduacao')!;
const offer: OfferContext = { institution: context.institution, courseId: post.id, globalPostEnabled: true, institutionEnabled: true, courseEnabled: true, unitEnabled: true, academicRequirementsChecked: true, verifiedEducationAtEnrollment: true, status: 'enabled' };
test('eligibility rejects mid incomplete/in progress/missing/invalid even browser claims eligible', () => { for (const education of ['ensino_medio_incompleto', 'ensino_medio_completo', 'cursando_graduacao', undefined, 'forged']) {
    const data = { ...context, education, eligible: true, diplomaConfirmed: true };
    const gate = evaluateLocalOffer(post, data, offer);
    assert.equal(gate.allowed, false);
    assert.ok(gate.reasons.includes('schooling_not_confirmed_eligible'));
} for (const education of ['graduado', 'pos_graduado'])
    assert.equal(preliminaryEducation('pos_graduacao', education), 'education_declared_eligible'); });
test('disabled offer/global/institution/course/unit, wrong tenant and missing proof remain blocked', () => { for (const modified of [{ ...offer, globalPostEnabled: false }, { ...offer, institutionEnabled: false }, { ...offer, courseEnabled: false }, { ...offer, unitEnabled: false }, { ...offer, status: 'disabled' as const }, { ...offer, institution: 'OTHER' }, { ...offer, unit: 'OTHER' }, { ...offer, academicRequirementsChecked: false }, { ...offer, verifiedEducationAtEnrollment: false }]) {
    const gate = evaluateLocalOffer(post, { ...context, education: 'graduado' }, modified);
    assert.equal(gate.allowed, false);
    assert.ok(gate.reasons.length >= 2);
} });
test('even all toggles on cannot promote unhomologated matrix into real offer', () => { assert.deepEqual(evaluateLocalOffer(post, { ...context, education: 'graduado' }, offer), { allowed: false, reasons: ['matrix_associations_not_homologated'] }); });
test('education and career layer never mutate behavioral scores', () => { const before = JSON.stringify(analyses[1]); for (const education of [undefined, 'cursando_graduacao', 'graduado'])
    demonstrateCareerLinks(analyses[1], { ...context, education }); assert.equal(JSON.stringify(analyses[1]), before); });
console.log('\n' + passed + ' closure/matrix tests passed, 0 failed');
