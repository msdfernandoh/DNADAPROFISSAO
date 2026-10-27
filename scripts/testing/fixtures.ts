import fixtures from '../../lib/questionnaire-engine/__fixtures__/individual/cases.json';
import { answersFromLetters } from '../../lib/questionnaire-engine/individual/instrument';
import { INTEGRATED_REVISION, type JourneyContext, type Registration } from '../../lib/questionnaire-engine/integration/journey';
import type { ReportActor } from '../../lib/questionnaire-engine/integration/access';
export const demoContext: JourneyContext = { scope: { participantId: 'fictional-participant', institutionId: 'fictional-institution-A', unitId: 'fictional-unit-A', assignedUserId: 'fictional-seller' }, institutionName: 'UNIFECAF SINOP', unitName: 'Unidade fictícia de demonstração', release: 'released', reading: 'unknown' };
export const demoReviewer: ReportActor = { id: 'fictional-reviewer', active: true, role: 'institution_admin', institutionIds: [demoContext.scope.institutionId], unitIds: [] };
export function fixtureInput(name = 'Ana') {
    const variants: Record<string, string> = { Interesse_programacao: 'Beatriz', Area_tecnologia: 'Ana', Pos_graduacao: 'Beatriz' };
    const fixture = fixtures.casos.find(f => f.nome === (variants[name] || name));
    const vector = name === 'Empate_principal' ? 'ACBEDDCAADCBBCC' : name === 'Empate_secundario' ? 'CAADDDBACCCACCE' : null;
    if (!fixture && !vector)
        throw new Error('Unknown fictional fixture');
    const registration: Registration = { name: name + ' (fictícia)', email: 'personagem@example.invalid', phone: '00000000000', city: null, escolaridade: null, course_interest: null, objective: null, priorCourse: null, orientationMode: 'undefined_interest', declaredArea: null };
    if (name === 'Interesse_programacao')
        Object.assign(registration, { orientationMode: 'declared_interest', course_interest: 'programação', escolaridade: 'ensino_medio_completo', objective: 'primeira formação' });
    if (name === 'Area_tecnologia')
        Object.assign(registration, { orientationMode: 'area_undecided', declaredArea: 'tecnologia', escolaridade: 'ensino_medio_completo' });
    if (name === 'Pos_graduacao')
        Object.assign(registration, { orientationMode: 'declared_interest', course_interest: 'programação', escolaridade: 'graduado', priorCourse: 'Análise e Desenvolvimento de Sistemas', objective: 'especializar' });
    return { revision: INTEGRATED_REVISION, registration, answers: vector ? answersFromLetters(Object.fromEntries([...vector].map((l, i) => ['Q' + String(i + 1).padStart(2, '0'), l]))) : answersFromLetters(fixture!.respostas) };
}
export const fixtureNames = [...fixtures.casos.map(f => f.nome), 'Empate_principal', 'Empate_secundario', 'Interesse_programacao', 'Area_tecnologia', 'Pos_graduacao'];
