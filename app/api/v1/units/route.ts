import {currentIdentity} from '@/lib/saas/server';
import {createClient} from '@/lib/supabase/individual-server';
import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
export const dynamic='force-dynamic';
async function authorized(){const identity=await currentIdentity();if(!identity?.memberships.some(m=>m.role_code==='institution_admin'))return null;return createClient();}
export async function GET(){try{const db=await authorized();if(!db)return privateReply({error:'Acesso restrito à administração.'},403);const r=await db.rpc('dna_list_routing_units');if(r.error)throw Error();return privateReply(r.data);}catch{return privateReply({error:'Não foi possível consultar os polos.'},503);}}
export async function POST(request:Request){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 const data=await smallJson(request,20000);if(!data)return privateReply({error:'Confira os dados do polo.'},400);
 try{const db=await authorized();if(!db)return privateReply({error:'Acesso restrito à administração.'},403);const r=await db.rpc('dna_save_routing_unit',{p_data:data});if(r.error)return privateReply({error:'Confira cidade-sede, cobertura exclusiva e vendedores habilitados. Um polo ativo precisa de pelo menos um vendedor. Links pessoais devem pertencer a uma conta autorizada nesse polo.'},400);return privateReply({id:r.data});}catch{return privateReply({error:'Não foi possível salvar o polo. Tente novamente.'},503);}
}
