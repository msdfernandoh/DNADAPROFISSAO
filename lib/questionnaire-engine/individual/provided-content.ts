import type { Evidence, ContentBlock } from './types';
export const CONTENT_VERSION = 'dna-provided-texts-2026-10-26.v1';
export const SECTION_TITLES = [
    'A identidade do seu DNA', 'Quem é você no cotidiano', 'Como os outros podem enxergar você',
    'Como você funciona diante de decisões e dificuldades', 'Suas duas forças em ação',
    'O que te movimenta e o que pode te travar', 'Seu jeito de aprender e crescer',
    'Possíveis caminhos profissionais', 'Seu próximo passo',
] as const;
// Routing follows Documento 02; a location is not itself a psychological inference.
export const PRIMARY_SECTION: Record<string, number> = { Q01: 2, Q02: 7, Q03: 6, Q04: 2, Q05: 6, Q06: 7, Q07: 3, Q08: 3, Q09: 2, Q10: 4, Q11: 4, Q12: 4, Q13: 6, Q14: 3, Q15: 3 };
type ProvidedRule = {
    question: string;
    letter: string;
    theme?: string;
    reflection?: string;
    hypothesis?: string;
    commercialQuestion: string;
    avoid: string;
    source: string;
};
export const PROVIDED_RULES: readonly ProvidedRule[] = [
    { question: 'Q05', letter: 'B', theme: 'Espaço para planos pessoais', hypothesis: 'Talvez valha avaliar como seus planos cabem na semana real', reflection: 'O que você gostaria de fazer por você, mesmo começando pequeno?', commercialQuestion: 'Uma rotina de estudos caberia como na sua semana hoje?', avoid: 'Que a pessoa é desorganizada ou não conseguirá concluir', source: 'Documento 01 §6; Documento 02 §6; Documento 03 §5' },
    { question: 'Q05', letter: 'D', theme: 'Precisar ver utilidade no aprendizado', reflection: 'Que atividade prática ajudaria você a perceber valor em um curso?', commercialQuestion: 'O que gostaria de aprender fazendo, na prática?', avoid: 'Que nunca gostará de teoria', source: 'Documento 02 §6; Documento 03 §5' },
    { question: 'Q05', letter: 'C', theme: 'Necessidade de marcos perceptíveis', reflection: 'Como você reconhece pequenos avanços num projeto longo?', commercialQuestion: 'O que ajudaria você a perceber evolução num projeto longo?', avoid: 'Que só compra sob pressão de prazo', source: 'Documento 02 §6; Documento 03 §5' },
    { question: 'Q06', letter: 'A', reflection: 'Então por que, quando pensamos em aprender alguma coisa nova, às vezes esperamos ter uma segurança que só vem depois da prática?', commercialQuestion: 'Prefere ver como a grade se organiza antes de decidir?', avoid: 'Que não gosta de atividades práticas', source: 'Documento 02 §5, parte 7; Documento 03 §5' },
    { question: 'Q06', letter: 'B', commercialQuestion: 'Gostaria de conhecer aulas ou projetos práticos desse curso?', avoid: 'Que não acompanha conteúdos teóricos', source: 'Documento 03 §5' },
    { question: 'Q06', letter: 'C', commercialQuestion: 'Ambientes de troca são importantes no seu estudo?', avoid: 'Que precisa obrigatoriamente de turma presencial', source: 'Documento 03 §5' },
    { question: 'Q09', letter: 'A', reflection: 'você costuma pesquisar até se sentir segura ou, às vezes, continua pesquisando mesmo depois de já ter informações suficientes?', commercialQuestion: 'Quais informações faltam para comparar as opções com calma?', avoid: 'Que precisa de descontos ou que indecisão é permanente', source: 'Documento 02 §5, parte 2; Documento 03 §5' },
    { question: 'Q11', letter: 'A', reflection: 'O que eu posso aprender com isso?', commercialQuestion: 'O que você gostaria de saber para se sentir confortável começando?', avoid: 'Diagnóstico emocional, risco de abandono, necessidade de pressão', source: 'Documento 02 §5, parte 4; Documento 03 §5 (somente se fizer sentido)' },
];
export function literalEvidenceBlock(e: Evidence, audience: 'participant' | 'commercial'): ContentBlock {
    return { id: audience + ':selected:' + e.id, ruleId: 'literal_selection:' + e.questionId, section: e.primarySection, audience, claimType: 'declared', text: 'Na situação “' + e.scenario + '”, você escolheu: “' + e.selectedText + '”', evidenceRefs: [e.id], source: 'ANEXO_A_15_PERGUNTAS_OFICIAIS.json', contentVersion: CONTENT_VERSION, editorialStatus: 'provided_reference' };
}
export function selectProvidedBlocks(evidence: Evidence[]) {
    const participant: ContentBlock[] = [], commercial: ContentBlock[] = [];
    const avoid: {
        text: string;
        evidenceRefs: string[];
        source: string;
    }[] = [];
    const matched = new Map<string, string[]>();
    const evaluated = new Map<string, {
        ruleId: string;
        matched: boolean;
    }[]>();
    for (const e of evidence) {
        const candidates = PROVIDED_RULES.filter(r => r.question === e.questionId);
        const found = candidates.filter(r => r.letter === e.letter);
        evaluated.set(e.id, candidates.map(r => ({ ruleId: 'answer:' + r.question + ':' + r.letter, matched: r.letter === e.letter })));
        matched.set(e.id, found.map(r => 'answer:' + r.question + ':' + r.letter));
        for (const r of found) {
            const ruleId = 'answer:' + r.question + ':' + r.letter;
            const common = { ruleId, section: e.primarySection, evidenceRefs: [e.id], source: r.source, contentVersion: CONTENT_VERSION, editorialStatus: 'provided_reference' as const };
            if (r.theme)
                participant.push({ ...common, id: ruleId + ':theme', audience: 'participant', claimType: 'hypothesis', text: r.theme });
            if (r.hypothesis)
                participant.push({ ...common, id: ruleId + ':hypothesis', audience: 'participant', claimType: 'hypothesis', text: r.hypothesis });
            if (r.reflection)
                participant.push({ ...common, id: ruleId + ':reflection', audience: 'participant', claimType: 'question', text: r.reflection });
            commercial.push({ ...common, id: ruleId + ':commercial-question', audience: 'commercial', claimType: 'question', text: r.commercialQuestion });
            avoid.push({ text: r.avoid, evidenceRefs: [e.id], source: r.source });
        }
    }
    return { participant, commercial, avoid, matched, evaluated };
}
