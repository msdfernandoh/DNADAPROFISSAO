import {privateReply,smallJson} from '@/lib/saas/http';
import {evaluationFlags} from '@/lib/saas/flags';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {createClient} from '@/lib/supabase/individual-server';
import {loadVerifiedIdentity,type IdentityClient} from '@/lib/saas/identity';
import {pilotIdentity} from '@/lib/saas/pilot';
export const dynamic='force-dynamic';
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 if(!evaluationFlags(process.env).completion)return privateReply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem não autorizada'},403);
 const input=await smallJson(request,8192),{id}=await context.params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!input||Object.keys(input).some(k=>!['revision','answers'].includes(k))||typeof input.revision!=='string'||!Array.isArray(input.answers))return privateReply({error:'Respostas inválidas'},400);
 try{
  const db=await createClient();
  if(!pilotIdentity(await loadVerifiedIdentity(db as unknown as IdentityClient),process.env))return privateReply({error:'Acesso não autorizado'},401);
  const result=await db.rpc('dna_save_evaluation_draft',{p_participant:id,p_revision:input.revision,p_answers:input.answers});
  if(result.error||result.data?.saved!==true)throw Error('Draft unavailable');
  return privateReply({saved:true,answerCount:result.data.answerCount});
 }catch{return privateReply({error:'Não foi possível salvar. Tente novamente antes de sair.'},503);}
}
