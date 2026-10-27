import experiments from './orientation-experiments.json';
import examples from './orientation-examples.json';
import { buildCourseMatrix } from './build-course-matrix';
import { preliminaryEducation, evaluateLocalOffer, AUTHORIZED_POST_INSTITUTIONS } from './demonstrate-career-links';
import type { OrientationAnalysis, OrientationContext, ProfessionalOrientation, ExploratoryCourse, OrientationOfferContext } from './orientation-types';
const VERSION = 'dna-professional-orientation-local-2026-10-26.v1';
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
export function orientProfessionally(a: OrientationAnalysis, context: OrientationContext, offers: OrientationOfferContext = []): ProfessionalOrientation {
    if (!['declared_interest', 'area_undecided', 'undefined_interest'].includes(context.situation) || !Array.isArray(context.interests) || !Array.isArray(context.objectives) || context.interests.some(s => typeof s !== 'string' || !s.trim()) || context.objectives.some(s => typeof s !== 'string' || !s.trim()))
        throw new Error('Invalid explicit orientation context');
    if (a.evidence.length !== 15 || new Set(a.evidence.map(e => e.questionId)).size !== 15 || a.evidence.some(e => e.revision !== a.revision))
        throw new Error('Fifteen revision-bound responses required');
    if (context.situation === 'undefined_interest' && (context.interests.length || context.declaredArea?.trim()))
        throw new Error('Undefined interest cannot overwrite an explicit interest or area');
    if (context.situation === 'area_undecided' && !context.declaredArea?.trim())
        throw new Error('Area must be declared by participant');
    if (context.situation === 'declared_interest' && !context.interests.length)
        throw new Error('Interest must be declared by participant');
    const ctx: OrientationContext = { ...context, interests: [...context.interests], objectives: [...context.objectives] };
    const matrix = buildCourseMatrix();
    const e = (q: string) => a.evidence.find(e => e.questionId === q)!;
    const matched = experiments.filter(r => Object.entries(r.when).every(([q, l]) => e(q)?.letter === l));
    // Pick a motivation lens, a learning lens and one other setting: reviewable themes, never a career ranking.
    const primary = [matched.find(r => 'Q05' in r.when), matched.find(r => 'Q06' in r.when), matched.find(r => !('Q05' in r.when) && !('Q06' in r.when))].filter((r): r is NonNullable<typeof r> => !!r);
    const selected = new Set(primary.map(r => r.id));
    const activityOutputs = primary.map(r => ({ id: r.id, theme: r.theme, observation: r.observation, experience: r.experience, question: r.question, professionalActivity: r.professionalActivity, evidenceRefs: Object.keys(r.when).map(q => e(q).id), approval: 'proposed_pending_carla' as const, inferredInterest: false as const }));
    const pending = ['Experiências e associações são propostas locais a revisar por Carla; não equivalem a aptidão ou recomendação homologada.'];
    const questions: string[] = [];
    if (!ctx.education)
        questions.push('Qual é sua escolaridade atual? Antes de oferecer pós, precisamos confirmar se a graduação foi concluída.');
    if (!ctx.objectives.length)
        questions.push('O que você gostaria de descobrir agora: conhecer uma atividade, iniciar uma formação ou aprofundar algo que já faz?');
    if (ctx.situation === 'undefined_interest')
        questions.push('Depois de observar ou experimentar uma dessas tarefas, alguma despertou vontade de conhecer melhor? Você também pode dizer que nenhuma chamou atenção.');
    const excluded: ProfessionalOrientation['internal']['excluded'] = [], courses: ExploratoryCourse[] = [];
    if (ctx.situation !== 'undefined_interest')
        for (const proposal of examples) {
            const course = matrix.find(c => c.name === proposal.name && c.level === proposal.level);
            if (!course)
                throw new Error('Course must exist in preserved matrix');
            const matchedInterests = ctx.interests.filter(value => proposal.declared.some(term => normalize(term) === normalize(value)) || normalize(value) === normalize(course.name));
            const matchedArea = ctx.situation === 'area_undecided' && proposal.area.some(area => normalize(area) === normalize(ctx.declaredArea || ''));
            if (!matchedInterests.length && !matchedArea)
                continue;
            if (ctx.objectives.length && !ctx.objectives.some(v => proposal.goals.some(g => normalize(g) === normalize(v)))) {
                excluded.push({ courseName: course.name, reason: 'Objetivo declarado não está contemplado neste exemplo limitado; não forçar associação.' });
                continue;
            }
            const schooling = preliminaryEducation(course.level, ctx.education);
            if (course.level === 'pos_graduacao' && schooling !== 'education_declared_eligible') {
                excluded.push({ courseName: course.name, reason: schooling === 'education_pending' ? 'Coletar escolaridade antes de associar pós.' : 'Escolaridade sem graduação/pós concluída: não incluir pós como opção.' });
                continue;
            }
            if (course.level === 'pos_graduacao' && !AUTHORIZED_POST_INSTITUTIONS.includes(ctx.institution as typeof AUTHORIZED_POST_INSTITUTIONS[number])) {
                excluded.push({ courseName: course.name, reason: 'Instituição fora do escopo comercial aprovado.' });
                continue;
            }
            const notes = ['Descrição acadêmica recebida; requisitos específicos e oferta atual ainda não conferidos.'];
            if (!ctx.objectives.length)
                notes.push('Objetivo ainda não declarado; a opção serve só para investigar o interesse informado.');
            if (schooling !== 'education_declared_eligible')
                notes.push('Escolaridade pendente ou insuficiente para afirmar ingresso; exploração não é oferta de matrícula.');
            if (course.level === 'pos_graduacao')
                notes.push(ctx.priorCourse ? 'Formação anterior declarada: ' + ctx.priorCourse + '. Confirmar se é aceita pelo curso e verificar demais requisitos; não presumir compatibilidade.' : 'Informar formação de origem e confirmar requisitos específicos da especialização.');
            const interestBasis = matchedInterests.length ? 'Você declarou interesse em ' + matchedInterests.join(', ') : 'Você declarou conhecer a área ' + ctx.declaredArea + ' e querer investigar possibilidades dentro dela';
            const why = interestBasis + '. Na descrição recebida de ' + course.name + ', o ponto concreto para comparar é: ' + proposal.difference;
            const q05 = e('Q05'), q06 = e('Q06');
            let prompt: string;
            if (q05.letter === 'D')
                prompt = 'Ao investigar “' + proposal.task + '”, peça que mostrem onde a explicação é usada nessa tarefa. Isso dialoga com a utilidade que faltou no projeto lembrado, sem afirmar interesse novo ou aptidão.';
            else if (q05.letter === 'B')
                prompt = 'Ao conhecer “' + proposal.task + '”, pergunte como é a rotina necessária para aprender essa atividade e veja se ela caberia hoje na sua semana. Sua resposta passada não confirma falta de tempo atual.';
            else if (q05.letter === 'C')
                prompt = 'Ao conhecer “' + proposal.task + '”, pergunte quais etapas de aprendizado podem ser observadas. Isso ajuda a investigar progresso nessa tarefa, sem prometer resultados rápidos.';
            else
                prompt = 'Ao conhecer “' + proposal.task + '”, pergunte como ela é na rotina, depois da novidade inicial. Observe se a atividade em si desperta interesse.';
            const refs = [q05.id];
            if (q06.letter === 'A') {
                prompt += ' Antes de tentar, peça uma explicação da sequência específica dessa tarefa.';
                refs.push(q06.id);
            }
            else if (q06.letter === 'B') {
                prompt += ' Se quiser, experimente uma etapa introdutória sem risco com orientação.';
                refs.push(q06.id);
            }
            else if (q06.letter === 'C') {
                prompt += ' Uma conversa com quem realiza a tarefa pode ajudar a esclarecer dúvidas.';
                refs.push(q06.id);
            }
            const gate = evaluateLocalOffer(course, ctx, offers.find(o => o.courseId === course.id));
            courses.push({ courseId: course.id, courseName: course.name, level: course.level, proposalId: proposal.id, status: 'exploratory_unhomologated', whyIncluded: why, concreteActivity: proposal.task, whatToInvestigate: proposal.investigate, differenceToCompare: proposal.difference, individualPrompt: { text: prompt, evidenceRefs: refs }, sources: { sourceId: course.sourceId, descriptions: course.sourceDescriptions, urls: course.sourceURLs, externalVerification: 'not_performed' }, origins: { declaredInterests: matchedInterests, declaredArea: matchedArea ? ctx.declaredArea! : null, declaredObjectives: [...ctx.objectives], declaredEducation: ctx.education || null, declaredPriorCourse: ctx.priorCourse || null, responsesUsed: refs }, admission: { educationState: schooling, priorFormationReview: course.level === 'pos_graduacao' ? 'requires_academic_review' : 'not_a_universal_requirement', specificRequirements: 'unknown', pending: notes }, enrollmentOfferAllowed: false, offerBlockers: gate.reasons });
        }
    if (courses.length > 5)
        throw new Error('Exploratory scope exceeded; narrow examples before presenting more than five');
    if (ctx.situation !== 'undefined_interest' && !courses.length)
        questions.push('Este lote ainda não tem uma associação revisável para os dados informados. Que atividade da área você gostaria de conhecer primeiro?');
    if (ctx.situation === 'area_undecided')
        questions.push('Entre as atividades apresentadas, qual você gostaria de observar primeiro? Pode não ser nenhuma delas.');
    if (!activityOutputs.length)
        pending.push('As 15 respostas foram examinadas, mas este lote não contém experiência condicional suficiente para essas escolhas. Coletar uma situação concreta que a pessoa queira investigar.');
    return { version: VERSION, mode: ctx.situation, approval: 'pending_carla', productionReady: false, introduction: ctx.situation === 'undefined_interest' ? 'Você não precisa chegar com uma profissão em mente. Podemos começar por uma experiência pequena e observar o que ela desperta em você, sem concluir que seu jeito de responder determina uma carreira.' : ctx.situation === 'area_undecided' ? 'Conhecer uma área não obriga a escolher um curso imediatamente. Compare atividades reais e veja quais perguntas cada uma desperta.' : 'Vamos partir do interesse que você informou e conhecer uma atividade concreta, antes de tratar o nome de um curso como uma decisão.', experiments: activityOutputs, exploratoryCourses: courses, homologatedRecommendations: [], activeOffers: [], questions, pending, internal: { examinedResponses: a.evidence.map(ev => { const checks = experiments.filter(r => Object.keys(r.when).includes(ev.questionId) && Object.entries(r.when).every(([q, l]) => e(q)?.letter === l)); return { questionId: ev.questionId, alternativeId: ev.alternativeId, matchingRules: checks.map(r => r.id), selectedRules: checks.filter(r => selected.has(r.id)).map(r => r.id), reason: checks.length ? checks.some(r => selected.has(r.id)) ? 'Experiência selecionada' : 'Condição encontrada; tema não priorizado para evitar lista extensa.' : 'Resposta examinada; não há experiência fundamentada correspondente neste lote.' }; }), matrixCount: 107, courseScope: 3, declaredContext: ctx, excluded, sourceOfAuthority: 'local_synthetic_context_no_production_authorization', selectionPolicy: 'Prioridade editorial de teste: situação do projeto, forma de aprender e uma outra cena. Sem ranqueamento de profissões e sem inferir interesse.' } };
}
