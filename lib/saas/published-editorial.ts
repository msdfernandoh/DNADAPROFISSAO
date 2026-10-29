import {rankCourses,rankingCourseParagraphs} from '../questionnaire-engine/careers/rank-courses';
import {composePublishedEditorial as composeIntegratedV3,PUBLIC_EDITION as V3_EDITION,PUBLIC_EDITION_SOURCE_HASH as V3_HASH} from './published-editorial-integrated-v3';
import {composePublishedEditorial as composePreviousEditorial,PUBLIC_EDITION as PREVIOUS_EDITION,PUBLIC_EDITION_SOURCE_HASH as PREVIOUS_SOURCE_HASH} from './published-editorial-20261028';
import {createHash} from 'node:crypto';
import {composeIntegratedHumanized} from '../questionnaire-engine/individual/editorial/integrated-humanized';
import {profileDisplaySummary} from '../questionnaire-engine/integration/profile-summary';
import type {IntegratedJourney} from '../questionnaire-engine/integration/journey';
import edition from './published-edition.json';

export const PUBLIC_EDITION='dna-course-ranked-2026-10-29.v4.public-1';
export const PUBLIC_EDITION_SOURCE_HASH=edition.sourceHash;
type Section={number:number;title:string;paragraphs:string[]};
export type PublishedCourse={id:string;name:string;level:string;why:string;activity:string;investigate:string;admission:string;index?:number;position?:number;challenge?:string;forces?:string[]};
export type PublishedEditorial={version:string;sourceHash:string;participant:Section[];commercial:Section[];courses:PublishedCourse[];whatsapp:string;contentHash:string;ranking?:ReturnType<typeof rankCourses>};
export type DeliveredJourney=IntegratedJourney&{publication?:PublishedEditorial};
function canonical(value:unknown):unknown{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)]));
 return value;
}
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
/** The existing restored composer and orientation engine are the single source of both audiences. */
export function composePublishedEditorial(j:IntegratedJourney):PublishedEditorial{
 const restored=composeIntegratedHumanized(j);
 const participant=restored.participant.map(s=>({...s,paragraphs:s.paragraphs.map(p=>p.text)}));
 const commercial=restored.commercial.map(s=>({...s,paragraphs:s.paragraphs.map(p=>p.text)}));
 const ranking=rankCourses(j);
 const courses:PublishedCourse[]=ranking.top.map(c=>({id:c.id,name:c.name,level:c.level,why:c.why,activity:c.activity,investigate:c.question,admission:c.admission,index:c.index,position:c.position,challenge:c.challenge,forces:c.forces}));
 const declared=ranking.declared;
 const interestText=declared?(declared.matched?'Seu interesse declarado: '+declared.name+'. '+(declared.outsideTop?'Este curso aparece na posição '+declared.rank+', com índice '+declared.index+'/100, fora dos cinco primeiros. A lista não foi alterada para colocá-lo no topo.':'Esse interesse também aparece entre as cinco opções calculadas.'):'Seu interesse declarado: '+declared.name+'. Não encontramos correspondência inequívoca na matriz de graduação. Ele fica registrado separadamente para a conversa, sem forçar equivalência ou alterar o ranking.'):'Você não informou um curso de interesse. As cinco possibilidades foram calculadas a partir das suas respostas e forças; isso não significa que você já tenha interesse nessas profissões.';
 participant[7].paragraphs=[ranking.notice,...ranking.top.flatMap((c,i)=>rankingCourseParagraphs(c,i+1)),interestText,...(declared?.outsideTop&&declared.course?['Sobre seu interesse: '+declared.course.activity+'. '+declared.course.challenge]:[]),...(ranking.boundaryTies.length?['Há outros cursos empatados no limite da quinta opção: '+ranking.boundaryTies.join(', ')+'. A apresentação de cinco usa um critério estável de catálogo para desempate visual, sem afirmar superioridade profissional.']:[]),'Use esta lista para conhecer atividades e comparar possibilidades. '+(ranking.top[0]?.admission||'Sem evidência suficiente para ordenar cursos.')];
 const first=j.registration.name.split(' ')[0];
 const whatsapp='Oi, '+first+'! Seu DNA está pronto. Você já recebeu a ficha completa ou quer ajuda para acessar? Depois de ler, me conte: conseguiu se enxergar no resultado do seu DNA da Profissão®? Teve alguma parte que parecia estar falando exatamente de você? Se quiser, podemos conversar sobre uma situação que chamou sua atenção.';
 commercial[2].paragraphs=[whatsapp];
 commercial[3].paragraphs=[
  'Comece pela identificação: “'+first+', você conseguiu se enxergar no resultado? Teve alguma parte que parecia estar falando exatamente de você?” Escute também o que não combinou.',
  'Depois, retome uma cena que a própria pessoa destacou no relatório: “Você se lembra de uma situação parecida? O que costuma fazer naquele momento?” Compare com as respostas sem atribuir sentimentos ou dificuldades que ela não relatou.',
  courses.length?'Só depois entre nas opções que ela viu: “Dos cursos que apareceram no seu DNA — '+courses.map(c=>c.name).join(', ')+' — qual chamou mais sua atenção? Com qual se identificou?”':'Nenhum curso foi apresentado como indicação neste resultado. Pergunte qual atividade ou área ela gostaria de investigar; não pergunte por uma lista que ela não recebeu.',
 ];
 commercial[5].paragraphs=[ranking.notice,...ranking.top.flatMap((c,i)=>[...rankingCourseParagraphs(c,i+1),'Pergunta para conversar: '+c.question]),interestText,...(declared?.outsideTop&&declared.course?['Interesse fora dos cinco: '+declared.course.name+'. Atividade: '+declared.course.activity+'. Compare o que a pessoa deseja nessa profissão com as atividades das opções apresentadas, sem tratar o ranking como veto.']:[]),'As opções e índices acima são os mesmos do relatório individual. Pergunte o que a pessoa reconhece, qual atividade quer conhecer e o que deseja aprender. Não presuma competência, renda ou prontidão de matrícula.'];
 commercial[7].paragraphs=[
  'Siga a conversa nesta ordem: identificação com o resultado → reflexão sobre uma cena → escolha entre as opções realmente apresentadas → interesse pela profissão → condições para começar → matrícula, se a pessoa desejar e houver elegibilidade.',
  'Depois de uma escolha, pergunte o que chamou atenção na profissão e como imagina uma rotina nessa área. Só então conheça as condições que ela deseja compartilhar para começar. Confirme formação exigida, oferta, modalidade e condições comerciais atuais antes de falar em matrícula; não prometa vaga, salário ou aprovação.',
 ];
 const content={version:PUBLIC_EDITION,sourceHash:PUBLIC_EDITION_SOURCE_HASH,participant,commercial,courses,whatsapp,ranking};
 return {...content,contentHash:hash(content)};
}
export function verifyPublishedEditorial(j:DeliveredJourney,approvedVersion:string):PublishedEditorial{
 const p=j.publication;if(!p||p.version!==approvedVersion||p.participant.length!==9||p.commercial.length!==9)throw Error('Published edition unavailable');
 const {contentHash,...content}=p;if(hash(content)!==contentHash)throw Error('Published content integrity');
 for(const sections of [p.participant,p.commercial])for(const s of sections)if(!s.paragraphs.length||s.paragraphs.some(t=>!t.trim()))throw Error('Incomplete published edition');
 return p;
}
/** Deliberately copy participant fields only: the public projection cannot serialize commercial/audit data. */
export function publishedParticipantReport(j:DeliveredJourney,approvedVersion:string){
 const p=verifyPublishedEditorial(j,approvedVersion);
 return {audience:'participant' as const,name:j.registration.name,profiles:profileDisplaySummary(j.analysis),sections:p.participant.map(s=>({...s,paragraphs:[...s.paragraphs]})),renderHash:p.contentHash};
}

export function knownPublishedEdition(version:string,sourceHash:string){return version===PUBLIC_EDITION&&sourceHash===PUBLIC_EDITION_SOURCE_HASH||version===PREVIOUS_EDITION&&sourceHash===PREVIOUS_SOURCE_HASH||version===V3_EDITION&&sourceHash===V3_HASH;}
export function composeEntryEditorial(j:IntegratedJourney,version:string){if(version===PUBLIC_EDITION)return composePublishedEditorial(j);if(version===PREVIOUS_EDITION)return composePreviousEditorial(j);if(version===V3_EDITION)return composeIntegratedV3(j);throw Error('Unsupported entry edition');}
