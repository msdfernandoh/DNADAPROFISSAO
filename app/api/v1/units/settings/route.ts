import {currentIdentity} from '@/lib/saas/server';
import {createClient} from '@/lib/supabase/individual-server';
import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
export const dynamic='force-dynamic';
async function admin(){const i=await currentIdentity();return i?.memberships.some(m=>m.role_code==='institution_admin')?i:null;}
export async function GET(){try{const i=await admin();if(!i)return privateReply({error:'Acesso restrito.'},403);const db=await createClient(),r=await db.rpc('dna_list_unit_contacts');if(r.error)throw Error();return privateReply({...r.data,master:i.globalOwner});}catch{return privateReply({error:'Não foi possível consultar os contatos.'},503);}}
export async function POST(request:Request){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 const d=await smallJson(request,2000);if(!d)return privateReply({error:'Dados inválidos.'},400);
 try{const i=await admin();if(!i||d.kind==='state'&&!i.globalOwner)return privateReply({error:'Permissão insuficiente.'},403);const db=await createClient();
 if(d.kind==='state'&&Object.keys(d).every(k=>['kind','state','unit'].includes(k))&&typeof d.state==='string'&&(typeof d.unit==='string'||d.unit===null)){
 const r=await db.rpc('dna_set_state_coverage',{p_state:d.state,p_unit:d.unit});return r.error?privateReply({error:'Escolha uma unidade ativa com créditos habilitados.'},400):privateReply({saved:true});}
 if(d.kind==='contact'&&Object.keys(d).every(k=>['kind','unit','user','phone','principal'].includes(k))&&typeof d.unit==='string'&&typeof d.user==='string'&&typeof d.phone==='string'&&typeof d.principal==='boolean'){
 const r=await db.rpc('dna_save_unit_contact',{p_unit:d.unit,p_user:d.user,p_phone:d.phone,p_principal:d.principal});return r.error?privateReply({error:'Confira o WhatsApp com 55 e DDD e a autorização da pessoa neste polo.'},400):privateReply({saved:true});}
 return privateReply({error:'Dados inválidos.'},400);
 }catch{return privateReply({error:'Não foi possível salvar.'},503);}
}
