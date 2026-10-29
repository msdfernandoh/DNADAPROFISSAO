import {notFound} from 'next/navigation';
import {previewStoredEvaluation} from '@/lib/saas/report-preview-server';
import {ParticipantReportLink} from '@/components/saas/ParticipantReportLink';
import {EditorialDocument} from '@/components/questionnaire-report/EditorialDocument';
import {EditableMessage} from '@/components/questionnaire-report/EditorialReviewTools';
export const dynamic='force-dynamic';
export const metadata={title:'Revisão dos relatórios — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const reports=await previewStoredEvaluation((await params).id).catch(()=>null);if(!reports)notFound();
 if(reports.published)return <main className="space-y-8 pb-10"><div className="max-w-6xl mx-auto p-5 space-y-4 print:hidden"><h1 className="font-serif text-3xl">Relatórios da avaliação</h1><p>O relatório individual abaixo é o mesmo entregue ao participante. A ficha comercial é exclusiva da equipe autorizada.</p><ParticipantReportLink id={(await params).id}/><a className="underline text-amber-200" href="#ficha-comercial">Ir à ficha comercial</a></div><EditorialDocument name={reports.participant.name} forces={reports.participant.profiles.distribution} sections={reports.participant.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/><section id="ficha-comercial"><EditorialDocument commercial name={reports.participant.name} forces={[]} sections={reports.commercial.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/><div className="max-w-3xl mx-auto p-5 print:hidden"><EditableMessage text={reports.commercial.whatsapp}/></div></section></main>;
 return <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
  <h1 className="font-serif text-3xl">Relatórios da avaliação</h1>
  {reports.status==='approved'&&<ParticipantReportLink id={(await params).id}/>}
  <aside className="rounded-xl bg-amber-100 p-4">{reports.status==='approved'?'Versão aprovada. O relatório comercial é exclusivo da equipe autorizada.':'Prévia privada para revisão. Os textos aguardam aprovação para entrega ao participante.'}</aside>
  {[{title:'Relatório do participante',report:reports.participant},{title:'Relatório comercial — exclusivo da equipe',report:reports.commercial}].map(({title,report})=><article key={title} className="space-y-5"><h2 className="font-serif text-2xl">{title}</h2>{report.sections.map(section=><section key={section.number} className="border-t pt-4"><h3 className="font-semibold text-lg">{section.number}. {section.title}</h3>{section.paragraphs.map((paragraph,i)=><p key={i} className="mt-2 leading-relaxed">{paragraph}</p>)}</section>)}</article>)}
 </main>;
}
