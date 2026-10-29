import {notFound} from 'next/navigation';
import Link from 'next/link';
import {currentIdentity} from '@/lib/saas/server';
import {createClient} from '@/lib/supabase/individual-server';
import {FollowUp} from '@/components/saas/FollowUp';
export const dynamic='force-dynamic';
export const metadata={title:'Atendimento — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 if(!await currentIdentity())notFound();const {id}=await params,db=await createClient();
 const result=await db.rpc('dna_get_follow_up',{p_participant:id});if(result.error||!result.data)notFound();
 const p=result.data as {id:string;name:string;status:string;notes:string|null;updatedAt:string;canUpdate:boolean;hasReport:boolean;history:{created_at:string;author:string;previous_status:string;status:string;notes_changed:boolean}[]};
 return <main className="max-w-2xl mx-auto p-5 space-y-6"><Link href="/equipe" className="underline">Voltar ao painel</Link><h1 className="text-3xl font-serif">Atendimento de {p.name}</h1>{p.hasReport?<nav className="flex flex-wrap gap-3"><Link className="rounded-full bg-amber-200 text-slate-950 px-5 py-3" href={'/equipe/avaliacoes/'+id+'/relatorios?tipo=vendedor'}>Ficha do vendedor · como conduzir a conversa</Link><Link className="rounded-full border px-5 py-3" href={'/equipe/avaliacoes/'+id+'/relatorios'}>Relatório individual e entrega</Link></nav>:<p>O relatório ficará disponível após a conclusão do DNA.</p>}<FollowUp key={p.updatedAt} {...p}/><section><h2 className="text-xl font-semibold">Histórico do atendimento</h2>{p.history.length===0?<p>Nenhuma alteração registrada.</p>:<ul className="divide-y">{p.history.map((h,i)=><li key={i} className="py-3"><p>{h.author} · {new Date(h.created_at).toLocaleString('pt-BR',{timeZone:'America/Cuiaba'})}</p><p>{h.previous_status} → {h.status}{h.notes_changed?' · Notas atualizadas':''}</p></li>)}</ul>}</section></main>;
}
