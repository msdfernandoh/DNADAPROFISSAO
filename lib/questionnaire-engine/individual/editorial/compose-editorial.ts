import { createHash } from 'node:crypto';
import type { IndividualAnalysis, Evidence } from '../types';
import { SECTION_TITLES } from '../provided-content';
import draftRules from './draft-rules.json';
import type { EditorialRule, EditorialPreview, EditorialParagraph, EditorialSection } from './types';
export const EDITORIAL_VERSION = 'dna-editorial-preview-2026-10-26.v1';
function parseRules(raw: unknown): EditorialRule[] {
    if (!Array.isArray(raw))
        throw new Error('Invalid editorial package');
    const ids = new Set<string>();
    return raw.map((value: unknown) => {
        if (!value || typeof value !== 'object')
            throw new Error('Invalid editorial rule');
        const r = value as Record<string, unknown>;
        if (typeof r.id !== 'string' || ids.has(r.id) || !Number.isInteger(r.section) || typeof r.theme !== 'string' || !r.when || typeof r.when !== 'object' || Array.isArray(r.when) || !Array.isArray(r.paragraphs) || !r.paragraphs.length || r.paragraphs.some(p => typeof p !== 'string' || !p.trim()))
            throw new Error('Invalid editorial rule fields');
        ids.add(r.id);
        const when: Record<string, string> = {};
        for (const [q, l] of Object.entries(r.when)) {
            if (!/^Q(0[1-9]|1[0-5])$/.test(q) || typeof l !== 'string' || !/^[A-E]$/.test(l))
                throw new Error('Invalid editorial condition');
            when[q] = l;
        }
        if (!Object.keys(when).length)
            throw new Error('Evidence condition required');
        if (r.kind !== undefined && r.kind !== 'contextual')
            throw new Error('Invalid editorial kind');
        return { id: r.id, section: r.section as number, theme: r.theme, when, paragraphs: r.paragraphs as string[], ...(r.kind === 'contextual' ? { kind: 'contextual' as const } : {}) };
    });
}
const rules = parseRules(draftRules);
const profileNames: Record<string, string> = { L: 'Liderança e Negócios', C: 'Comunicador e Influente', E: 'Estratégico e Analítico', H: 'Humanizado e Desenvolvimento', P: 'Prático e Operacional' };
export function composeEditorialPreview(analysis: IndividualAnalysis): EditorialPreview {
    if (analysis.evidence.length !== 15 || new Set(analysis.evidence.map(e => e.questionId)).size !== 15)
        throw new Error('Editorial preview requires 15 examined responses');
    const evidence = analysis.evidence;
    const get = (q: string) => evidence.find(e => e.questionId === q);
    if (evidence.some(e => e.revision !== analysis.revision))
        throw new Error('Mixed evidence revisions');
    const matches = (when: Record<string, string>) => Object.entries(when).every(([q, l]) => get(q)?.letter === l);
    const refs = (qs: string[]) => qs.map(q => { const e = get(q); if (!e)
        throw new Error('Missing evidence ' + q); return e.id; });
    const gaps: EditorialPreview['internal']['gaps'] = [];
    const selected: EditorialPreview['internal']['selectedRules'] = [];
    const paragraph = (text: string, ruleId: string, questions: string[], use: 'deepening' | 'synthesis' = 'synthesis', claimType: EditorialParagraph['claimType'] = 'contextual_interpretation'): EditorialParagraph => ({ text, ruleId, evidenceRefs: refs(questions), claimType, use });
    const sections: EditorialSection[] = SECTION_TITLES.map((title, i) => ({ number: i + 1, title, paragraphs: [] }));
    for (const section of sections) {
        const candidates = rules.filter(r => r.section === section.number && matches(r.when));
        if (candidates.length > 1)
            throw new Error('Ambiguous editorial rules for section ' + section.number);
        const r = candidates[0];
        if (!r)
            continue;
        section.paragraphs = r.paragraphs.map((text, i) => paragraph(text, r.id, Object.keys(r.when), 'deepening', i === r.paragraphs.length - 1 ? 'reflection' : 'contextual_interpretation'));
        selected.push({ id: r.id, section: r.section, theme: r.theme, evidenceRefs: refs(Object.keys(r.when)) });
    }
    const cls = analysis.classification;
    const classificationText = cls.pair ? 'Nesta avaliação, as duas forças que mais receberam pontos foram ' + profileNames[cls.main!] + ' e ' + profileNames[cls.secondaryCandidates[0]] + '. Esses nomes resumem a distribuição das suas escolhas; não são uma definição completa de quem você é.' : 'Algumas forças receberam a mesma pontuação nesta avaliação. Vamos manter essa igualdade e olhar para as situações que você escolheu, sem transformar um empate em uma certeza sobre você.';
    sections[0].paragraphs = [paragraph(classificationText, 'opening:score-description', evidence.map(e => e.questionId), 'synthesis', 'process_information')];
    if (matches({ Q01: 'A', Q04: 'A' }))
        sections[4].paragraphs = [paragraph('Ao imaginar um dinheiro inesperado, você preferiu uma pausa para avaliar; diante de uma mudança de área ou rotina, escolheu considerar o crescimento possível. As duas cenas podem conviver: uma escolha oferece espaço para ponderar, enquanto outra desperta vontade de avançar.', 'pair:pause-and-opportunity', ['Q01', 'Q04']), paragraph('Talvez valha observar como você reconhece a hora de passar da avaliação para a ação. Não precisamos supor que uma dessas respostas governe todas as suas decisões.', 'pair:pause-and-opportunity', ['Q01', 'Q04'], 'synthesis', 'reflection')];
    else if (matches({ Q01: 'B', Q04: 'D' }))
        sections[4].paragraphs = [paragraph('Nas suas escolhas, um recurso inesperado poderia tirar um plano do papel, enquanto uma mudança maior exigiria considerar o efeito sobre pessoas próximas. Iniciativa para um projeto e cuidado com quem está junto podem participar da mesma decisão, em proporções diferentes conforme a situação.', 'pair:project-and-people', ['Q01', 'Q04'])];
    else if (matches({ Q01: 'D', Q04: 'D' }))
        sections[4].paragraphs = [paragraph('Tanto na ideia de usar um dinheiro inesperado quanto na possibilidade de mudar a rotina, você levou em conta pessoas próximas. Nessas cenas, a utilidade de uma escolha também passa pelo efeito que ela pode ter na vida compartilhada. Isso não significa que seus próprios planos precisem ficar de fora.', 'pair:shared-impact', ['Q01', 'Q04'])];
    if (!cls.pair) {
        sections[4].paragraphs.unshift(paragraph('A combinação entre duas forças não ficou definida de maneira única. As observações abaixo vêm das suas respostas individuais e não escolhem um cruzamento no lugar dos pontos.', 'pair:preserve-tie', evidence.map(e => e.questionId), 'synthesis', 'process_information'));
    }
    if (matches({ Q05: 'D', Q06: 'A' })) {
        sections[6].paragraphs.push(paragraph('Querer entender a lógica e querer perceber utilidade podem fazer parte do mesmo aprendizado. Você pode desejar uma boa explicação para começar e, ao mesmo tempo, precisar reconhecer onde aquele conhecimento será aplicado. A questão não precisa ser escolher entre teoria e prática, mas encontrar uma ligação clara entre elas.', 'context:usefulness-and-logic', ['Q05', 'Q06']));
    }
    sections[7].paragraphs = [paragraph('Escolher uma formação envolve mais do que reconhecer um perfil. Vale olhar para as atividades do dia a dia da área, o que você quer aprender e quais requisitos precisa atender. Um nome de curso, sozinho, não conta como essa experiência será para você.', 'careers:no-invented-matches', [], 'synthesis', 'process_information'), paragraph('Esta prévia ainda não indica cursos. A relação entre interesses, atividades e ofertas precisa ser revisada antes de produzir recomendações. Para conversar sobre pós-graduação, também será preciso informar a escolaridade: as opções de matrícula exigem graduação ou pós-graduação concluída, além dos requisitos do curso.', 'careers:no-invented-matches', [], 'synthesis', 'process_information')];
    sections[8].paragraphs = [paragraph('Você não precisa sair desta leitura com uma profissão escolhida. Pode começar reconhecendo uma situação que fez sentido e outra que gostaria de entender melhor. Levar um exemplo seu para uma conversa costuma tornar a reflexão mais concreta do que procurar uma descrição que explique tudo.', 'closing:small-investigation', [], 'synthesis', 'process_information'), paragraph('Ao conhecer uma formação, observe uma atividade real que ela envolve e as dúvidas que isso desperta em você. Esse primeiro contato pode ajudar a decidir o que merece ser explorado com mais calma, sem precisar transformar curiosidade em compromisso.', 'closing:small-investigation', [], 'synthesis', 'process_information')];
    for (const s of sections)
        if (!s.paragraphs.length)
            gaps.push({ section: s.number, reason: 'Ainda não há narrativa condicional neste pacote para as respostas desta seção.' });
    gaps.push({ section: null, reason: 'Todos os textos novos são propostas editoriais para aprovação da Carla; não homologados.' }, { section: 8, reason: 'Matriz de graduação/pós, relevância, requisitos e disponibilidade ainda não integrados; nenhuma recomendação foi gerada.' });
    for (const e of evidence)
        if (!selected.some(r => r.evidenceRefs.includes(e.id)) && !sections.some(s => s.paragraphs.some(p => p.use === 'synthesis' && p.claimType === 'contextual_interpretation' && p.evidenceRefs.includes(e.id))))
            gaps.push({ section: e.primarySection, reason: 'Evidência ' + e.questionId + '=' + e.letter + ' examinada; aprofundamento editorial específico ainda não incluído nesta prévia.' });
    const byQ5: Record<string, {
        summary: string;
        question: string;
        approach: string;
        avoid: string;
    }> = {
        B: { summary: 'Na situação de um projeto interrompido, a rotina apareceu como obstáculo. Confirme se isso ainda faz parte da experiência atual; não assuma que hoje falta tempo para estudar.', question: 'Uma rotina de estudos caberia como na sua semana hoje?', approach: 'Escute como a pessoa organiza a semana antes de apresentar uma rotina de estudos. Se houver interesse, ajude a comparar exigências reais de tempo, sem sugerir que basta se organizar melhor.', avoid: 'Não chamar a pessoa de desorganizada nem concluir que abandonará um curso.' },
        D: { summary: 'Na lembrança de um projeto interrompido, faltou perceber a aplicação do conteúdo. Investigue o que tornaria o aprendizado útil hoje, sem concluir que a pessoa rejeita teoria.', question: 'O que gostaria de aprender fazendo, na prática?', approach: 'Quando houver interesse declarado, mostre como uma explicação se liga a uma tarefa real do curso. Convide a pessoa a dizer que utilidade procura, em vez de escolher uma área por ela.', avoid: 'Não presumir rejeição a teoria nem oferecer um curso só porque parece prático.' },
        C: { summary: 'No projeto interrompido, a demora para perceber resultados teve importância. Pergunte como a pessoa reconhece avanços; isso não indica predisposição a comprar sob urgência.', question: 'O que ajudaria você a perceber evolução num projeto longo?', approach: 'Se a pessoa quiser conhecer uma formação, explique etapas e exemplos de aprendizagem sem prometer resultados rápidos. Descubra quais marcos ela considera significativos.', avoid: 'Não usar pressão de prazo nem prometer retorno rápido para responder ao tema de progresso.' }
    };
    const q5 = byQ5[get('Q05')!.letter];
    const q6 = get('Q06')!.letter;
    const learning = q6 === 'A' ? 'Prefere ver como a grade se organiza antes de decidir?' : q6 === 'B' ? 'Gostaria de conhecer aulas ou projetos práticos desse curso?' : null;
    const commercialTitles = ['Resumo individual', 'Interesses e pontos a confirmar', 'Mensagem inicial editável', 'Perguntas de atendimento', 'Orientações condicionais', 'Profissões e cursos a explorar', 'O que evitar na abordagem', 'Próximo passo sugerido', 'Acompanhamento'];
    const commercial: EditorialSection[] = commercialTitles.map((title, i) => ({ number: i + 1, title, paragraphs: [] }));
    commercial[0].paragraphs = [paragraph(classificationText, 'commercial:summary', evidence.map(e => e.questionId), 'synthesis', 'process_information')];
    if (q5) {
        commercial[1].paragraphs = [paragraph(q5.summary, 'commercial:Q05:' + get('Q05')!.letter, ['Q05'])];
        commercial[3].paragraphs.push(paragraph(q5.question, 'commercial:question:Q05:' + get('Q05')!.letter, ['Q05'], 'deepening', 'reflection'));
        commercial[6].paragraphs.push(paragraph(q5.avoid, 'commercial:avoid:Q05:' + get('Q05')!.letter, ['Q05'], 'synthesis', 'process_information'));
        commercial[7].paragraphs.push(paragraph(q5.approach, 'commercial:approach:Q05:' + get('Q05')!.letter, ['Q05']));
    }
    if (learning)
        commercial[3].paragraphs.push(paragraph(learning, 'commercial:question:Q06:' + q6, ['Q06'], 'deepening', 'reflection'));
    if (matches({ Q05: 'D', Q06: 'A' }))
        commercial[1].paragraphs.push(paragraph('A preferência por compreender a lógica pode coexistir com a necessidade de enxergar aplicação. Confirme essa leitura com a pessoa: uma conversa pode começar pela explicação e depois mostrar uma atividade concreta, sem tentar provar que ela se contradisse.', 'commercial:context:usefulness-and-logic', ['Q05', 'Q06']));
    commercial[1].paragraphs.push(paragraph('Área de interesse, escolaridade, graduação de origem e objetivo profissional não foram informados nas fixtures. Pergunte antes de personalizar uma oferta; as respostas comportamentais não preenchem esses dados.', 'commercial:missing-context', [], 'synthesis', 'process_information'));
    commercial[2].paragraphs = [paragraph('Seu DNA já está pronto; posso te explicar como acessar?', 'commercial:message', [], 'synthesis', 'process_information')];
    commercial[4].paragraphs = [paragraph('Antes do contato, confirme se o relatório foi disponibilizado. Se não leu, facilite o acesso; se leu e se reconheceu, escute o que chamou atenção; se discordou, acolha e registre sua percepção. Sem informação, pergunte. Abrir um link não comprova leitura.', 'commercial:reading', [], 'synthesis', 'process_information')];
    commercial[5].paragraphs = [paragraph('Nenhum curso foi recomendado nesta prévia. Primeiro confirme interesses e objetivo; depois consulte a matriz aprovada e a oferta atual da instituição/unidade. Só graduação ou pós concluída permitem opções de matrícula em pós; escolaridade ausente exige coleta. A futura integração deve validar isso no servidor e exigir comprovação de graduação na matrícula.', 'commercial:careers', [], 'synthesis', 'process_information')];
    commercial[6].paragraphs.push(paragraph('Não tratar pontuação como aptidão, usar dificuldades como pressão ou apresentar uma hipótese como fato atual. O relato da pessoa durante a conversa tem prioridade para orientar o atendimento.', 'commercial:avoid', [], 'synthesis', 'process_information'));
    commercial[7].paragraphs.push(paragraph('Confirme acesso e leitura, escute o interesse e combine um próximo contato apenas se fizer sentido para a pessoa. Não presumir data, envio de mensagem, matrícula ou disponibilidade de oferta.', 'commercial:next', [], 'synthesis', 'process_information'));
    commercial[8].paragraphs = [paragraph('Exemplo fictício sem atendimento, responsável operacional, retorno ou matrícula registrados. A situação de referência é Aguardando atendimento. Na integração futura, registrar contato e mudanças com usuário, data e histórico, respeitando escopo e preferências de comunicação.', 'commercial:history', [], 'synthesis', 'process_information')];
    const education = analysis.commercial.declared.education;
    const status = !education ? 'needs_education' : ['graduado', 'pos_graduado'].includes(education) ? 'education_eligible_declaration' : ['ensino_medio_incompleto', 'ensino_medio_completo', 'cursando_graduacao'].includes(education) ? 'education_ineligible' : 'invalid_education';
    return { version: EDITORIAL_VERSION, sourceAnalysisKey: analysis.analysisKey, approval: 'pending_carla', productionReady: false, participant: { sections }, commercial: { sections: commercial }, internal: { evidence, selectedRules: selected, examinedQuestions: evidence.map(e => e.questionId), gaps, contextualInterpretations: matches({ Q05: 'D', Q06: 'A' }) ? ['context:usefulness-and-logic'] : [], eligibility: { status, enrollmentOfferAllowed: false, requiresServerValidation: true, requiresOfferAndCourseRequirements: true, requiresDegreeProofAtEnrollment: true } } };
}
/** Explicit public projection: technical evidence and commercial content stay internal. */
export function participantEditorialText(preview: EditorialPreview) { return { sections: preview.participant.sections.map(s => ({ number: s.number, title: s.title, paragraphs: s.paragraphs.map(p => p.text) })) }; }
export function commercialEditorialText(preview: EditorialPreview) { return { sections: preview.commercial.sections.map(s => ({ number: s.number, title: s.title, paragraphs: s.paragraphs.map(p => p.text) })) }; }
export function editorialPreviewKey(preview: EditorialPreview): string { return createHash('sha256').update(JSON.stringify(preview)).digest('hex'); }
