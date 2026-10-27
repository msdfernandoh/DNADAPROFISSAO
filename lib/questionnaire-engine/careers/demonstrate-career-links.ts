import { buildCourseMatrix } from './build-course-matrix';
import proposals from './candidate-proposals.json';
import type { CandidateRule, CareerAnalysis, CareerContext, CareerDemo, CourseMatrixRow, OfferContext } from './types';
export const AUTHORIZED_POST_INSTITUTIONS = ['UNIFECAF SINOP', 'UNIFECAF LUCAS DO RIO VERDE', 'UNIFECAF SORRISO', 'UNIFECAF NOVA MUTUM'] as const;
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
export function preliminaryEducation(level: CourseMatrixRow['level'], education?: string): 'education_declared_eligible' | 'education_pending' | 'education_not_eligible' {
    if (!education)
        return 'education_pending';
    const allowed = level === 'pos_graduacao' ? ['graduado', 'pos_graduado'] : ['ensino_medio_completo', 'cursando_graduacao', 'graduado', 'pos_graduado'];
    return allowed.includes(education) ? 'education_declared_eligible' : 'education_not_eligible';
}
/** Internal trusted context only. This is not an API that accepts authority from a browser. */
export function evaluateLocalOffer(course: CourseMatrixRow, context: CareerContext, offer: OfferContext | undefined) {
    const reasons: string[] = [];
    if (preliminaryEducation(course.level, context.education) !== 'education_declared_eligible')
        reasons.push('schooling_not_confirmed_eligible');
    if (course.level === 'pos_graduacao' && !AUTHORIZED_POST_INSTITUTIONS.includes(context.institution as typeof AUTHORIZED_POST_INSTITUTIONS[number]))
        reasons.push('institution_not_in_approved_post_scope');
    if (!offer || offer.institution !== context.institution || offer.unit !== context.unit || offer.courseId !== course.id)
        reasons.push('no_matching_trusted_offer');
    if (offer) {
        if (offer.status !== 'enabled' || !offer.institutionEnabled || !offer.courseEnabled || !offer.unitEnabled || (course.level === 'pos_graduacao' && !offer.globalPostEnabled))
            reasons.push('offer_disabled_or_unconfirmed');
        if (!offer.academicRequirementsChecked)
            reasons.push('specific_requirements_pending');
        if (course.level === 'pos_graduacao' && !offer.verifiedEducationAtEnrollment)
            reasons.push('degree_proof_required_at_enrollment');
    }
    // Received matrix is not academically verified or methodologically approved. Never convert the demo into a real offer.
    reasons.push('matrix_associations_not_homologated');
    return { allowed: false as const, reasons };
}
export function demonstrateCareerLinks(analysis: CareerAnalysis, context: CareerContext): CareerDemo {
    const matrix = buildCourseMatrix(), questions: string[] = [], excluded: CareerDemo['excluded'] = [];
    if (!context.interests.length)
        questions.push('Quais áreas ou atividades você tem interesse em conhecer?');
    if (!context.objectives.length)
        questions.push('O que você procura com uma formação neste momento?');
    if (!context.education)
        questions.push('Qual é sua escolaridade atual? Precisamos dessa informação antes de apresentar opções de matrícula em pós.');
    if (!context.interests.length || !context.objectives.length)
        return { mode: 'review_only', productionRecommendations: [], proposedCandidates: [], questions, excluded, unresolvedSelection: false };
    const rules = proposals as CandidateRule[];
    const candidates: CareerDemo['proposedCandidates'] = [];
    for (const rule of rules) {
        const course = matrix.find(c => c.level === rule.level && c.name === rule.courseName);
        if (!course)
            throw new Error('Proposal references missing official course');
        const interests = context.interests.filter(v => rule.interestTerms.some(term => normalize(v) === normalize(term) || normalize(v) === normalize(course.name)));
        const objectives = context.objectives.filter(v => rule.objectiveTerms.some(term => normalize(v) === normalize(term)));
        if (!interests.length || !objectives.length)
            continue;
        const eligibility = preliminaryEducation(course.level, context.education);
        if (course.level === 'pos_graduacao' && eligibility !== 'education_declared_eligible') {
            excluded.push({ courseId: course.id, reason: eligibility === 'education_pending' ? 'Informar escolaridade antes de sugerir pós.' : 'Escolaridade não elegível para pós.' });
            continue;
        }
        if (course.level === 'pos_graduacao' && !AUTHORIZED_POST_INSTITUTIONS.includes(context.institution as typeof AUTHORIZED_POST_INSTITUTIONS[number])) {
            excluded.push({ courseId: course.id, reason: 'Instituição fora da autorização comercial de pós desta demonstração.' });
            continue;
        }
        const behavioralExplanation: CareerDemo['proposedCandidates'][number]['behavioralExplanation'] = [];
        const q05 = analysis.evidence.find(e => e.questionId === 'Q05'), q06 = analysis.evidence.find(e => e.questionId === 'Q06');
        if (q05?.letter === 'D')
            behavioralExplanation.push({ text: 'Para investigar esta possibilidade que já despertou interesse declarado, peça um exemplo de atividade em que o conteúdo seja aplicado. A resposta sobre utilidade ajuda a orientar a pergunta, não prova afinidade profissional.', evidenceRefs: [q05.id], doesNotCertifyAptitude: true });
        if (q05?.letter === 'B')
            behavioralExplanation.push({ text: 'Ao investigar a área que você declarou, vale conferir a rotina de aprendizagem e como ela poderia caber hoje na semana. A situação lembrada não comprova falta de tempo atual.', evidenceRefs: [q05.id], doesNotCertifyAptitude: true });
        if (q05?.letter === 'C')
            behavioralExplanation.push({ text: 'Na área de interesse declarada, pergunte quais etapas permitem acompanhar o aprendizado. A resposta sobre progresso não demonstra aptidão para esse curso.', evidenceRefs: [q05.id], doesNotCertifyAptitude: true });
        if (q06?.letter === 'A')
            behavioralExplanation.push({ text: 'Uma explicação de como o percurso se organiza pode ajudar a investigar essa opção antes de experimentar uma tarefa.', evidenceRefs: [q06.id], doesNotCertifyAptitude: true });
        candidates.push({ courseRationale: rule.sourceRationale, courseId: course.id, courseName: course.name, level: course.level, ruleId: rule.id, approval: 'proposed_pending_carla', basis: { interest: interests, objective: objectives, sourceId: course.sourceId }, behavioralExplanation, explorationOnly: true, enrollmentOfferAllowed: false, eligibility, pending: ['Associação de interesse/objetivo ainda não homologada por Carla.', 'Formação anterior e requisitos específicos precisam de conferência.', 'Oferta comercial real não foi consultada/habilitada.'] });
    }
    // No arbitrary numerical compatibility or alphabetical tie breaker. Ask to narrow interests rather than truncate an unexplained ranking.
    if (candidates.length > 5) {
        questions.push('Há mais de cinco possibilidades preliminares. Quais áreas você quer priorizar antes de selecionar até cinco caminhos?');
        return { mode: 'review_only', productionRecommendations: [], proposedCandidates: [], questions, excluded, unresolvedSelection: true };
    }
    return { mode: 'review_only', productionRecommendations: [], proposedCandidates: candidates, questions, excluded, unresolvedSelection: false };
}
