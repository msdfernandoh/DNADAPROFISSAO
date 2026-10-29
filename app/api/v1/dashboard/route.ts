import {currentIdentity} from '@/lib/saas/server';
import {createClient} from '@/lib/supabase/individual-server';
import {privateReply} from '@/lib/saas/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const identity=await currentIdentity();if(!identity?.institutionIds.length)return privateReply({error:'Acesso restrito.'},403);
 const q=new URL(request.url).searchParams,filter=q.get('filter')||'all',after=q.get('after'),id=q.get('id');
 if(!['all','report','enrolled'].includes(filter)||(after===null)!==(id===null)||after&&!Number.isFinite(Date.parse(after))||id&&!/^[a-f0-9-]{36}$/i.test(id))return privateReply({error:'Filtro inválido.'},400);
 const db=await createClient(),r=await db.rpc('dna_team_dashboard',{p_institution:identity.institutionIds[0],p_filter:filter,p_after:after,p_after_id:id});
 if(r.error)throw Error();return privateReply(r.data);
 }catch{return privateReply({error:'Não foi possível consultar o painel.'},503);}}
