import {privateReply as reply,smallJson} from '@/lib/saas/http';
import {evaluationFlags} from '@/lib/saas/flags';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {completeStoredEvaluation} from '@/lib/saas/completion-server';
export const dynamic='force-dynamic';
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 if(!evaluationFlags(process.env).completion)return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 const input=await smallJson(request,8192);
 if(!input||Object.keys(input).some(k=>!['revision','answers'].includes(k)))return reply({error:'Respostas inválidas'},400);
 try{
  const {id}=await context.params;
  const receipt=await completeStoredEvaluation(id,input);
  // Never return the server snapshot, commercial report, scores or arbitrary claims.
  return reply(receipt,receipt.state==='no_credit'?409:200);
 }catch{return reply({error:'Não foi possível concluir. Preserve as respostas para tentar novamente.'},503);}
}
