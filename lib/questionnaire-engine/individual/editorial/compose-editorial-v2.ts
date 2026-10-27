import { composeEditorialPreview, participantEditorialText, commercialEditorialText } from './compose-editorial';
import baseRules from './draft-rules.json';
import additions from './draft-rules-v2.json';
import type { IndividualAnalysis } from '../types';
import type { EditorialPreview, EditorialParagraph } from './types';
export const EDITORIAL_V2 = 'dna-editorial-preview-2026-10-26.v2';
export type DeliveryContext = {
    release: 'not_released' | 'released' | 'unknown';
    reading: 'unknown' | 'not_read' | 'identified' | 'disagreed';
};
export type EditorialPreviewV2 = EditorialPreview & {
    delivery: DeliveryContext;
    whatsapp: {
        editable: true;
        text: string;
        automaticSend: false;
    };
    audit: {
        ruleId: string;
        matched: boolean;
        selected: boolean;
        reason: string;
    }[];
};
const names: Record<string, string> = { L: 'Liderança e Negócios', C: 'Comunicador e Influente', E: 'Estratégico e Analítico', H: 'Humanizado e Desenvolvimento', P: 'Prático e Operacional' };
export function composeEditorialPreviewV2(a: IndividualAnalysis, context: DeliveryContext = { release: 'unknown', reading: 'unknown' }): EditorialPreviewV2 {
    if (!['not_released', 'released', 'unknown'].includes(context.release) || !['unknown', 'not_read', 'identified', 'disagreed'].includes(context.reading))
        throw new Error('Invalid delivery state');
    const p = composeEditorialPreview(a);
    p.version = EDITORIAL_V2;
    const get = (q: string) => a.evidence.find(e => e.questionId === q)!;
    const refs = (qs: string[]) => qs.map(q => get(q).id);
    const make = (text: string, id: string, qs: string[], use: EditorialParagraph['use'] = 'synthesis', kind: EditorialParagraph['claimType'] = 'contextual_interpretation'): EditorialParagraph => ({ text, ruleId: id, evidenceRefs: refs(qs), use, claimType: kind });
    const audit: EditorialPreviewV2['audit'] = [];
    for (const section of p.participant.sections) {
        const candidates = additions.filter(r => r.section === section.number).map(r => ({ r, matched: Object.entries(r.when).every(([q, l]) => get(q)?.letter === l) }));
        const hasBase = section.number !== 9 && section.paragraphs.some(x => x.use === 'deepening');
        const chosen = hasBase ? undefined : candidates.find(x => x.matched)?.r;
        for (const { r, matched } of candidates)
            audit.push({ ruleId: r.id, matched, selected: r.id === chosen?.id, reason: !matched ? 'Condição não atendida' : hasBase ? 'Aprofundamento da base v1 preservado' : r.id === chosen?.id ? 'Lote v2 selecionado' : 'Outra regra prioritária na mesma seção' });
        if (chosen) {
            section.paragraphs = chosen.paragraphs.map((text, i) => make(text, chosen.id, Object.keys(chosen.when), 'deepening', i === chosen.paragraphs.length - 1 ? 'reflection' : 'contextual_interpretation'));
            p.internal.selectedRules.push({ id: chosen.id, section: chosen.section, theme: chosen.theme, evidenceRefs: refs(Object.keys(chosen.when)) });
        }
    }
    const cls = a.classification, all = a.evidence.map(e => e.questionId);
    let opening: string;
    if (cls.state === 'tied_main')
        opening = 'Suas respostas deram a mesma pontuação a ' + cls.groups[0].profiles.map(c => names[c]).join(' e ') + '. Não precisamos escolher uma delas à força. A leitura pode começar pelas situações em que você preferiu agir, observar ou buscar companhia, mantendo espaço para maneiras diferentes de responder.';
    else if (cls.state === 'tied_secondary')
        opening = 'Nesta avaliação, ' + names[cls.main!] + ' recebeu mais pontos. A segunda posição ficou compartilhada entre ' + cls.secondaryCandidates.map(c => names[c]).join(' e ') + '. Vamos preservar esse desenho: as respostas individuais ajudam a conversar sobre ele sem transformar a igualdade em uma combinação única.';
    else if (cls.pair)
        opening = 'O desenho das suas respostas aproxima ' + names[cls.main!] + ' de ' + names[cls.secondaryCandidates[0]] + ', nessa ordem de pontos. A leitura fica mais interessante quando saímos dos nomes e olhamos para as escolhas: duas pessoas podem chegar a esse mesmo desenho e precisar de conversas bem diferentes sobre seus próximos passos.';
    else
        opening = 'A pontuação desta avaliação ainda não permite apresentar duas forças de maneira suficiente. As situações escolhidas podem ser examinadas com cuidado, sem completar o resultado com uma classificação que ele não sustenta.';
    p.participant.sections[0].paragraphs = [make(opening, 'v2:opening:' + cls.state, all, 'synthesis', 'process_information')];
    if (cls.pair === 'E+L' && get('Q06').letter === 'A' && get('Q04').letter === 'A')
        p.participant.sections[0].paragraphs.push(make('Há uma aproximação interessante nas suas escolhas: compreender como algo funciona pode ajudar a começar, enquanto a possibilidade de crescer torna a mudança atraente. Pensar e avançar não precisam acontecer separados; vale observar de que forma um ajuda o outro em cada situação.', 'v2:opening:understanding-and-direction', ['Q06', 'Q04']));
    else if (cls.pair === 'P+H' && get('Q08').letter === 'C')
        p.participant.sections[0].paragraphs.push(make('Nesta leitura, agir e cuidar se aproximam de um jeito concreto: na cena de alguém precisando de apoio, você preferiu oferecer uma ajuda que pudesse ser feita naquele momento. Essa escolha dá uma pista para explorar a relação entre as forças, sem dizer que toda ajuda precisa acontecer dessa forma.', 'v2:opening:action-and-care', ['Q08']));
    // A brief answer-bound opening enriches classification without replacing the preserved section 5.
    if (get('Q04').letter === 'A')
        p.participant.sections[0].paragraphs.push(make('Na oportunidade de mudança, você considerou o crescimento que ela poderia abrir. Esse interesse pode ganhar contornos mais claros quando a gente olha para como você aprende, decide e reconhece dificuldades em outras situações.', 'v2:opening:change-growth', ['Q04']));
    else if (get('Q04').letter === 'D')
        p.participant.sections[0].paragraphs.push(make('Na mudança de rotina, você levou em conta o efeito sobre pessoas próximas. A leitura a seguir considera esse cuidado ao lado das outras escolhas, sem concluir que todos os seus planos precisam seguir o mesmo caminho.', 'v2:opening:shared-change', ['Q04']));
    // Recompute visible coverage from actual selected paragraphs; no stale v1 gap is silently promoted.
    const used = new Set(p.participant.sections.flatMap(s => s.paragraphs.filter(x => x.claimType === 'contextual_interpretation' || x.claimType === 'reflection').flatMap(x => x.evidenceRefs)));
    p.internal.gaps = p.internal.gaps.filter(g => !g.reason.startsWith('Evidência ') && !g.reason.startsWith('Ainda não há narrativa'));
    for (const s of p.participant.sections)
        if (!s.paragraphs.length)
            p.internal.gaps.push({ section: s.number, reason: 'Aprofundamento ainda sem regra fundamentada neste lote.' });
    for (const e of a.evidence)
        if (!used.has(e.id))
            p.internal.gaps.push({ section: e.primarySection, reason: 'Evidência ' + e.questionId + '=' + e.letter + ' examinada; aprofundamento editorial específico permanece pendente.' });
    const c = p.commercial.sections;
    const learning: Record<string, {
        q: string;
        approach: string;
        next: string;
    }> = {
        A: { q: 'Que explicação ajudaria você a compreender como essa aprendizagem funciona?', approach: 'Apresente uma explicação organizada e confira o que ainda ficou pouco claro; não presumir que a pessoa prefere só teoria.', next: 'Se houver interesse por uma formação, combine mostrar uma sequência de aprendizagem e peça à pessoa que indique uma dúvida.' },
        B: { q: 'Que atividade você gostaria de experimentar para conhecer melhor a área?', approach: 'Converse sobre uma tarefa prática e o que a pessoa gostaria de descobrir tentando; não presumir dificuldade com teoria.', next: 'Se a pessoa quiser explorar a área, combine conhecer uma atividade demonstrativa, sem prometer matrícula ou oferta ainda não consultada.' },
        C: { q: 'Que tipo de troca com outras pessoas ajuda você a aprender?', approach: 'Pergunte se a troca procurada envolve discussão, demonstração ou ajuda com dúvidas; não inferir preferência obrigatória por presencial.', next: 'Após confirmar interesse, combine explicar como acontecem as interações na formação que ela deseja conhecer.' },
        D: { q: 'Qual habilidade você gostaria de usar em um projeto concreto?', approach: 'Comece pelo objetivo declarado e investigue etapas necessárias, sem prometer aprendizagem instantânea.', next: 'Se houver interesse, combine examinar uma tarefa ligada ao objetivo e uma dúvida sobre o percurso de aprendizagem.' }
    };
    const l = learning[get('Q06').letter];
    if (l) {
        c[3].paragraphs = c[3].paragraphs.filter(x => !x.ruleId.startsWith('commercial:question:Q06:'));
        c[3].paragraphs.push(make(l.q, 'v2:commercial:learning-question:' + get('Q06').letter, ['Q06'], 'deepening', 'reflection'));
        c[7].paragraphs.push(make(l.approach, 'v2:commercial:learning-approach:' + get('Q06').letter, ['Q06']));
        c[7].paragraphs.push(make(l.next, 'v2:commercial:learning-next:' + get('Q06').letter, ['Q06']));
    }
    if (get('Q05').letter === 'A') {
        c[1].paragraphs.unshift(make('A perda da novidade apareceu na lembrança de um projeto. Confirme o que a pessoa procurava e o que deixou de fazer sentido; não concluir que ela abandonará qualquer formação.', 'v2:commercial:novelty-summary', ['Q05']));
        c[3].paragraphs.unshift(make('O que ajudaria uma atividade a continuar fazendo sentido depois do começo?', 'v2:commercial:novelty-question', ['Q05'], 'deepening', 'reflection'));
        c[7].paragraphs.unshift(make('Pergunte sobre propósito e atividades desejadas antes de discutir uma formação. Não responder à perda de novidade com promessa de entretenimento permanente.', 'v2:commercial:novelty-next', ['Q05']));
    }
    if (get('Q08').letter === 'A')
        c[3].paragraphs.push(make('Ao conhecer uma área, que importância tem para você escutar e ajudar outras pessoas?', 'v2:commercial:listening-question', ['Q08'], 'synthesis', 'reflection'));
    if (get('Q15').letter === 'A')
        c[7].paragraphs.push(make('Se a pessoa mencionar trabalho em equipe, pergunte que responsabilidades gosta de assumir. A cena de organizar uma festa não demonstra cargo de liderança ou aptidão profissional.', 'v2:commercial:leadership-limit', ['Q15']));
    // Delivery state is an explicit local fixture, never inferred from link opening or from questionnaire answers.
    let message = context.release === 'not_released' ? 'Seu DNA está concluído. Posso combinar com você como receber o relatório?' : context.release === 'unknown' ? 'Quero confirmar se você já teve acesso ao seu relatório do DNA. Posso ajudar a encontrar?' : context.reading === 'identified' ? 'Você comentou que se reconheceu no relatório. Qual parte mais chamou sua atenção?' : context.reading === 'disagreed' ? 'Quero entender o que não combinou com sua experiência no relatório. Podemos conversar sobre isso?' : 'Seu relatório do DNA já foi disponibilizado. Você conseguiu ler ou prefere ajuda para acessar?';
    c[2].paragraphs = [make(message, 'v2:commercial:message:' + context.release + ':' + context.reading, [], 'synthesis', 'process_information')];
    c[2].paragraphs.push(make('Sugestão editável: adapte ao que foi efetivamente combinado. Copiar não envia mensagem nem registra leitura.', 'v2:commercial:editable-message', [], 'synthesis', 'process_information'));
    c[1].paragraphs = c[1].paragraphs.filter(x => x.ruleId !== 'commercial:missing-context');
    const missing = ['interest', 'education', 'priorCourse', 'objective'].filter(k => !a.commercial.declared[k as keyof typeof a.commercial.declared]);
    if (missing.length)
        c[1].paragraphs.push(make('Há informações de cadastro ainda não declaradas. Confirme interesse profissional, escolaridade, formação anterior quando pertinente e objetivo antes de personalizar uma oferta. Não preencher esses dados pelo perfil.', 'v2:commercial:missing-context', [], 'synthesis', 'process_information'));
    c[0].paragraphs = [make(opening, 'v2:commercial:summary', all, 'synthesis', 'process_information'), ...(c[1].paragraphs.filter(x => x.ruleId.startsWith('commercial:Q05:')).slice(0, 1).map(x => ({ ...x, ruleId: x.ruleId + ':brief-summary', text: 'Ponto para escutar: ' + x.text })))];
    return { ...p, delivery: { ...context }, whatsapp: { editable: true, text: message, automaticSend: false }, audit };
}
export function compareEditorialParagraphs(a: EditorialPreview, b: EditorialPreview, audience: 'participant' | 'commercial' = 'participant') {
    return a[audience].sections.map(section => { const other = b[audience].sections.find(s => s.number === section.number)!; const comparisons = section.paragraphs.map(p => { const match = other.paragraphs.find(q => q.ruleId === p.ruleId && q.text === p.text); if (!match)
        return { ruleId: p.ruleId, status: 'changed_evidence_or_rule', aText: p.text, bText: null, aEvidence: p.evidenceRefs, bEvidence: [] as string[], reason: 'Texto/regra não reaparece no outro caso; conferir respostas e parágrafos adicionados.' }; const same = p.evidenceRefs.length === match.evidenceRefs.length && p.evidenceRefs.every(ref => match.evidenceRefs.includes(ref)); return { ruleId: p.ruleId, status: p.evidenceRefs.length === 0 ? 'shared_process_information' : same ? 'same_evidence_same_text' : 'same_template_different_evidence', aText: p.text, bText: match.text, aEvidence: p.evidenceRefs, bEvidence: match.evidenceRefs, reason: p.evidenceRefs.length === 0 ? 'Informação geral de processo; não é personalização.' : same ? 'Mesma regra e mesmas respostas de apoio; igualdade esperada.' : 'Texto compartilhado apesar de evidências distintas; não conta como personalização dessa diferença.' }; }); return { section: section.number, title: section.title, comparisons, addedInB: other.paragraphs.filter(q => !section.paragraphs.some(p => p.ruleId === q.ruleId && p.text === q.text)) }; });
}
export function editorialRuleInventory(questions: {
    number: number;
    options: {
        letter: string;
        text: string;
    }[];
}[]) {
    const conditions: {
        id: string;
        section: number;
        when: Record<string, string>;
        batch: string;
    }[] = [...baseRules.map(r => ({ id: r.id, section: r.section, when: Object.fromEntries(Object.entries(r.when).filter((entry): entry is [
                string,
                string
            ] => typeof entry[1] === 'string')), batch: 'v1' })), ...additions.map(r => ({ id: r.id, section: r.section, when: Object.fromEntries(Object.entries(r.when).filter((entry): entry is [
                string,
                string
            ] => typeof entry[1] === 'string')), batch: 'v2' })), { id: 'pair:pause-and-opportunity', section: 5, when: { Q01: 'A', Q04: 'A' }, batch: 'v1' }, { id: 'pair:project-and-people', section: 5, when: { Q01: 'B', Q04: 'D' }, batch: 'v1' }, { id: 'pair:shared-impact', section: 5, when: { Q01: 'D', Q04: 'D' }, batch: 'v1' }, { id: 'context:usefulness-and-logic', section: 7, when: { Q05: 'D', Q06: 'A' }, batch: 'v1' }];
    return questions.flatMap(q => q.options.map(o => { const code = 'Q' + String(q.number).padStart(2, '0'); const found = conditions.filter(r => r.when[code] === o.letter); return { question: code, alternative: o.letter, text: o.text, publicationApproved: false, coverage: found.length ? 'conditional_draft_available' : 'literal_only', rules: found }; }));
}
export { participantEditorialText, commercialEditorialText };
