import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createJourney, validateRegistration, journeyQuestions, participantDraftPreview, participantReport, commercialReport, type JourneyContext } from '../lib/questionnaire-engine/integration/journey';
import { canReadReport, type ReportActor } from '../lib/questionnaire-engine/integration/access';
import { commitValidatedJourney } from '../lib/questionnaire-engine/integration/completion';
import { MemoryCompletion } from './testing/memory-completion';
import { fixtureInput, fixtureNames, demoContext, demoReviewer } from './testing/fixtures';
import { preliminaryEducation, evaluateLocalOffer } from '../lib/questionnaire-engine/careers/demonstrate-career-links';
import { buildCourseMatrix } from '../lib/questionnaire-engine/careers/build-course-matrix';
import officialCases from '../lib/questionnaire-engine/__fixtures__/individual/cases.json';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const participant: ReportActor = { id: 'fictional-person', active: true, role: 'participant', participantId: demoContext.scope.participantId, institutionIds: [demoContext.scope.institutionId], unitIds: [] };
for (const f of officialCases.casos)
    test('integrated score and nine populated sections: ' + f.nome, () => {
        const j = createJourney(fixtureInput(f.nome), demoContext);
        assert.deepEqual(j.analysis.scores, f.pontuacao_esperada);
        assert.equal(j.analysis.evidence.length, 15);
        assert.equal(j.orientation.internal.examinedResponses.length, 15);
        assert.equal(participantDraftPreview(j, demoReviewer).sections.length, 9);
    });
test('registration valid, absence of education remains absence, same field codes as application', () => {
    const r = validateRegistration(fixtureInput().registration);
    assert.equal(r.escolaridade, null);
    assert.equal(r.orientationMode, 'undefined_interest');
});
test('invalid registration and privileged fields rejected', () => {
    for (const patch of [{ name: '' }, { email: 'bad' }, { phone: '1' }, { escolaridade: 'forged' }, { eligible: true }, { institution_id: 'other' }, { role: 'owner' }, { proofConfirmed: true }, { orientationMode: 'declared_interest' }, { orientationMode: 'area_undecided' }])
        assert.throws(() => validateRegistration({ ...fixtureInput().registration, ...patch }));
});
test('incomplete duplicate extra foreign and revision-mixed responses rejected', () => {
    const base = fixtureInput();
    for (const answers of [base.answers.slice(1), [...base.answers, base.answers[0]], [base.answers[0], ...base.answers.slice(0, 14)], base.answers.map((a, i) => i === 0 ? { ...a, alternativeId: 'Q02:A' } : a)])
        assert.throws(() => createJourney({ ...base, answers }, demoContext));
    assert.throws(() => createJourney({ ...base, revision: 'other' }, demoContext));
    assert.throws(() => createJourney({ ...base, eligible: true }, demoContext));
});
for (const [name, state] of [['Empate_principal', 'tied_main'], ['Empate_secundario', 'tied_secondary']] as const)
    test('integrated tie without forced pair: ' + state, () => {
        const j = createJourney(fixtureInput(name), demoContext);
        assert.equal(j.analysis.classification.state, state);
        assert.equal(j.analysis.classification.pair, null);
        assert.equal(j.readiness.missingSections.length, 0);
        assert.equal(j.readiness.unsafeSections.length, 0);
    });
test('same points different answers retain substantive differences in parts6 and7', () => {
    const a = createJourney(fixtureInput('Comparacao_A'), demoContext), b = createJourney(fixtureInput('Comparacao_B'), demoContext);
    assert.deepEqual(a.analysis.scores, b.analysis.scores);
    assert.deepEqual(a.analysis.classification, b.analysis.classification);
    for (const i of [5, 6])
        assert.notDeepEqual(a.editorial.participant.sections[i], b.editorial.participant.sections[i]);
    assert.notEqual(a.snapshot, b.snapshot);
    assert.notDeepEqual(commercialReport(a, demoReviewer).sections[3], commercialReport(b, demoReviewer).sections[3]);
});
test('deterministic and nonmutating integration; identical answers do not force differences', () => {
    const input = fixtureInput();
    const before = JSON.stringify(input), ctx = JSON.stringify(demoContext);
    assert.deepEqual(createJourney(input, demoContext), createJourney(input, demoContext));
    assert.equal(JSON.stringify(input), before);
    assert.equal(JSON.stringify(demoContext), ctx);
});
test('all evidence belongs to actual selected answers and stays internal', () => {
    const j = createJourney(fixtureInput(), demoContext), refs = new Set(j.analysis.evidence.map(e => e.id));
    for (const s of [...j.editorial.participant.sections, ...j.editorial.commercial.sections])
        for (const p of s.paragraphs)
            for (const r of p.evidenceRefs)
                assert(refs.has(r));
    const json = JSON.stringify(participantDraftPreview(j, demoReviewer));
    assert(!/evidenceRefs|ruleId|fictional-seller|whatsapp|followUp|Q0[1-9]|pending_carla/.test(json));
});
test('questionnaire projection has exactly15 questions and no weights', () => {
    const qs = journeyQuestions();
    assert.equal(qs.length, 15);
    assert(!/weights|scores/.test(JSON.stringify(qs)));
    assert.deepEqual(qs.map(q => q.number), Array.from({ length: 15 }, (_, i) => i + 1));
});
test('three orientation modes; no invented interest or padded courses', () => {
    const base = fixtureInput();
    let j = createJourney(base, demoContext);
    assert.equal(j.orientation.exploratoryCourses.length, 0);
    assert(j.orientation.experiments.length > 0);
    j = createJourney({ ...base, registration: { ...base.registration, orientationMode: 'declared_interest', course_interest: 'programação', escolaridade: 'ensino_medio_completo' } }, demoContext);
    assert(j.orientation.exploratoryCourses.some(c => /Desenvolvimento de Sistemas/.test(c.courseName)));
    j = createJourney({ ...base, registration: { ...base.registration, orientationMode: 'area_undecided', declaredArea: 'tecnologia', escolaridade: 'ensino_medio_completo' } }, demoContext);
    assert.equal(j.orientation.exploratoryCourses.length, 2);
    assert.notEqual(j.orientation.exploratoryCourses[0].whyIncluded, j.orientation.exploratoryCourses[1].whyIncluded);
});
for (const education of [null, 'ensino_medio_incompleto', 'ensino_medio_completo', 'cursando_graduacao', 'graduado', 'pos_graduado'])
    test('schooling outside scores and offers remain blocked: ' + education, () => {
        const input = fixtureInput();
        input.registration.escolaridade = education;
        input.registration.orientationMode = 'declared_interest';
        input.registration.course_interest = 'programação';
        input.registration.objective = 'especializar';
        const j = createJourney(input, demoContext), base = createJourney(fixtureInput(), demoContext);
        assert.deepEqual(j.analysis.scores, base.analysis.scores);
        assert.equal(j.orientation.activeOffers.length, 0);
        assert.equal(j.orientation.homologatedRecommendations.length, 0);
        const preview = participantDraftPreview(j, demoReviewer);
        assert(preview.courses.every(c => c.enrollmentOfferAllowed === false));
        if (!['graduado', 'pos_graduado'].includes(education || '')) {
            assert.equal(j.orientation.exploratoryCourses.filter(c => c.level === 'pos_graduacao').length, 0);
            assert.equal(preview.courses.filter(c => c.level === 'pos_graduacao').length, 0);
        }
        else {
            assert(j.orientation.exploratoryCourses.some(c => c.level === 'pos_graduacao'));
            assert(preview.courses.some(c => c.level === 'pos_graduacao'));
        }
        if (education === 'ensino_medio_incompleto')
            assert.equal(preliminaryEducation('graduacao', education), 'education_not_eligible');
    });
test('offer toggles cannot homologate proposed matrix or confirm enrollment', () => {
    const course = buildCourseMatrix().find(c => c.level === 'pos_graduacao')!;
    const result = evaluateLocalOffer(course, { institution: 'UNIFECAF SINOP', education: 'graduado', interests: [], objectives: [] }, { institution: 'UNIFECAF SINOP', courseId: course.id, globalPostEnabled: true, institutionEnabled: true, courseEnabled: true, unitEnabled: true, academicRequirementsChecked: true, verifiedEducationAtEnrollment: true, status: 'enabled' });
    assert.equal(result.allowed, false);
});
test('participant never obtains commercial or operator draft projection', () => {
    const j = createJourney(fixtureInput(), demoContext);
    assert.throws(() => commercialReport(j, participant));
    assert.throws(() => participantDraftPreview(j, participant));
    assert.equal(participantReport(j, participant).status, 'awaiting_homologation');
});
test('release mediated and no payload can bypass content or audience gate', () => {
    const j = createJourney(fixtureInput(), { ...demoContext, release: 'not_released' });
    assert.equal(participantReport(j, participant).status, 'not_released');
    assert.throws(() => createJourney({ ...fixtureInput(), released: true, contentHomologated: true }, demoContext));
    assert.equal(participantReport(j, { ...participant, participantId: 'another' }).status, 'forbidden');
});
test('tenant unit seller and global-owner scopes deny crossing or self-promotion', () => {
    const scope = demoContext.scope;
    const seller: ReportActor = { id: 'fictional-seller', active: true, role: 'seller', institutionIds: [scope.institutionId], unitIds: [scope.unitId!] };
    assert(canReadReport(seller, scope, 'commercial'));
    assert(!canReadReport({ ...seller, id: 'old-seller' }, scope, 'commercial'));
    assert(!canReadReport({ ...seller, unitIds: ['other'] }, scope, 'commercial'));
    assert(!canReadReport({ ...demoReviewer, institutionIds: ['other'] }, scope, 'commercial'));
    assert(!canReadReport({ ...demoReviewer, active: false }, scope, 'commercial'));
    assert(!canReadReport({ ...demoReviewer, role: 'platform_owner' }, scope, 'commercial'));
    assert(canReadReport({ ...demoReviewer, role: 'platform_owner', explicitGlobalOwner: true }, scope, 'commercial'));
    assert(!canReadReport({ ...demoReviewer, deniedActions: ['commercial_report'] }, scope, 'commercial'));
});
test('release reading and assignment changes do not change analytic snapshot or scores', () => {
    const a = createJourney(fixtureInput(), demoContext), b = createJourney(fixtureInput(), { ...demoContext, release: 'not_released', reading: 'disagreed', scope: { ...demoContext.scope, assignedUserId: 'new-seller' } });
    assert.equal(a.snapshot, b.snapshot);
    assert.equal(a.delivery.effectiveRelease, 'not_released');
    assert.equal(b.delivery.effectiveRelease, 'not_released');
    assert.notEqual(a.delivery.blockedReason, b.delivery.blockedReason);
    assert(!a.editorial.whatsapp.text.includes('já foi disponibilizado'));
    assert(!b.editorial.whatsapp.text.includes('Você comentou'));
});
test('draft gaps are explicit and empty participant sections never rendered', () => {
    const input = fixtureInput();
    input.answers = input.answers.map(a => ({ questionId: a.questionId, alternativeId: a.questionId + ':B' }));
    const j = createJourney(input, demoContext);
    assert.equal(j.readiness.productionReady, false);
    const p = participantDraftPreview(j, demoReviewer);
    assert(p.sections.every(s => s.paragraphs.length && s.paragraphs.every(t => t.trim())));
    assert.deepEqual(j.readiness.missingSections, [1, 5]);
    assert.equal(participantReport(j, participant).status, 'awaiting_homologation');
});
test('fictional atomic completion retry and concurrency debit once', async () => {
    const j = createJourney(fixtureInput(), demoContext), db = new MemoryCompletion('local-fictional', { [j.scope.institutionId]: 1 });
    const results = await Promise.all(Array.from({ length: 12 }, () => commitValidatedJourney(j, 'eval-1', db)));
    assert(results.every(r => r.state === 'committed'));
    assert.equal(results.filter(r => r.state === 'committed' && !r.replay).length, 1);
    assert.equal(db.balance(j.scope.institutionId), 0);
});
test('last fictional credit across two evaluations never goes negative', async () => {
    const j = createJourney(fixtureInput(), demoContext), db = new MemoryCompletion('local-fictional', { [j.scope.institutionId]: 1 });
    const results = await Promise.all(['eval-a', 'eval-b'].map(id => commitValidatedJourney(j, id, db)));
    assert.equal(results.filter(r => r.state === 'committed').length, 1);
    assert.equal(results.filter(r => r.state === 'no_credit').length, 1);
    assert.equal(db.balance(j.scope.institutionId), 0);
});
test('persistence failure consumes nothing and retry preserves same validated result', async () => {
    const j = createJourney(fixtureInput(), demoContext), db = new MemoryCompletion('local-fictional', { [j.scope.institutionId]: 1 });
    db.failNext = true;
    assert.equal((await commitValidatedJourney(j, 'eval', db)).state, 'persistence_failure');
    assert.equal(db.balance(j.scope.institutionId), 1);
    assert.equal((await commitValidatedJourney(j, 'eval', db)).state, 'committed');
    await assert.rejects(() => db.commit({ evaluationId: 'eval', institutionId: j.scope.institutionId, snapshotKey: 'different' }));
});
test('107 course artifact byte integrity preserved', () => {
    const h = createHash('sha256').update(readFileSync('docs/especificacoes-2026-10-26/fechamento-v2-matriz/MATRIZ-107-CURSOS.json')).digest('hex');
    assert.equal(h, '7063db0c9895f84230d22fa7eb290c43bf75feadaa0128bf7f5f5a4ab155a5f9');
    assert.equal(buildCourseMatrix().length, 107);
});
test('snapshot cannot be changed after validation before an atomic completion', () => { const j = createJourney(fixtureInput(), demoContext); assert(Object.isFrozen(j)); assert(Object.isFrozen(j.analysis.scores)); assert.throws(() => { j.analysis.scores.E = 999; }); assert.throws(() => { j.editorial.participant.sections[0].paragraphs[0].text = 'forged'; }); });
