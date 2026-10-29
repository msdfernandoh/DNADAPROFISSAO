import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {loadOwnPublicEvaluation,validatePublicAnswers} from '@/lib/saas/public-journey-server';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 let input,answers;try{input=await smallJson(request,8192);answers=validatePublicAnswers(input,true);}catch{return privateReply({error:'Respostas inválidas.'},400);}
 try{const {db,participant:p}=await loadOwnPublicEvaluation((await params).id);const r=await db.rpc('dna_save_public_evaluation_draft',{p_participant:p.id,p_revision:p.v1_revision,p_answers:answers});if(r.error||r.data?.saved!==true)throw Error('Unavailable');return privateReply(r.data);}catch{return privateReply({error:'Não foi possível salvar. Mantenha a página aberta e tente novamente.'},403);}
}
