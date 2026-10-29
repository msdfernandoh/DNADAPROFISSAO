import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {completeOwnPublicEvaluation,validatePublicAnswers} from '@/lib/saas/public-journey-server';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 const input=await smallJson(request,8192);try{validatePublicAnswers(input);}catch{return privateReply({error:'Responda às 15 situações para finalizar.'},400);}
 try{return privateReply(await completeOwnPublicEvaluation((await params).id,input));}catch{return privateReply({error:'Não foi possível concluir agora. Suas respostas foram mantidas; tente novamente.'},503);}
}
