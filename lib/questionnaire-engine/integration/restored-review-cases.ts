import questions from '../__fixtures__/individual/questions.json';
import {buildReviewCase} from './review-cases';
import {createJourney,INTEGRATED_REVISION} from './journey';
import {classifyIndividualScores} from '../individual/analyze-individual';
import type {ProfileCode} from '../individual/types';
import {profileNames} from '../individual/editorial/restore-humanized';
export const restoredReviewNames=['Ana','Beatriz','Camila','Liderança','Comunicação','Humanizado','Prático','Empate','Sem interesse declarado','Carreira pública','Mesmos pontos A','Mesmos pontos B'] as const;
export function buildRestoredReview(name:string){
 if(['Ana','Beatriz','Camila'].includes(name))return {journey:buildReviewCase(name),careerPreference:undefined};
 if(name==='Empate')return {journey:buildReviewCase('Empate_principal'),careerPreference:undefined};
 if(name==='Mesmos pontos A'||name==='Mesmos pontos B')return {journey:buildReviewCase(name.endsWith('A')?'Comparacao_A':'Comparacao_B'),careerPreference:undefined};
 if(name==='Sem interesse declarado')return {journey:buildReviewCase('Ana'),careerPreference:undefined};
 if(name==='Carreira pública')return {journey:buildReviewCase('Ana'),careerPreference:'public' as const};
 const first:Record<string,ProfileCode>={'Liderança':'L','Comunicação':'C','Humanizado':'H','Prático':'P'};
 const pair=name.includes('+')?name:null,main=pair?.split('+')[0] as ProfileCode||first[name];
 if(!main||!Object.hasOwn(profileNames,main))throw Error('Unknown review case');
 let seed=[...name].reduce((sum,c)=>sum+c.charCodeAt(0),17);
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let attempt=0;attempt<20000;attempt++){
  const chosen=questions.map(q=>{const sorted=[...q.options].sort((a,b)=>((b.weights as Partial<Record<ProfileCode,number>>)[main]||0)-((a.weights as Partial<Record<ProfileCode,number>>)[main]||0));return random()<0.42?sorted[0]:q.options[Math.floor(random()*q.options.length)];});
  const scores={L:0,C:0,E:0,H:0,P:0};for(const option of chosen)for(const code of Object.keys(scores) as ProfileCode[])scores[code]+=(option.weights as Partial<Record<ProfileCode,number>>)[code]||0;
  const classification=classifyIndividualScores(scores);if(classification.main!==main||(pair&&classification.pair!==pair))continue;
  const journey=createJourney({revision:INTEGRATED_REVISION,registration:{name:name+' — exemplo fictício',phone:'00000000000',email:'personagem@example.invalid',city:'Sinop',escolaridade:null,course_interest:null,objective:null,priorCourse:null,orientationMode:'undefined_interest',declaredArea:null},answers:questions.map((q,i)=>({questionId:'Q'+String(q.number).padStart(2,'0'),alternativeId:'Q'+String(q.number).padStart(2,'0')+':'+chosen[i].letter}))},{scope:{participantId:'review-'+name,institutionId:'fictional-review',unitId:'fictional-unit',assignedUserId:null},institutionName:'Instituição fictícia',unitName:'Unidade fictícia',release:'not_released',reading:'unknown'});
  return {journey,careerPreference:undefined};
 }
 throw Error('No valid answer vector found for '+name);
}
