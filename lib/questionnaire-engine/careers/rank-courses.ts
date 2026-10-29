import matrix from './ranking-matrix.json';
import type {IntegratedJourney} from '../integration/journey';
import type {ProfileCode} from '../individual/types';
import {classifyIndividualScores} from '../individual/analyze-individual';
import {profileNames} from '../individual/editorial/restore-humanized';
export const RANKING_VERSION='dna-course-ranking-2026-10-29.v1';
export const RANKING_NOTICE='Matriz inicial provisória, em validação metodológica. O índice de aderência relativa é calculado de 0 a 100 pontos para explorar cursos; não mede competência técnica, probabilidade de sucesso, aptidão comprovada ou direito à matrícula.';
const codes:ProfileCode[]=['L','C','E','H','P'];
export const normalizeCourse=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function courseRankingMatrix(){return structuredClone(matrix);}
export function findRankingCourse(value:string){const key=normalizeCourse(value);return matrix.courses.find(c=>[c.name,...c.aliases].some(n=>normalizeCourse(n)===key));}
const signals:Record<string,Record<string,{tags:string[];meaning:string}>>={
 Q02:{A:{tags:['practice'],meaning:'experimentar para compreender como algo funciona'},B:{tags:['analysis','organization'],meaning:'compreender instruções e sequência antes de executar'},C:{tags:['coordination'],meaning:'dividir recursos e buscar ajuda para encaminhar uma tarefa'},D:{tags:['communication','care'],meaning:'realizar uma tarefa em parceria'}},
 Q06:{A:{tags:['analysis'],meaning:'buscar fundamentos para começar a aprender'},B:{tags:['practice'],meaning:'aprender por tentativa, observação e ajuste'},C:{tags:['communication','teaching'],meaning:'aprender por troca e experiência compartilhada'},D:{tags:['coordination','organization'],meaning:'orientar a aprendizagem por um objetivo concreto'}},
 Q07:{A:{tags:['organization','analysis'],meaning:'organizar etapas para aproveitar tempo e recursos'},B:{tags:[],meaning:'ajustar a carga de tarefas à disposição daquele dia'},C:{tags:['coordination','organization'],meaning:'priorizar e dividir tarefas'},D:{tags:['communication'],meaning:'abrir espaço para encontros e ajustes no percurso'}},
 Q08:{A:{tags:['care'],meaning:'escutar antes de propor uma resposta'},B:{tags:['analysis','coordination'],meaning:'organizar possibilidades para enfrentar uma dificuldade'},C:{tags:['care','practice'],meaning:'oferecer ajuda concreta'},D:{tags:['communication','care'],meaning:'usar a conversa como forma de apoio'}},
 Q09:{A:{tags:['analysis'],meaning:'comparar informações numa decisão importante'},B:{tags:['coordination'],meaning:'avaliar uma oportunidade ligada a um objetivo'},C:{tags:['communication','creativity'],meaning:'explorar possibilidades e trocar referências'}},
 Q12:{A:{tags:[],meaning:'se afastar de uma discussão'},B:{tags:['care','communication'],meaning:'buscar reduzir tensão pelo diálogo'},C:{tags:['analysis'],meaning:'considerar pontos de vista antes de opinar'}},
 Q13:{A:{tags:['coordination','organization'],meaning:'dar forma a uma atividade ou próximo passo'},B:{tags:[],meaning:'reservar tempo para descanso'},C:{tags:['creativity','communication'],meaning:'buscar novas ideias e referências'}},
 Q15:{A:{tags:['coordination','organization'],meaning:'organizar responsabilidades para uma atividade acontecer'},B:{tags:['analysis','organization'],meaning:'conferir quantidades, custos e horários'},C:{tags:['communication'],meaning:'convidar e aproximar pessoas'},D:{tags:['practice'],meaning:'apoiar a execução e a preparação'},E:{tags:['care','teaching'],meaning:'cuidar da participação e inclusão das pessoas'}},
};
const round=(n:number)=>Math.round(n*10000)/10000;
export type RankedCourse={id:string;name:string;level:'graduacao';position:number;tied:boolean;index:number;why:string;forces:string[];activity:string;challenge:string;question:string;admission:string;audit:{distribution:number;orderedPair:number;responseFit:number;interest:number;rawIndex:number;matrixWeights:Record<ProfileCode,number>;matchedSignals:{questionId:string;alternativeId:string;meaning:string;tags:string[]}[];sourceIds:string[]}};
export function rankCourses(j:Pick<IntegratedJourney,'analysis'|'registration'>){
 const {scores,evidence}=j.analysis,c=classifyIndividualScores(scores),total=codes.reduce((n,k)=>n+scores[k],0);
 const declared=j.registration.course_interest?.trim()||null,desired=declared?findRankingCourse(declared):undefined;
 if(!total)return {version:RANKING_VERSION,matrixVersion:matrix.version,status:'insufficient_evidence' as const,notice:RANKING_NOTICE,top:[] as RankedCourse[],all:[] as RankedCourse[],declared:declared?{name:declared,matched:false,rank:null,index:null,outsideTop:true,course:null as RankedCourse|null}:null,boundaryTies:[] as string[]};
 const observations=Object.entries(signals).map(([questionId,options])=>{const e=evidence.find(e=>e.questionId===questionId);if(!e||!options[e.letter])throw Error('Incomplete ranking evidence');return {questionId,alternativeId:e.alternativeId,...options[e.letter]};});
 const positive=c.groups.filter(g=>g.score>0),mainGroup=positive[0]?.profiles||[],secondaryGroup=positive.length>1&&mainGroup.length===1?positive[1].profiles:[];
 const area=normalizeCourse(j.registration.declaredArea||'');
 const all:RankedCourse[]=matrix.courses.map(course=>{
  const w=course.weights as Record<ProfileCode,number>,max=4;
  const distribution=codes.reduce((n,k)=>n+scores[k]/total*w[k]/max,0);
  const mean=(group:ProfileCode[])=>group.length?group.reduce((n,k)=>n+w[k]/max,0)/group.length:0;
  // Equal leaders have equal weight. A zero second score never supplies pair points.
  const orderedPair=secondaryGroup.length?(2*mean(mainGroup)+mean(secondaryGroup))/3:mean(mainGroup);
  const matched=observations.filter(o=>o.tags.some(t=>course.tags.includes(t))),responseFit=matched.length/observations.length;
  const interest=desired?.id===course.id?1:area&&course.areas.some(a=>normalizeCourse(a)===area)?0.5:0;
  const rawIndex=70*distribution+15*orderedPair+10*responseFit+5*interest;
  const contributors=codes.filter(k=>scores[k]>0&&w[k]>0).sort((a,b)=>scores[b]*w[b]-scores[a]*w[a]||codes.indexOf(a)-codes.indexOf(b)).slice(0,2);
  const forces=contributors.map(k=>profileNames[k]);
  const individual=matched.slice(0,2).map(o=>o.meaning).join(' e ');
  const why='O encontro entre '+forces.join(' e ')+' aproxima este curso das contribuições que apareceram no seu DNA. '+(individual?(matched.length>1?'Em situações diferentes, apareceu espaço para ':'Em uma das situações, apareceu espaço para ')+individual+'. Essas pistas dialogam com a atividade de '+course.activity+'.':'A distribuição completa das cinco forças foi considerada, sem transformar a predominância numa lista fixa de profissões.')+(interest===1?' Seu interesse declarado também foi considerado, com influência limitada no índice.':'')+' Essa aproximação serve para investigar a rotina; não demonstra que você já tenha os conhecimentos técnicos da área.';
  return {id:course.id,name:course.name,level:'graduacao' as const,position:0,tied:false,index:0,why,forces,activity:course.activity,challenge:course.challenge,question:'Ao conhecer a atividade de '+course.activity+', qual parte desperta interesse e qual exigência você quer compreender melhor?',admission:'Exploração de graduação. Confirme escolaridade, requisitos, modalidade, habilitação e oferta da unidade antes da matrícula.',audit:{distribution:round(distribution),orderedPair:round(orderedPair),responseFit:round(responseFit),interest,rawIndex:round(rawIndex),matrixWeights:{...w},matchedSignals:matched.map(o=>({...o})),sourceIds:[...course.sourceIds]}};
 });
 // Compare full precision retained to 4 decimals; equal index is not a professional superiority claim.
 all.sort((a,b)=>b.audit.rawIndex-a.audit.rawIndex||a.id.localeCompare(b.id,'en'));
 all.forEach((course,i)=>{course.index=Math.round(course.audit.rawIndex*10)/10;const first=all.findIndex(x=>x.audit.rawIndex===course.audit.rawIndex);course.position=first+1;course.tied=all.some(x=>x.id!==course.id&&x.audit.rawIndex===course.audit.rawIndex);});
 const top=all.slice(0,5),boundaryTies=all.slice(5).filter(c=>c.audit.rawIndex===top[4]?.audit.rawIndex).map(c=>c.name),interestResult=desired?all.find(c=>c.id===desired.id):null;
 return {version:RANKING_VERSION,matrixVersion:matrix.version,status:'provisional_pending_methodological_validation' as const,notice:RANKING_NOTICE,top,all,declared:declared?{name:declared,matched:!!interestResult,rank:interestResult?.position??null,index:interestResult?.index??null,outsideTop:!top.some(c=>c.id===interestResult?.id),course:interestResult||null}:null,boundaryTies};
}
export function rankingCourseParagraphs(course:RankedCourse,ordinal:number){return [
 ordinal+'º · '+course.name+' — Índice de aderência: '+course.index.toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1})+'/100 pontos'+(course.tied?' · empate de índice':''),
 'Por que explorar: '+course.why,
 'Forças que contribuem: '+course.forces.join(' e ')+'.',
 'Na prática: '+course.activity+'.',
 'Desafios para conhecer: '+course.challenge,
];}
