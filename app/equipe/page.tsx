import { notFound,redirect } from 'next/navigation';
import Link from 'next/link';
import { v1Flags,evaluationFlags } from '@/lib/saas/flags';
import { createClient } from '@/lib/supabase/individual-server';
import { currentIdentity } from '@/lib/saas/server';
import { IndividualSignOut } from '@/components/saas/IndividualAccess';
export const dynamic='force-dynamic';
export const metadata={title:'Equipe — DNA da Profissão',robots:{index:false,follow:false}};
export default async function TeamPage(){
 const flags=v1Flags(process.env);if(!flags.individualAccess)notFound();
 const identity=await currentIdentity();if(!identity||(!identity.globalOwner&&!identity.memberships.length))redirect('/equipe/acesso');
 const enabled=evaluationFlags(process.env).completion;
 let credits:{balance:number;events:{id:string;type:string;amount:number;created_at:string}[]}|null=null;
 const administrator=identity.memberships.some(m=>m.role_code==='institution_admin');
 if(enabled&&administrator){const db=await createClient();const result=await db.rpc('dna_credit_summary',{p_institution:identity.institutionIds[0]});if(!result.error&&typeof result.data?.balance==='number'&&Array.isArray(result.data.events))credits=result.data;}
 let evaluations:{id:string;name:string;quiz_completed:boolean;updated_at:string}[]=[],listFailed=false;
 if(enabled){const db=await createClient();const result=await db.rpc('dna_list_evaluations',{p_institution:identity.institutionIds[0]});listFailed=!!result.error;if(!result.error&&Array.isArray(result.data))evaluations=result.data;}
 return <main className="max-w-4xl mx-auto px-4 py-8 space-y-6"><h1 className="font-serif text-3xl">Olá, {identity.displayName}</h1><p>Seu acesso individual foi confirmado.</p><p>{identity.globalOwner?'Proprietário da plataforma':identity.institutionIds.length+' instituição(ões) autorizada(s)'}</p>
 {enabled&&administrator&&<section className="rounded-xl border p-5 space-y-3"><h2 className="text-2xl font-serif">Créditos</h2>{credits?<><p className="text-3xl font-bold">{credits.balance} disponíveis</p><p className="text-sm">O crédito é consumido uma única vez, após conclusão válida e resultado salvo.</p><ul className="divide-y">{credits.events.map(e=><li key={e.id} className="py-2 flex justify-between gap-3"><span>{({v1_grant:'Concessão',v1_consume:'Avaliação concluída',v1_refund:'Estorno',v1_adjustment:'Ajuste'} as Record<string,string>)[e.type]||e.type} · {new Date(e.created_at).toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'})}</span><strong>{e.amount>0?'+':''}{e.amount}</strong></li>)}</ul></>:<p role="alert">Não foi possível consultar o saldo. Tente novamente.</p>}</section>}
 {enabled&&<section className="space-y-4"><h2 className="text-2xl font-serif">Participantes e avaliações</h2>
 {identity.grants.some(g=>g.resource==='lead'&&g.action==='create'&&g.allowed)&&<Link className="inline-block rounded-full bg-[#2D1F5E] text-white px-5 py-3" href="/equipe/avaliacoes/nova">Cadastrar participante</Link>}
 {listFailed?<p role="alert">Não foi possível consultar as avaliações. Tente novamente.</p>:evaluations.length===0?<p>Nenhuma avaliação disponível no seu escopo.</p>:<ul className="divide-y">{evaluations.map(p=><li key={p.id} className="py-4 flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{p.name}</p><p>{p.quiz_completed?'Concluída':'Em andamento'}</p></div><div className="flex flex-wrap gap-4"><Link className="underline" href={'/equipe/avaliacoes/'+p.id+'/atendimento'}>Atendimento</Link><Link className="underline" href={'/equipe/avaliacoes/'+p.id}>{p.quiz_completed?'Ver conclusão':'Continuar avaliação'}</Link>{p.quiz_completed&&flags.internalPreview&&<Link className="underline" href={'/equipe/avaliacoes/'+p.id+'/relatorios'}>Relatórios</Link>}</div></li>)}</ul>}
 </section>}
 {identity.globalOwner&&flags.internalPreview&&<Link className="underline" href="/admin/integracao-v1">Revisão interna dos relatórios</Link>}<IndividualSignOut/></main>;
}
