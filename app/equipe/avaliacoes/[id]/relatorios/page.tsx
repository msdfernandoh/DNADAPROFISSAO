import Link from 'next/link';
import {notFound} from 'next/navigation';
import {previewStoredEvaluation} from '@/lib/saas/report-preview-server';
import {ParticipantReportLink} from '@/components/saas/ParticipantReportLink';
import {EditorialDocument} from '@/components/questionnaire-report/EditorialDocument';
import {EditableMessage} from '@/components/questionnaire-report/EditorialReviewTools';
export const dynamic='force-dynamic';
export const metadata={title:'Relatórios da avaliação — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tipo?:string}>}){
 const {id}=await params,reports=await previewStoredEvaluation(id).catch(()=>null);if(!reports)notFound();
 const seller=(await searchParams).tipo==='vendedor';
 const choices=<nav className="flex flex-wrap gap-3" aria-label="Escolher relatório"><Link aria-current={!seller?'page':undefined} className="rounded-full border px-5 py-3" href={'/equipe/avaliacoes/'+id+'/relatorios'}>Relatório individual</Link><Link aria-current={seller?'page':undefined} className="rounded-full bg-amber-200 text-slate-950 px-5 py-3" href={'/equipe/avaliacoes/'+id+'/relatorios?tipo=vendedor'}>Ficha do vendedor</Link></nav>;
 if(reports.published)return <main className="space-y-8 pb-10"><div className="max-w-6xl mx-auto p-5 space-y-4 print:hidden"><Link className="underline" href={'/equipe/avaliacoes/'+id+'/atendimento'}>← Voltar ao atendimento</Link><h1 className="font-serif text-3xl">{seller?'Ficha do vendedor · orientação para a conversa':'Relatório individual · entrega ao participante'}</h1>{choices}{seller?<p>Uso exclusivo da equipe autorizada. Confirme a leitura antes de iniciar a conversa sobre o resultado.</p>:<ParticipantReportLink id={id}/>}</div>{seller?<section id="ficha-comercial"><EditorialDocument commercial name={reports.participant.name} forces={[]} sections={reports.commercial.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/><div className="max-w-3xl mx-auto p-5 print:hidden"><EditableMessage text={reports.commercial.whatsapp}/></div></section>:<EditorialDocument name={reports.participant.name} forces={reports.participant.profiles.distribution} sections={reports.participant.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/>}</main>;
 const report=seller?reports.commercial:reports.participant;
 return <main className="max-w-3xl mx-auto px-4 py-8 space-y-8"><h1 className="font-serif text-2xl">{seller?'Ficha do vendedor':'Relatório individual'}</h1>{choices}{!seller&&reports.status==='approved'&&<ParticipantReportLink id={id}/>}<p>{reports.status==='approved'?'Versão aprovada.':'Prévia privada para revisão.'}</p>{report.sections.map(s=><section key={s.number} className="border-t pt-5"><h2 className="text-xl">{s.title}</h2>{s.paragraphs.map((p,i)=><p className="mt-3 leading-relaxed" key={i}>{p}</p>)}</section>)}</main>;
}
