import sources from './restored-sources.json';
import pairs from './restored-pairs.json';

import type {IntegratedJourney} from '../../integration/journey';
import questions from '../../__fixtures__/individual/questions.json';
import {PROFILES} from '../../../dna-data';
import {responseReadings,pairExtensions,answerBriefs,originalSceneConditions} from './restored-context';

export const RESTORED_EDITORIAL_VERSION='dna-restored-humanized-2026-10-28.v2';
export const profileNames={L:'Liderança e Negócios',C:'Comunicador e Influente',E:'Estratégico e Analítico',H:'Humanizado e Desenvolvimento',P:'Prático e Operacional'} as const;
type Origin='recovered_literal'|'adapted_awaiting_carla'|'new_awaiting_carla';
export type RestoredParagraph={text:string;origin:Origin;source:string;evidenceRefs:string[]};
export type RestoredSection={number:number;title:string;paragraphs:RestoredParagraph[]};
const clean=(text:string)=>text.replace(/^>\s?/gm,'').replace(/\*\*/g,'').trim();
const paragraph=(text:string,origin:Origin,source:string,evidenceRefs:string[]=[]):RestoredParagraph=>({text:clean(text),origin,source,evidenceRefs});
const legacyMap={L:'A',C:'B',E:'C',H:'D',P:'E'} as const;
const analogies={L:'Como decidir o destino de uma viagem e chamar o grupo para sair: o impulso de avançar ganha valor quando o próximo passo fica claro.',C:'Como abrir uma janela numa sala: uma conversa traz movimento e permite que outras ideias entrem.',E:'Como consultar o GPS: entender o caminho ajuda a decidir, mas o mapa não substitui a experiência de percorrê-lo.',H:'Como cuidar de um jardim compartilhado: perceber o que cada parte precisa não obriga uma pessoa a fazer tudo sozinha.',P:'Como aprender uma receita com as mãos na massa: o resultado de cada tentativa mostra o próximo ajuste.'};
const profileContexts={
 L:{opening:'Sabe quando um grupo tem várias ideias, mas ninguém escolhe por onde começar? Alguém pergunta “o que vamos fazer primeiro?” e ajuda a transformar a conversa num próximo passo. Essa é uma cena para conhecer a força de Liderança e Negócios, sem resumir uma pessoa a ela.',scenes:['Numa reunião, alguém propõe uma primeira entrega em vez de esperar que todo o projeto esteja resolvido.','Ao dividir uma tarefa, combina quem assume cada parte e quando o grupo volta a conversar.','Diante de uma oportunidade, pergunta que movimento ela permite fazer.'],decisions:'Escolher um objetivo ajuda a decidir. O cuidado é não tratar o tempo de reflexão das outras pessoas como falta de vontade.',relations:'Dar uma direção fica mais útil quando também existe espaço para alguém discordar e melhorar a proposta.',learning:'Um projeto pequeno pode dar sentido ao estudo. Os fundamentos continuam necessários mesmo quando o resultado final parece distante.'},
 C:{opening:'Imagine chegar a um lugar onde as pessoas ainda estão em silêncio. Uma pergunta puxa uma história, a história aproxima alguém e a conversa ganha vida. A força Comunicador e Influente convida a olhar para esse movimento de aproximação, sem exigir extroversão o tempo todo.',scenes:['Num encontro, uma pergunta ajuda duas pessoas que não se conhecem a descobrir um assunto em comum.','Ao explicar uma ideia, troca uma palavra difícil por um exemplo que quem escuta consegue visualizar.','Um projeto começa cheio de possibilidades; depois é preciso escolher qual delas cabe nesta semana.'],decisions:'Conversar traz referências. Antes de escolher, separar a opinião mais animada do critério que realmente importa ajuda a manter o rumo.',relations:'Criar contato também envolve perceber quando escutar, esperar ou deixar o silêncio existir.',learning:'Trocar experiências pode abrir a curiosidade; uma prática individual mostra o que ficou compreendido depois da conversa.'},
 E:{opening:'Sabe quando todo mundo já escolheu o que comprar e alguém ainda quer entender a diferença entre dois modelos? Não é só escolher: é saber por que aquela opção faz sentido. Essa cena apresenta a força Estratégico e Analítico; não significa que ela evite todos os erros.',scenes:['Antes de uma compra importante, compara critérios em vez de olhar apenas o anúncio.','Ao organizar a casa, procura uma lógica que facilite encontrar o que é usado todos os dias.','Antes de viajar, confere o trajeto; durante o caminho, precisa ajustar o plano ao que encontra.'],decisions:'Entender as opções ajuda a escolher. Definir quais informações bastam impede que pesquisar vire uma tarefa sem fim.',relations:'Uma pergunta cuidadosa pode ajudar o grupo; explicar a intenção evita que ela seja recebida apenas como objeção.',learning:'Compreender a lógica dá uma base. Um teste pequeno permite descobrir onde a explicação precisa encontrar a experiência.'},
 H:{opening:'Imagine uma conversa em que alguém percebe que uma pessoa ainda não conseguiu falar. Faz uma pausa, pergunta e escuta a resposta. A força Humanizado e Desenvolvimento olha para o cuidado que permite participar; não transforma ninguém em responsável por resolver a vida dos outros.',scenes:['Num grupo, pergunta se a distribuição de tarefas é possível para quem vai realizá-las.','Ao receber alguém novo, oferece uma forma de participar sem obrigar a pessoa a se expor.','Quando pedem ajuda, combina o que consegue fazer e o que precisa ficar para outro momento.'],decisions:'Considerar o efeito nas pessoas amplia a escolha. Suas próprias condições também precisam entrar na conversa.',relations:'Ouvir e acolher são contribuições. Dizer até onde consegue ajudar torna essa presença mais sustentável.',learning:'Uma troca respeitosa pode favorecer perguntas; ter espaço para tentar por conta própria também faz parte do desenvolvimento.'},
 P:{opening:'Tem uma peça na mesa e uma ideia para testar. Alguém experimenta, observa o que aconteceu e ajusta o próximo movimento. A força Prático e Operacional aparece nessa conversa com a realidade; não mede inteligência nem dispensa o conhecimento teórico.',scenes:['Numa montagem, testa uma etapa e confere o que precisa ser corrigido.','Na cozinha, percebe pelo resultado qual ajuste fazer na próxima tentativa.','Diante de um imprevisto, identifica uma primeira ação possível antes de resolver todo o restante.'],decisions:'Um resultado visível ajuda a comparar caminhos. Preparar o teste e conhecer seus limites evita confundir rapidez com solução.',relations:'Ajudar fazendo é valioso; perguntar o que a outra pessoa precisa evita assumir uma tarefa que ela queria aprender.',learning:'Tentativa, observação e ajuste podem se alimentar. Consultar uma explicação depois do teste ajuda a entender por que algo funcionou.'},
};
export function restoredProfiles(){
 return Object.entries(profileNames).map(([code,name])=>{
  const c=code as keyof typeof profileNames,p=PROFILES[legacyMap[c]];
  return {code:c,name,source:'lib/dna-data.ts · conteúdo preexistente do perfil '+legacyMap[c],
   original:{opening:p.desc,analogy:p.dailyAnalogy,strengths:p.strong,attention:p.attention,decisions:p.howYouDecide,learning:p.reflection},
   opening:profileContexts[c].opening,
   analogy:analogies[c],analogyOrigin:'new_awaiting_carla' as const,
   scenes:profileContexts[c].scenes,decisions:profileContexts[c].decisions,relations:profileContexts[c].relations,learning:profileContexts[c].learning,
   strengths:p.strong,attention:p.attention,
   reflection:'Em qual situação essa força ajudou você? Lembre também de uma ocasião em que foi necessário mudar de estratégia.',
   status:'awaiting_carla' as const};
 });
}
export function restoredPairs(){return pairs.map(p=>{
 const lines=p.text.split('\n').map(line=>clean(line.replace(/^- \*\*[^*]+\*\*:?\s*/,'')));
 return {...p,scene:lines[0],synergy:lines[1],tension:lines[2],action:lines[3],attention:lines[2],...pairExtensions[p.code],extensionOrigin:'new_awaiting_carla' as const};
});}

/** Editorial projection only: no mutation, persistence, scoring or release approval. */
export function restoreHumanized(j:IntegratedJourney,declaredCareerPreference?:'public'|'private'|'entrepreneurship'){
 const byQuestion=new Map(j.analysis.evidence.map(e=>[e.questionId,e]));
 const e=(id:string)=>{const found=byQuestion.get(id);if(!found)throw Error('Incomplete editorial evidence');return found;};
 const brief=(id:string)=>answerBriefs[id][e(id).letter];
 const refs=(ids:string[])=>ids.map(id=>e(id).id);
 const p=(text:string,ids:string[],source:string,origin:Origin='adapted_awaiting_carla')=>paragraph(text,origin,source,refs(ids));
 const section=(number:number,texts:RestoredParagraph[]):RestoredSection=>({number,title:sources.participant.find(s=>s.number===number)!.title,paragraphs:texts});
 const pair=restoredPairs().find(p=>p.code===j.analysis.classification.pair)||null,c=j.analysis.classification;
 const main=c.main?profileNames[c.main]:null;
 const first=main?'Nas suas escolhas, a força '+main+' aparece à frente.':'Suas escolhas deram o mesmo espaço a mais de uma força. Não há uma vencedora para resumir seu jeito.';
 const participant:RestoredSection[]=[];
 participant.push(section(1,[
  p(first+' Uma forma de entender esse resultado é olhar para o que você escolheu em situações diferentes, sem exigir que sua resposta seja igual em todas elas.',['Q01','Q04'],'Resultado calculado e leitura contextual'),
  p('Diante de uma mudança importante, você escolheu '+brief('Q04')+'. Já na cena do dinheiro inesperado, '+brief('Q01')+'. Essas duas respostas mostram o que chamou sua atenção em cada escolha. O contexto muda; a contribuição que você quer dar também merece ser observada.',['Q04','Q01'],'02_RELATORIO_PARTICIPANTE.md · abertura adaptada a duas respostas'),
 ]));
 const purchase:Record<string,string>={
  A:'Sabe quando uma compra importante abre uma conversa cheia de detalhes? O que muda de um modelo para outro, o que será usado de verdade, qual informação ainda falta? Nessa cena, você escolheu comparar muitas informações antes de decidir. Isso fala da busca por clareza naquela escolha; não permite concluir que você demora em toda decisão.',
  B:'Uma compra importante não precisa ser só sobre o objeto. Às vezes, ela representa uma coisa que você quer conseguir fazer. Na cena apresentada, você escolheu decidir quando a oportunidade estivesse ligada a um objetivo claro. Dar nome a esse objetivo ajuda a distinguir uma boa oportunidade de uma oferta que apenas parece urgente.',
  C:'No começo de uma compra, cada opção abre uma possibilidade. Você escolheu explorar e conversar sobre elas, e reconheceu que o interesse pode mudar quando o processo se alonga. Guardar o motivo inicial da compra por escrito ajuda a perceber se surgiu uma alternativa melhor ou se o assunto apenas perdeu a novidade.'};
 participant.push(section(2,[p(purchase[e('Q09').letter],['Q09'],'02_RELATORIO_PARTICIPANTE.md · cena da compra revisada sem rótulo'),
  p('O cotidiano também tem outro ritmo. Para o fim de semana, você preferiu '+brief('Q03')+'. Compare essa escolha com a compra: o que pede atenção aos detalhes e o que pede um tempo diferente? Não é preciso transformar um jeito de comprar numa regra para todos os momentos da sua vida.',['Q03','Q09'],'Contraponto entre descanso e decisão')
 ]));
 const social:Record<string,string>={A:'colocar ordem no que precisa acontecer',B:'dar vida a uma conversa',C:'escutar de um jeito que acolhe',D:'oferecer uma ajuda que se transforma em ação'};
 participant.push(section(3,[
  p('Na pergunta sobre o elogio recebido ou desejado, você se identificou com '+brief('Q14')+'. Essa escolha abre uma conversa sobre a imagem que reconhece em si; não substitui o que as outras pessoas diriam. Lembre de alguém que já contou com você para '+social[e('Q14').letter]+'. O que aconteceu naquela ocasião?',['Q14'],'02_RELATORIO_PARTICIPANTE.md · percepção social sem inferência de testemunho'),
  p('Na preparação da festa, você escolheu '+brief('Q15')+'. Imagine esse papel acontecendo: enquanto cada pessoa cuida de uma parte, a sua contribuição ajuda de um modo específico. Contar o que você está tentando facilitar pode tornar essa ajuda mais compreensível para quem está ao lado.',['Q15'],'Cena da festa adaptada à alternativa efetiva'),
 ]));
 participant.push(section(4,[p(responseReadings.Q11[e('Q11').letter],['Q11'],'02_RELATORIO_PARTICIPANTE.md · reação ao erro adaptada'),
  p('O imprevisto doméstico traz uma situação diferente. Ali, você escolheu '+brief('Q10')+'. Uma data errada e um problema que precisa de conserto não pedem a mesma resposta. Reconhecer essa diferença ajuda a escolher uma primeira ação: o que precisa ser resolvido agora e o que pode ser compreendido depois?',['Q10'],'Contraponto de reação em outra situação')
 ]));
 const supporting=j.analysis.evidence.filter(item=>['Q07','Q08','Q12','Q13'].includes(item.questionId));
 const conditions=pair?originalSceneConditions[pair.code]:undefined;
 const originalSceneSupported=!!conditions&&Object.entries(conditions).every(([id,letter])=>e(id).letter===letter);
 if(pair){
  const [a,b]=pair.code.split('+') as (keyof typeof profileNames)[];
  const selected=supporting.filter(item=>{const q=questions.find(q=>'Q'+String(q.number).padStart(2,'0')===item.questionId),o=q?.options.find(o=>o.letter===item.letter);const w=o?.weights as Partial<Record<keyof typeof profileNames,number>>|undefined;return !!(w?.[a]||w?.[b]);}).slice(0,2);
  if(!selected.length)selected.push(supporting[0]);
  const chosenIds=selected.map(item=>item.questionId);
  const scene=originalSceneSupported
   ?'Imagine uma situação parecida com esta: '+pair.scene.charAt(0).toLowerCase()+pair.scene.slice(1)
   :'Na '+(selected[0].questionId==='Q07'?'lista de tarefas':selected[0].questionId==='Q08'?'conversa com alguém que precisava de ajuda':selected[0].questionId==='Q12'?'discussão no grupo':'hora livre')+', você escolheu '+brief(selected[0].questionId)+'. '+(selected[1]?'Em outra cena, preferiu '+brief(selected[1].questionId)+'. ':'')+'Essas escolhas colocam as suas forças em situações concretas, sem exigir que uma mesma reação sirva para tudo.';
  participant.push(section(5,[
   p(pair.displayTitle+'. A força '+profileNames[a]+' conduz esta combinação; '+profileNames[b]+' influencia a forma de agir. A primeira dá uma direção à leitura, e a segunda acrescenta um recurso diferente. Trocar a ordem mudaria essa conversa.',chosenIds,'ANEXO_B_20_CRUZAMENTOS_V1.md · ordem preservada'),
   p(scene,originalSceneSupported?Object.keys(conditions!):chosenIds,originalSceneSupported?pair.literalSource+' · cena condicionada a múltiplas respostas':'Cenas efetivamente escolhidas, resumidas sem cópia literal'),
   p(pair.analogy,chosenIds,'Analogia do par, comparação ilustrativa','new_awaiting_carla'),
   p('Aqui existe uma tensão para investigar, sem pressupor que ela aconteça com você: '+pair.contradiction+' '+pair.action,chosenIds,'ANEXO_B_20_CRUZAMENTOS_V1.md · ação recuperada e reflexão contextual'),
  ]));
 }else{
  const mainTie=c.state==='tied_main',codes=mainTie?c.groups[0].profiles:c.secondaryCandidates;
  const names=codes.map(code=>profileNames[code]).join(' e ');
  participant.push(section(5,[
   p(mainTie?'As forças '+names+' ficaram lado a lado. Em vez de escolher uma vencedora, olhe para as situações em que cada uma encontrou espaço.':first+' Na segunda posição, '+names+' ficaram lado a lado. Essa companhia não precisa ser reduzida a uma única força.',['Q07','Q08'],'Empate preservado, sem desempate editorial'),
   p('Na lista de tarefas, você preferiu '+brief('Q07')+'. Ao apoiar alguém num momento difícil, escolheu '+brief('Q08')+'. Uma escolha mostra como encaminhou o que precisava acontecer; a outra mostra uma forma de estar disponível para alguém. O empate permite explorar essas contribuições sem colocar uma acima da outra.',['Q07','Q08'],'Narrativa própria do empate com contextos distintos'),
   p('É como ter mais de uma ferramenta à mão: não é preciso usar todas da mesma maneira. Escolha uma situação da próxima semana e pense qual contribuição ela pede primeiro. Depois, observe se outro recurso ajudaria a completar o que começou.',['Q07','Q08'],'Analogia do empate','new_awaiting_carla'),
  ]));
 }
 participant.push(section(6,[p(responseReadings.Q05[e('Q05').letter],['Q05'],'02_RELATORIO_PARTICIPANTE.md · motivação conforme escolha real'),
  p('Na cena de algumas horas livres, sua escolha foi '+brief('Q13')+'. Um intervalo livre e um projeto que se estende por semanas têm exigências diferentes. Ao começar algo novo, pense no espaço que ele terá depois do primeiro dia: qual compromisso cabe na sua rotina real?',['Q13','Q05'],'Motivação confrontada com uso de tempo disponível')
 ]));
 participant.push(section(7,[p(responseReadings.Q06[e('Q06').letter],['Q06'],'02_RELATORIO_PARTICIPANTE.md · aprendizagem contextual'),
  p('Na montagem, você preferiu '+brief('Q02')+'. Compare esse começo com a maneira de aprender que escolheu: o que ajuda a dar o primeiro passo e o que ajuda a perceber que aprendeu? Uma experiência breve, seguida de uma explicação ou troca, permite descobrir o que funciona para aquela tarefa, sem fixar um único jeito de aprender.',['Q02','Q06'],'Aprendizagem cruzada com situação prática')
 ]));
 const declared=j.registration.course_interest||j.registration.declaredArea;
 participant.push(section(8,[
  p(declared?'Você declarou interesse em '+declared+'. Comece investigando uma tarefa real dessa área: como é realizada, em quais ambientes acontece e o que seria necessário aprender para experimentá-la. O interesse abre uma investigação; os pontos do relatório não confirmam aptidão nem substituem requisitos de formação.':'Você ainda não declarou um interesse profissional. Em vez de escolher um curso por você, comece por uma tarefa: observar como alguém organiza uma entrega, explicar uma ideia, comparar soluções, acompanhar um atendimento ou experimentar uma atividade prática. Escolha uma que desperte uma curiosidade sua.',[],sources.participantSource+' · exploração conforme declaração'),
  p('Converse com alguém que realiza essa atividade. Pergunte como é uma semana comum, quais tarefas se repetem, em que ambientes trabalha e o que precisa aprender para começar. Depois de observar ou tentar um pequeno exercício, registre o que despertou interesse e o que não gostaria de repetir. Essa experiência ajuda a formular uma escolha que tenha um motivo seu.',[],sources.participantSource+' · exploração sem cursos arbitrários'),
 ]));
 if(declaredCareerPreference){const label={public:'carreira pública',private:'carreira privada',entrepreneurship:'empreendedorismo'}[declaredCareerPreference];participant[7].paragraphs.push(p('Você informou interesse em '+label+'. '+(declaredCareerPreference==='public'?'Para conhecer esse caminho, consulte um edital oficial e confira atividades, formação exigida e regras de ingresso. Investigar requisitos não significa que exista um concurso aberto.':'Conheça uma atividade real desse caminho e compare suas exigências com o que gostaria de aprender.'),[],'Preferência explicitamente declarada no caso fictício'));}
 participant.push(section(9,[
  p('Seu próximo passo não precisa decidir a vida inteira. Escolha uma dúvida que ficou mais clara durante a leitura e transforme-a numa experiência que caiba nesta semana. O relatório ganha sentido quando encontra algo que você consegue observar na prática.',[],sources.participantSource+' · fechamento adaptado'),
  p('Anote três coisas depois da experiência: o que chamou sua atenção, o que foi difícil e o que gostaria de conhecer melhor. Se uma parte deste retrato não combinou com você, guarde essa diferença também. Suas próprias observações ajudam a continuar a conversa e a ajustar o próximo caminho.',[],sources.participantSource+' · voz do participante preservada'),
 ]));
 const whatsapp='Oi, '+j.registration.name.split(' ')[0]+'! Tudo bem? Seu DNA da Profissão® está pronto. Você já conseguiu acessar o relatório ou prefere que eu ajude a encontrar? Quando puder ler, me conte qual parte fez sentido para você e o que gostaria de conversar.';
 const cp=(text:string,ids:string[]=[])=>p(text,ids,sources.commercialSource+' · adaptação de atendimento');
 const preference=declaredCareerPreference?{public:'carreira pública',private:'carreira privada',entrepreneurship:'empreendedorismo'}[declaredCareerPreference]:null;
 const motivation:Record<string,string>={A:'Pergunte que parte do projeto continuaria interessante depois da novidade inicial.',B:'Pergunte que espaço a pessoa teria hoje para uma experiência pequena, sem supor a causa da rotina pesada.',C:'Investigue que sinal de progresso ajudaria a acompanhar o caminho.',D:'Pergunte qual uso concreto a pessoa gostaria de encontrar para o que aprender.'};
 const commercialTitles=['Resumo individual','Interesses e dificuldades a confirmar','Mensagem inicial de WhatsApp','Perguntas recomendadas','Orientações condicionais','Profissões e cursos a explorar','O que evitar','Próximo passo','Acompanhamento'];
 const commercialTexts:RestoredParagraph[][]=[
  [cp((pair?'A combinação reúne '+pair.title+'. ':'O resultado apresenta forças empatadas, que devem permanecer lado a lado. ')+'Na situação de uma compra importante, a pessoa escolheu '+brief('Q09')+'. Essa escolha ajuda a abrir uma pergunta sobre decisões, sem defini-la como alguém que age assim em todos os contextos.',['Q09']),cp('Na preparação de uma atividade em grupo, preferiu '+brief('Q15')+'. Use esse papel concreto para perguntar de que tipo de tarefa ela gosta e quais experiências gostaria de conhecer.',['Q15'])],
  [cp('Ao lembrar de um projeto interrompido, indicou que '+brief('Q05')+'. Confirme se essa situação ainda é relevante hoje. '+motivation[e('Q05').letter],['Q05']),cp('Interesse declarado: '+(declared||'ainda não informado')+'. Escolaridade: '+(j.registration.escolaridade||'a confirmar')+'. Objetivo: '+(j.registration.objective||'a confirmar')+'. '+(preference?'Preferência declarada por '+preference+'. ':'')+'Complete a conversa com o relato da pessoa, sem preencher essas informações a partir do perfil.')],
  [cp(whatsapp)],
  [cp('“Qual situação do relatório mais lembrou uma experiência sua?” Depois: “Teve alguma parte que não combinou?” Ao falar de aprendizagem, pergunte como ela reconhece que aprendeu algo e se consegue lembrar de um exemplo recente.',['Q06']),cp('“Se pudesse conhecer uma tarefa de trabalho por dentro, qual escolheria?” Se já houver interesse numa profissão, pergunte o que despertou essa curiosidade e o que ainda gostaria de descobrir.')],
  [cp('Se ainda não houver área escolhida, combine uma experiência exploratória. Se a pessoa já tem uma profissão em mente, investigue atividades, ambientes de trabalho e formação exigida. O papel de quem atende é organizar possibilidades com ela, não decidir a área por ela.'),cp('Quando aparecer uma dificuldade, peça permissão para aprofundar o assunto. Uma condição da vida da pessoa não é argumento para pressionar uma matrícula. Confirme o que ela quer fazer agora e que ajuda espera receber.')],
  [cp(declared?'A área declarada é '+declared+'. Investigue com a pessoa o que se faz no dia a dia, onde essas atividades acontecem e o que é necessário aprender.':'Sem interesse declarado, não apresente uma lista de cursos como resultado automático do perfil. Escolha com a pessoa uma atividade para observar ou experimentar.'),cp('Antes de apresentar uma formação, confirme escolaridade, requisitos de ingresso, oferta vigente e modalidade. Cursos e ofertas dependem de elegibilidade e validação acadêmica. Só apresente salário, vaga ou edital quando houver fonte atual e verificável.')],
  [cp('Evite tratar o resultado como aptidão comprovada, presumir dificuldades financeiras ou familiares e prometer salário ou emprego. Não transforme uma alternativa em rótulo sobre a pessoa.'),cp('Não afirme que ela leu ou concordou com o relatório sem confirmação. Se corrigir uma interpretação, registre a correção. A conversa deve dar espaço para que a pessoa reconheça ou conteste a leitura.')],
  [cp('Primeiro confirme o acesso ao relatório. Se a pessoa quiser conversar, retome uma situação que ela própria destacou e combinem uma ação possível: observar uma tarefa, falar com alguém da área ou conferir requisitos de uma formação.'),cp('Pergunte se deseja um retorno. Data e canal só entram no atendimento depois do combinado; não crie urgência nem registre compromisso em nome da pessoa.')],
  [cp('No retorno autorizado, comece pela experiência combinada: o que ela descobriu, o que mudou e qual dúvida permaneceu? Atualize o registro com as palavras da pessoa e o próximo passo que ela escolheu.'),cp('Se não houver interesse em continuar, respeite a decisão e encerre o contato. Compartilhe com o participante apenas o relatório destinado a ele; esta ficha orienta a equipe autorizada.')],
 ];
 const commercial:RestoredSection[]=commercialTexts.map((paragraphs,i)=>({number:i+1,title:commercialTitles[i],paragraphs}));
 return {version:RESTORED_EDITORIAL_VERSION,approval:'awaiting_carla' as const,participant,commercial,pair,whatsapp,sourceHash:sources.sourceHash,missingSources:sources.missingSources,
  evidence:j.analysis.evidence.map(item=>({...item})),scores:{...j.analysis.scores},classification:j.analysis.classification,
  audit:{originalSceneSupported,sceneConditions:conditions||null,thirdLayer:j.analysis,originalParticipant:sources.participant,originalCommercial:sources.commercial}};
}
