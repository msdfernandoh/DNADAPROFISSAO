import type { IndividualAnalysis } from '../types';
import type { EditorialParagraph } from './types';
import { composeEditorialPreviewV2, type DeliveryContext, type EditorialPreviewV2 } from './compose-editorial-v2';
export type ClosurePreview = EditorialPreviewV2 & {
    correctionAudit: {
        version: string;
        selectedRule: string | null;
        orderedPair: string | null;
        pairSource: string | null;
        evidenceRefs: string[];
        approval: 'pending_carla';
    };
};
export const CLOSURE_VERSION = 'dna-editorial-v2-corrections-2026-10-26.v1';
export function closeEditorialV2(a: IndividualAnalysis, context?: DeliveryContext): ClosurePreview {
    const p = composeEditorialPreviewV2(a, context);
    p.version = CLOSURE_VERSION;
    const e = (q: string) => a.evidence.find(x => x.questionId === q)!;
    const matches = (when: Record<string, string>) => Object.entries(when).every(([q, l]) => e(q)?.letter === l);
    const make = (text: string, id: string, qs: string[], kind: EditorialParagraph['claimType'] = 'contextual_interpretation'): EditorialParagraph => ({ text, ruleId: id, evidenceRefs: qs.map(q => e(q).id), claimType: kind, use: 'synthesis' });
    const corrections: {
        id: string;
        when: Record<string, string>;
        pair?: string;
        state?: string;
        opening: string;
        interaction: string;
        refs: string[];
    }[] = [
        { id: 'analysis-and-direction', pair: 'E+L', when: { Q06: 'A', Q04: 'A' }, refs: ['Q06', 'Q04'], opening: 'Você escolheu compreender a lógica antes de começar uma habilidade e enxergar crescimento numa oportunidade de mudança. Talvez goste de saber por onde está indo sem perder a vontade de sair do lugar. Entender e avançar podem se ajudar: uma explicação torna o primeiro passo mais claro, e um objetivo dá sentido ao que você procura entender.', interaction: '' },
        { id: 'action-and-care', pair: 'P+H', when: { Q08: 'C' }, refs: ['Q08'], opening: 'Na cena de alguém próximo precisando de apoio, você preferiu oferecer ajuda concreta. Talvez reconheça esse cuidado num gesto simples: chegar junto, resolver uma necessidade ou mostrar um primeiro passo. Agir e considerar a outra pessoa podem se encontrar sem que você precise fazer tudo por ela.', interaction: '' },
        { id: 'direction-and-exchange', pair: 'L+C', when: { Q15: 'A', Q06: 'C' }, refs: ['Q15', 'Q06'], opening: 'Na festa de última hora, você escolheu organizar as responsabilidades; para aprender algo novo, preferiu procurar um grupo. Essas cenas aproximam iniciativa e troca. Talvez seja interessante observar quando você ajuda a dar direção e quando a participação das outras pessoas torna o caminho mais rico.', interaction: 'Você pode tomar a frente de uma tarefa e continuar precisando de troca para aprender. Imagine um encontro em que alguém organiza o começo, mas deixa espaço para as pessoas sugerirem o que fazer. Dar direção pode ajudar o grupo a se mover; escutar permite ajustar o combinado. A questão é perceber quando conduzir e quando construir junto, sem tomar a resposta de todos como já conhecida.' },
        { id: 'connection-and-execution', pair: 'C+P', when: { Q09: 'C', Q10: 'B' }, refs: ['Q09', 'Q10'], opening: 'Na escolha de uma compra, você imaginou entusiasmo com as possibilidades e conversa sobre elas; no imprevisto em casa, escolheu resolver o que fosse possível. Há espaço, nessas cenas, para se interessar por novidades e também agir diante de algo concreto. Não é preciso usar o mesmo ritmo para explorar uma ideia e para lidar com uma urgência.', interaction: 'Uma possibilidade pode despertar conversa e curiosidade, enquanto um problema imediato chama você para a ação. Pense na diferença entre escolher algo que gostaria de ter e conter um vazamento: numa cena, vale explorar; na outra, é necessário resolver uma etapa. Suas escolhas permitem investigar como a energia de descobrir pode se aproximar da disposição para fazer, sem supor que toda decisão será rápida ou que toda novidade manterá o interesse.' },
        { id: 'care-and-conversation', pair: 'H+C', when: { Q08: 'A', Q07: 'D' }, refs: ['Q08', 'Q07'], opening: 'Você escolheu escutar alguém próximo em dificuldade e permitir que um encontro pelo caminho mudasse um pouco o roteiro das tarefas. Essas cenas dão espaço à presença e à conversa. Talvez faça sentido observar como você acolhe o que surge nas relações sem deixar de reconhecer o que também precisa fazer.', interaction: 'Na escuta de alguém em dificuldade, o contato pode começar por dar tempo à pessoa. Num dia de tarefas, ele pode aparecer numa conversa inesperada. Cuidado e aproximação ganham formas diferentes conforme a situação. Pode ser útil perceber quando ficar mais um pouco ajuda e quando combinar outro momento preserva tanto a relação quanto os compromissos que você assumiu.' },
        { id: 'equal-direction-connection', state: 'tied_main', when: { Q07: 'C', Q15: 'C' }, refs: ['Q07', 'Q15'], opening: 'Você escolheu encaminhar tarefas com ajuda de outras pessoas e cuidar da conversa e dos convites de uma festa. Organizar o que precisa acontecer e aproximar gente podem ocupar espaços igualmente importantes. Talvez valha observar quando você quer destravar uma situação e quando prefere criar um ambiente em que as pessoas entrem na ideia.', interaction: 'Na lista de tarefas, você preferiu agilizar e dividir o que pudesse ser resolvido. Na festa, seu interesse ficou na participação das pessoas. Essas duas maneiras de contribuir podem conversar: uma ajuda a encaminhar o necessário, a outra favorece o encontro. Liderança e comunicação ficaram lado a lado nesta avaliação; nenhuma precisa mandar na outra. Em qual situação dar uma direção clara ajuda, e em qual escutar o grupo muda o que vale fazer?' },
        { id: 'connection-care-action', state: 'tied_secondary', when: { Q01: 'C', Q15: 'E', Q02: 'A' }, refs: ['Q01', 'Q15', 'Q02'], opening: 'Você escolheu buscar uma experiência que quebrasse a rotina, cuidar para que ninguém ficasse de fora da festa e experimentar uma montagem antes de procurar instruções. Há curiosidade pelo encontro, atenção à participação e vontade de testar. Essas escolhas podem aparecer em momentos diferentes, sem pedir que uma única descrição explique tudo.', interaction: 'A comunicação aparece em primeiro plano, acompanhada tanto pelo cuidado com as pessoas quanto pela disposição prática, que receberam a mesma pontuação. Na festa, a inclusão foi importante; na montagem, você preferiu experimentar. Um convite pode abrir a conversa, perguntar o que alguém precisa pode aproximar e uma pequena demonstração pode ajudar a começar. Vale explorar qual dessas contribuições é útil em cada situação, sem escolher uma segunda força apenas para fechar uma dupla.' }
    ];
    const chosen = corrections.find(r => (!r.pair || r.pair === a.classification.pair) && (!r.state || r.state === a.classification.state) && matches(r.when));
    if (chosen) {
        p.participant.sections[0].paragraphs = [make(chosen.opening, 'closure:opening:' + chosen.id, chosen.refs)];
        if (chosen.interaction) {
            p.participant.sections[4].paragraphs = [make(chosen.interaction, 'closure:interaction:' + chosen.id, chosen.refs)];
            p.internal.selectedRules.push({ id: 'closure:interaction:' + chosen.id, section: 5, theme: chosen.id, evidenceRefs: chosen.refs.map(q => e(q).id) });
        }
    }
    else {
        p.participant.sections[0].paragraphs = p.participant.sections[0].paragraphs.filter(x => x.claimType !== 'process_information');
    }
    if (a.classification.state === 'tied_main')
        p.participant.sections[4].title = 'Suas forças lado a lado';
    if (a.classification.state === 'tied_secondary')
        p.participant.sections[4].title = 'Sua força predominante e os caminhos que a acompanham';
    // Participant-facing process information is plain reading, not a development status.
    p.participant.sections[7].paragraphs = [make('Ao conhecer uma formação, vale olhar para o que as pessoas fazem no dia a dia da área e para o que você gostaria de aprender. Uma conversa sobre uma tarefa real pode despertar interesse ou ajudar a perceber que aquele caminho não é o que procura. Os requisitos de ingresso também merecem atenção: para pós-graduação, é necessário ter graduação ou pós-graduação concluída e atender às exigências do curso.', 'closure:career-reflection', [], 'process_information')];
    const s5 = p.participant.sections[4];
    if (chosen?.interaction)
        p.internal.gaps = p.internal.gaps.filter(g => !(g.section === 5 && g.reason.startsWith('Aprofundamento ainda')));
    const focus: Record<string, string> = { A: 'Explore o propósito que a pessoa procura depois da novidade inicial.', B: 'Investigue as condições atuais para abrir espaço a um projeto.', C: 'Converse sobre os marcos que ajudam a pessoa a reconhecer progresso.', D: 'Investigue em quais situações o conhecimento precisa mostrar utilidade.' };
    p.commercial.sections[0].paragraphs = [make('Use o resultado como ponto de partida para escutar, não como conclusão sobre aptidão. ' + focus[e('Q05').letter] + ' A prioridade é descobrir o que a pessoa quer explorar agora; não decidir uma área por ela.', 'closure:commercial-summary:' + e('Q05').letter, ['Q05'])];
    // Keep hypotheses in one place and actual next action in another.
    p.commercial.sections[1].paragraphs = p.commercial.sections[1].paragraphs.filter(x => !x.ruleId.startsWith('commercial:Q05:') && !x.ruleId.includes('novelty-summary'));
    p.commercial.sections[1].paragraphs.unshift(make('Confirme com a pessoa se a situação lembrada no projeto ainda ajuda a explicar o que procura hoje. Registre suas palavras e corrija a leitura quando ela não fizer sentido.', 'closure:confirm-current-context', ['Q05']));
    const next = p.delivery.release === 'not_released' ? 'Combine a forma de disponibilizar o relatório antes de perguntar sobre sua leitura.' : p.delivery.release === 'unknown' ? 'Confirme primeiro se a pessoa teve acesso ao relatório.' : 'Pergunte qual trecho a pessoa quer conversar e escute sua avaliação.';
    p.commercial.sections[7].paragraphs = [make(next + ' Se houver interesse em continuar, escolha com ela uma das perguntas de atendimento e combine uma ação ou retorno concreto. Só registre prazo e canal depois do combinado.', 'closure:next-step:' + p.delivery.release, [], 'process_information')];
    // Do not hide a missing narrative by filling all remaining alternatives with generic prose.
    return { ...p, correctionAudit: { version: CLOSURE_VERSION, selectedRule: chosen?.id || null, orderedPair: a.classification.pair, pairSource: chosen?.pair ? a.participant.pairReference?.source || null : null, evidenceRefs: chosen ? chosen.refs.map(q => e(q).id) : [], approval: 'pending_carla' } };
}
export function assertParticipantReadyForPreview(p: EditorialPreviewV2) {
    for (const s of p.participant.sections) {
        if (!s.paragraphs.length || s.paragraphs.some(x => !x.text.trim()))
            throw new Error('Empty participant section ' + s.number);
        for (const x of s.paragraphs)
            if (/Q\d{2}|ruleId|evidenceRefs|fixtures|pipeline|homologa|matriz|prévia|pending_|productionReady|dois participantes|duas pessoas|sistema funciona|desenvolvimento interno/i.test(x.text))
                throw new Error('Development wording in participant section ' + s.number);
    }
}
