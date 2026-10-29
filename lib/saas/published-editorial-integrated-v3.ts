import {composePublishedEditorial as composePreviousEditorial,PUBLIC_EDITION as PREVIOUS_EDITION,PUBLIC_EDITION_SOURCE_HASH as PREVIOUS_SOURCE_HASH} from './published-editorial-20261028';
import {createHash} from 'node:crypto';
import {composeIntegratedHumanized,INTEGRATED_EDITORIAL_VERSION} from '../questionnaire-engine/individual/editorial/integrated-humanized';
import {profileDisplaySummary} from '../questionnaire-engine/integration/profile-summary';
import type {IntegratedJourney} from '../questionnaire-engine/integration/journey';
import {buildCourseMatrix} from '../questionnaire-engine/careers/build-course-matrix';
const edition={sourceHash:'73dfefa57b4aced5b68550a5af7ac9fbf17c3b3388ea8434f626ea3417069a4e'};

export const PUBLIC_EDITION=INTEGRATED_EDITORIAL_VERSION+'.public-1';
export const PUBLIC_EDITION_SOURCE_HASH=edition.sourceHash;
type Section={number:number;title:string;paragraphs:string[]};
export type PublishedCourse={id:string;name:string;level:string;why:string;activity:string;investigate:string;admission:string};
export type PublishedEditorial={version:string;sourceHash:string;participant:Section[];commercial:Section[];courses:PublishedCourse[];whatsapp:string;contentHash:string};
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
 const courses:PublishedCourse[]=j.orientation.exploratoryCourses.map(c=>({id:c.courseId,name:c.courseName,level:c.level,why:c.whyIncluded,activity:c.concreteActivity,investigate:c.whatToInvestigate,admission:'Possibilidade para explorar. Oferta, requisitos e elegibilidade devem ser confirmados pela instituição antes de uma matrícula.'}));
 // An exact declared course can use its received catalog description; never infer a course from a score.
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const declared=j.registration.course_interest;
 if(declared&&!courses.length){const c=buildCourseMatrix().find(c=>normalize(c.name)===normalize(declared));if(c&&(c.level!=='pos_graduacao'||['graduado','pos_graduado'].includes(j.registration.escolaridade||'')))courses.push({id:c.id,name:c.name,level:c.level,why:'Você declarou interesse neste curso. A descrição recebida serve para investigar esse interesse; o resultado não é uma indicação de aptidão.',activity:c.activities[0]?.text||c.sourceDescriptions[0],investigate:'Conheça uma tarefa e uma semana comum de quem atua nessa área. Pergunte quais conhecimentos são usados e quais requisitos de formação precisam ser cumpridos.',admission:'Exploração do interesse declarado. Confirme escolaridade, requisitos e oferta vigente antes da matrícula.'});}
 if(courses.length){
  participant[7].paragraphs.push('A partir do interesse ou da área que você declarou, estas são possibilidades para conhecer melhor. Elas não representam percentuais de compatibilidade nem uma oferta de matrícula.');
  for(const c of courses)participant[7].paragraphs.push(c.name+'. '+c.why+' Uma atividade para conhecer: '+c.activity+' '+c.investigate+' '+c.admission);
 }
 const first=j.registration.name.split(' ')[0];
 const whatsapp='Oi, '+first+'! Seu DNA está pronto. Você já recebeu a ficha completa ou quer ajuda para acessar? Depois de ler, me conte: conseguiu se enxergar no resultado do seu DNA da Profissão®? Teve alguma parte que parecia estar falando exatamente de você? Se quiser, podemos conversar sobre uma situação que chamou sua atenção.';
 commercial[2].paragraphs=[whatsapp];
 commercial[3].paragraphs=[
  'Comece pela identificação: “'+first+', você conseguiu se enxergar no resultado? Teve alguma parte que parecia estar falando exatamente de você?” Escute também o que não combinou.',
  'Depois, retome uma cena que a própria pessoa destacou no relatório: “Você se lembra de uma situação parecida? O que costuma fazer naquele momento?” Compare com as respostas sem atribuir sentimentos ou dificuldades que ela não relatou.',
  courses.length?'Só depois entre nas opções que ela viu: “Dos cursos que apareceram no seu DNA — '+courses.map(c=>c.name).join(', ')+' — qual chamou mais sua atenção? Com qual se identificou?”':'Nenhum curso foi apresentado como indicação neste resultado. Pergunte qual atividade ou área ela gostaria de investigar; não pergunte por uma lista que ela não recebeu.',
 ];
 commercial[5].paragraphs=courses.length?courses.map(c=>c.name+'. Esta é a mesma opção exibida à pessoa participante. '+c.activity+' '+c.investigate+' '+c.admission):['Não foram apresentados cursos neste resultado. Explore o interesse com a pessoa antes de apresentar opções. Não transforme um perfil em recomendação automática.'];
 commercial[7].paragraphs=[
  'Siga a conversa nesta ordem: identificação com o resultado → reflexão sobre uma cena → escolha entre as opções realmente apresentadas → interesse pela profissão → condições para começar → matrícula, se a pessoa desejar e houver elegibilidade.',
  'Depois de uma escolha, pergunte o que chamou atenção na profissão e como imagina uma rotina nessa área. Só então conheça as condições que ela deseja compartilhar para começar. Confirme formação exigida, oferta, modalidade e condições comerciais atuais antes de falar em matrícula; não prometa vaga, salário ou aprovação.',
 ];
 const content={version:PUBLIC_EDITION,sourceHash:PUBLIC_EDITION_SOURCE_HASH,participant,commercial,courses,whatsapp};
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

export function knownPublishedEdition(version:string,sourceHash:string){return version===PUBLIC_EDITION&&sourceHash===PUBLIC_EDITION_SOURCE_HASH||version===PREVIOUS_EDITION&&sourceHash===PREVIOUS_SOURCE_HASH;}
export function composeEntryEditorial(j:IntegratedJourney,version:string){if(version===PUBLIC_EDITION)return composePublishedEditorial(j);if(version===PREVIOUS_EDITION)return composePreviousEditorial(j);throw Error('Unsupported entry edition');}
