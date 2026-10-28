import {profileDisplaySummary} from './profile-summary';
import { createHash } from 'node:crypto';
import officialQuestions from '../__fixtures__/individual/questions.json';
import { createIndividualInstrument } from '../individual/instrument';
import { analyzeIndividual } from '../individual/analyze-individual';
import { closeEditorialV2 } from '../individual/editorial/close-editorial-v2';
import { orientProfessionally } from '../careers/professional-orientation';
import { ESCOLARIDADE_OPTIONS } from '../../dna-data';
import { validateParticipantBody } from '../../questionnaire-platform/participant-validators';
import { canReadReport, type ReportActor, type ReportScope } from './access';
import type { Answer } from '../types';
import type { OrientationContext } from '../careers/orientation-types';
export const INTEGRATED_REVISION = 'dna-official-2026-10-26.v1';
export const JOURNEY_VERSION = 'dna-integration-local-1.0';
const instrument = createIndividualInstrument(officialQuestions, INTEGRATED_REVISION);
export type Registration = {
    name: string;
    phone: string;
    email: string;
    city: string | null;
    escolaridade: string | null;
    course_interest: string | null;
    objective: string | null;
    priorCourse: string | null;
    orientationMode: OrientationContext['situation'];
    declaredArea: string | null;
};
export type JourneyContext = {
    scope: ReportScope;
    institutionName: string;
    unitName?: string;
    release: 'released' | 'not_released';
    reading: 'unknown' | 'not_read' | 'identified' | 'disagreed';
};
export class JourneyInputError extends Error {
}
function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new JourneyInputError('Formato inválido.');
    return value as Record<string, unknown>;
}
function exactKeys(r: Record<string, unknown>, keys: string[]) {
    if (Object.keys(r).some(k => !keys.includes(k)))
        throw new JourneyInputError('Campo não permitido.');
}
function optionalText(v: unknown): string | null {
    if (v === undefined || v === null || v === '')
        return null;
    if (typeof v !== 'string' || v.length > 500)
        throw new JourneyInputError('Texto de cadastro inválido.');
    return v.trim() || null;
}
export function validateRegistration(value: unknown): Registration {
    const r = record(value);
    exactKeys(r, ['name', 'phone', 'email', 'city', 'escolaridade', 'course_interest', 'objective', 'priorCourse', 'orientationMode', 'declaredArea']);
    for (const key of ['name', 'phone', 'email'])
        if (typeof r[key] !== 'string' || !(r[key] as string).trim() || (r[key] as string).length > 250)
            throw new JourneyInputError('Nome, telefone e e-mail válidos são obrigatórios.');
    const education = optionalText(r.escolaridade);
    if (education && !ESCOLARIDADE_OPTIONS.some(o => o.value === education))
        throw new JourneyInputError('Escolaridade inválida.');
    const common = validateParticipantBody({ ...r, questionnaire_id: INTEGRATED_REVISION, escolaridade: education || 'não informada' });
    if (!common.ok)
        throw new JourneyInputError(common.error);
    if (!['declared_interest', 'area_undecided', 'undefined_interest'].includes(r.orientationMode as string))
        throw new JourneyInputError('Informe como deseja explorar possibilidades.');
    const course_interest = optionalText(r.course_interest), declaredArea = optionalText(r.declaredArea);
    if (r.orientationMode === 'declared_interest' && !course_interest)
        throw new JourneyInputError('Informe o interesse declarado.');
    if (r.orientationMode === 'area_undecided' && !declaredArea)
        throw new JourneyInputError('Informe a área declarada.');
    if (r.orientationMode === 'undefined_interest' && (course_interest || declaredArea))
        throw new JourneyInputError('Não apagar interesse ou área declarados.');
    return { name: common.data.name, phone: common.data.phone, email: common.data.email, city: optionalText(r.city), escolaridade: education, course_interest, objective: optionalText(r.objective), priorCourse: optionalText(r.priorCourse), orientationMode: r.orientationMode as Registration['orientationMode'], declaredArea };
}
export function journeyQuestions() {
    return instrument.questions.map(q => ({ id: 'Q' + String(q.number).padStart(2, '0'), number: q.number, title: q.title, situation: q.situation, options: q.options.map(o => ({ id: 'Q' + String(q.number).padStart(2, '0') + ':' + o.letter, letter: o.letter, text: o.text })) }));
}
function freezeSnapshot<T>(value: T): T {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        for (const child of Object.values(value))
            freezeSnapshot(child);
        Object.freeze(value);
    }
    return value;
}
export function createJourney(input: unknown, trusted: JourneyContext) {
    const data = record(input);
    exactKeys(data, ['revision', 'registration', 'answers']);
    if (data.revision !== INTEGRATED_REVISION)
        throw new JourneyInputError('Revisão inválida.');
    if (!trusted.scope.participantId || !trusted.scope.institutionId || !trusted.institutionName || !['released', 'not_released'].includes(trusted.release) || !['unknown', 'not_read', 'identified', 'disagreed'].includes(trusted.reading))
        throw new JourneyInputError('Contexto de serviço inválido.');
    const registration = validateRegistration(data.registration);
    if (!Array.isArray(data.answers))
        throw new JourneyInputError('Informe as 15 respostas.');
    for (const answer of data.answers)
        exactKeys(record(answer), ['questionId', 'alternativeId']);
    const analysis = analyzeIndividual(instrument, { revision: INTEGRATED_REVISION, answers: data.answers as Answer[], declared: {
            ...(registration.course_interest ? { interest: registration.course_interest } : {}),
            ...(registration.escolaridade ? { education: registration.escolaridade } : {}),
            ...(registration.objective ? { objective: registration.objective } : {}),
            ...(registration.priorCourse ? { priorCourse: registration.priorCourse } : {})
        } });
    // This integration contains drafts only. Delivery configuration and a declared
    // reading never authorize access to unhomologated content.
    const delivery = { release: trusted.release, reading: trusted.reading,
        effectiveRelease: 'not_released' as const,
        blockedReason: trusted.release === 'not_released' ? 'mediated_delivery' as const : 'awaiting_homologation' as const };
    const editorial = closeEditorialV2(analysis, { release: delivery.effectiveRelease, reading: 'unknown' });
    const orientation = orientProfessionally(analysis, { institution: trusted.institutionName, ...(trusted.unitName ? { unit: trusted.unitName } : {}), education: registration.escolaridade || undefined, priorCourse: registration.priorCourse || undefined, interests: registration.course_interest ? [registration.course_interest] : [], objectives: registration.objective ? [registration.objective] : [], situation: registration.orientationMode, declaredArea: registration.declaredArea || undefined });
    const sections = editorial.participant.sections.map(s => ({ number: s.number, title: s.title, paragraphs: s.paragraphs.map(p => p.text).filter(p => p.trim()) }));
    const missingSections = sections.filter(s => !s.paragraphs.length).map(s => s.number);
    const forbidden = /Q\d{2}|ruleId|evidenceRefs|pending_|productionReady|homologa|fixtures|pipeline|dois participantes|desenvolvimento interno/i;
    const unsafeSections = sections.filter(s => forbidden.test(s.paragraphs.join(' '))).map(s => s.number);
    const snapshot = createHash('sha256').update(JSON.stringify({ version: JOURNEY_VERSION, analysis: analysis.analysisKey, editorial: editorial.version, orientation: orientation.version, registration, participantId: trusted.scope.participantId, institutionId: trusted.scope.institutionId })).digest('hex');
    return freezeSnapshot({ snapshot, version: JOURNEY_VERSION, registration, scope: { ...trusted.scope }, delivery,
        analysis, editorial, orientation,
        readiness: { productionReady: false as const, contentHomologated: false as const, missingSections, unsafeSections,
            blockers: ['Homologação editorial e metodológica da Carla pendente.', 'Associações e requisitos acadêmicos pendentes.', ...missingSections.map(n => 'Seção ' + n + ' sem conteúdo suficiente.'), ...unsafeSections.map(n => 'Seção ' + n + ' contém texto inadequado à saída do participante.')] }
    });
}
export type IntegratedJourney = ReturnType<typeof createJourney>;
export function participantReport(j: IntegratedJourney, actor: ReportActor | null) {
    if (!canReadReport(actor, j.scope, 'participant'))
        return { status: 'forbidden' as const };
    if (j.delivery.release !== 'released')
        return { status: 'not_released' as const };
    // Local drafts can never be promoted to public content through a request flag.
    return { status: 'awaiting_homologation' as const };
}
/** Operator-only local preview. Do not wire this function to a public endpoint. */
export function participantDraftPreview(j: IntegratedJourney, actor: ReportActor | null) {
    if (!canReadReport(actor, j.scope, 'commercial'))
        throw new JourneyInputError('Prévia restrita à equipe autorizada.');
    const valid = j.editorial.participant.sections.filter(s => !j.readiness.missingSections.includes(s.number) && !j.readiness.unsafeSections.includes(s.number));
    return { audience: 'participant' as const, name: j.registration.name, profiles: profileDisplaySummary(j.analysis), scores: { ...j.analysis.scores }, classification: JSON.parse(JSON.stringify(j.analysis.classification)) as typeof j.analysis.classification,
        sections: valid.map(s => ({ number: s.number, title: s.title, paragraphs: s.paragraphs.map(p => p.text).filter(t => t.trim()) })),
        orientation: { introduction: j.orientation.introduction, experiments: j.orientation.experiments.map(e => ({ theme: e.theme, observation: e.observation, experience: e.experience, question: e.question, professionalActivity: e.professionalActivity })), questions: j.orientation.questions.filter(t => t.trim()) },
        courses: j.orientation.exploratoryCourses.map(c => ({ name: c.courseName, level: c.level, why: c.whyIncluded, activity: c.concreteActivity, investigate: c.whatToInvestigate, individualPrompt: c.individualPrompt.text, enrollmentOfferAllowed: false as const }))
    };
}
export function commercialReport(j: IntegratedJourney, actor: ReportActor | null) {
    if (!canReadReport(actor, j.scope, 'commercial'))
        throw new JourneyInputError('Relatório comercial não autorizado.');
    return { audience: 'commercial' as const, registration: { ...j.registration }, delivery: { ...j.delivery },
        sections: j.editorial.commercial.sections.map(s => ({ number: s.number, title: s.title, paragraphs: s.paragraphs.map(p => p.text).filter(p => p.trim()) })).filter(s => s.paragraphs.length),
        whatsapp: { ...j.editorial.whatsapp }, exploration: j.orientation.exploratoryCourses, experiments: j.orientation.experiments,
        followUp: { status: 'Aguardando atendimento', responsible: j.scope.assignedUserId, interactions: [] as never[], nextContact: null, enrollmentConfirmed: false },
        review: { ...j.readiness }, evidence: j.editorial.internal.selectedRules, responseAudit: j.orientation.internal.examinedResponses
    };
}
