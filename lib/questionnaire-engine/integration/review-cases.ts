import fixtures from '../__fixtures__/individual/cases.json';
import { answersFromLetters } from '../individual/instrument';
import { createJourney, INTEGRATED_REVISION } from './journey';
export const reviewCaseNames=[...fixtures.casos.map(f=>f.nome),'Empate_principal','Empate_secundario'] as const;
/** Strictly synthetic inputs. No participant lookup, persistence, credits or real contact data. */
export function buildReviewCase(name:string){
 const f=fixtures.casos.find(f=>f.nome===name),vector=name==='Empate_principal'?'ACBEDDCAADCBBCC':name==='Empate_secundario'?'CAADDDBACCCACCE':null;
 if(!f&&!vector)throw new Error('Unknown fictional review case');
 const answers=f?answersFromLetters(f.respostas):answersFromLetters(Object.fromEntries([...vector!].map((v,i)=>['Q'+String(i+1).padStart(2,'0'),v])));
 return createJourney({revision:INTEGRATED_REVISION,registration:{name:name+' (fictícia)',phone:'00000000000',email:'personagem@example.invalid',city:null,escolaridade:null,course_interest:null,objective:null,priorCourse:null,orientationMode:'undefined_interest',declaredArea:null},answers},{scope:{participantId:'review-fictional',institutionId:'review-fictional',unitId:null,assignedUserId:null},institutionName:'Instituição fictícia',release:'not_released',reading:'unknown'});
}
