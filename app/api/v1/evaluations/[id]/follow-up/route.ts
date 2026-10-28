import {privateReply,smallJson} from '@/lib/saas/http';
import {currentIdentity} from '@/lib/saas/server';
import {createClient} from '@/lib/supabase/individual-server';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida'},403);
 const input=await smallJson(request,8192);
 if(!input||Object.keys(input).some(k=>!['status','notes','updatedAt'].includes(k))||typeof input.updatedAt!=='string')return privateReply({error:'Dados inválidos'},400);
 try{
  if(!await currentIdentity())return privateReply({error:'Não autorizado'},401);
  const {id}=await params,db=await createClient(),{updatedAt,...changes}=input;
  const result=await db.rpc('dna_update_follow_up',{p_participant:id,p_changes:changes,p_expected:updatedAt});
  if(result.error)return privateReply({error:'Não foi possível salvar. Recarregue o atendimento e confira seu acesso.'},409);
  return privateReply({saved:result.data?.saved===true});
 }catch{return privateReply({error:'Atendimento indisponível'},503);}
}
