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
 let evaluations:{id:string;name:string;quiz_completed:boolean;updated_at:string}[]=[],listFailed=false;
 if(enabled){const db=await createClient();const result=await db.rpc('dna_list_evaluations',{p_institution:identity.institutionIds[0]});listFailed=!!result.error;if(!result.error&&Array.isArray(result.data))evaluations=result.data;}
 return <main className="max-w-4xl mx-auto px-4 py-8 space-y-6"><h1 className="font-serif text-3xl">Olá, {identity.displayName}</h1><p>Seu acesso individual foi confirmado.</p><p>{identity.globalOwner?'Proprietário da plataforma':identity.institutionIds.length+' instituição(ões) autorizada(s)'}</p>
 {enabled&&<section className="space-y-4"><h2 className="text-2xl font-serif">Participantes e avaliações</h2>
 {identity.grants.some(g=>g.resource==='lead'&&g.action==='create'&&g.allowed)&&<Link className="inline-block rounded-full bg-[#2D1F5E] text-white px-5 py-3" href="/equipe/avaliacoes/nova">Cadastrar participante</Link>}
 {listFailed?<p role="alert">Não foi possível consultar as avaliações. Tente novamente.</p>:evaluations.length===0?<p>Nenhuma avaliação disponível no seu escopo.</p>:<ul className="divide-y">{evaluations.map(p=><li key={p.id} className="py-4 flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{p.name}</p><p>{p.quiz_completed?'Concluída':'Em andamento'}</p></div><div className="flex gap-4"><Link className="underline" href={'/equipe/avaliacoes/'+p.id}>{p.quiz_completed?'Ver conclusão':'Continuar avaliação'}</Link>{p.quiz_completed&&flags.internalPreview&&<Link className="underline" href={'/equipe/avaliacoes/'+p.id+'/relatorios'}>Relatórios</Link>}</div></li>)}</ul>}
 </section>}
 {identity.globalOwner&&flags.internalPreview&&<Link className="underline" href="/admin/integracao-v1">Revisão interna dos relatórios</Link>}<IndividualSignOut/></main>;
}
