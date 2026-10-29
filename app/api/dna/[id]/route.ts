import {privateReply} from '@/lib/saas/http';
import {loadOwnPublicEvaluation} from '@/lib/saas/public-journey-server';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params,{participant:p}=await loadOwnPublicEvaluation(id);return privateReply({id:p.id,completed:p.quiz_completed,answers:p.v1_draft_answers,url:p.quiz_completed?'/meu-dna/'+p.id:null});}catch{return privateReply({error:'Avaliação indisponível neste navegador.'},404);}}
