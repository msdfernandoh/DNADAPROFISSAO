import {TeamDashboard,type DashboardData} from '@/components/saas/TeamDashboard';
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
 let dashboard:DashboardData|null=null;
 if(enabled){const db=await createClient();const result=await db.rpc('dna_team_dashboard',{p_institution:identity.institutionIds[0]});if(!result.error&&result.data)dashboard=result.data;}
 return <main className="max-w-4xl mx-auto px-4 py-8 space-y-6"><h1 className="font-serif text-3xl">Olá, {identity.displayName}</h1><p>Seu acesso individual foi confirmado.</p><p>{identity.globalOwner?'Proprietário da plataforma':identity.institutionIds.length+' instituição(ões) autorizada(s)'}</p>
 {administrator&&<Link className="inline-block underline text-amber-200" href="/equipe/polos">Gerenciar polos, cidades atendidas e distribuição de leads</Link>}
 {enabled&&administrator&&<section className="rounded-xl border p-5 space-y-3"><h2 className="text-2xl font-serif">Créditos</h2>{credits?<><p className="text-3xl font-bold">{credits.balance} disponíveis</p><p className="text-sm">O crédito é consumido uma única vez, após conclusão válida e resultado salvo.</p><details><summary className="cursor-pointer py-2">Ver movimentações de créditos</summary><ul className="divide-y">{credits.events.map(e=><li key={e.id} className="py-2 flex justify-between gap-3"><span>{({v1_grant:'Concessão',v1_consume:'Avaliação concluída',v1_refund:'Estorno',v1_adjustment:'Ajuste'} as Record<string,string>)[e.type]||e.type} · {new Date(e.created_at).toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'})}</span><strong>{e.amount>0?'+':''}{e.amount}</strong></li>)}</ul></details></>:<p role="alert">Não foi possível consultar o saldo. Tente novamente.</p>}</section>}
 {enabled&&<section className="space-y-4"><h2 className="text-2xl font-serif">Participantes e avaliações</h2>
 {identity.grants.some(g=>g.resource==='lead'&&g.action==='create'&&g.allowed)&&<Link className="inline-block rounded-full bg-[#2D1F5E] text-white px-5 py-3" href="/equipe/avaliacoes/nova">Cadastrar participante</Link>}
 {dashboard?<TeamDashboard initial={dashboard}/>:<p role="alert">Não foi possível consultar o painel. Recarregue a página para tentar novamente.</p>}
 </section>}
 {(identity.globalOwner||administrator)&&flags.internalPreview&&<section className="rounded-xl border border-amber-400/40 p-5 space-y-3"><h2 className="font-serif text-2xl">Ateliê dos relatórios</h2><p>Prévias para homologação: cinco perfis, vinte combinações e relatórios completos de personagens fictícios.</p><Link className="underline text-amber-200" href="/equipe/revisao-relatorios">Revisar textos e novo visual</Link></section>}
 {identity.globalOwner&&flags.internalPreview&&<Link className="underline" href="/admin/integracao-v1">Revisão interna dos relatórios</Link>}<IndividualSignOut/></main>;
}
