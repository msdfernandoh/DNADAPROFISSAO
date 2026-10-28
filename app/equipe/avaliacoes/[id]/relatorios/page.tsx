import {notFound} from 'next/navigation';
import {previewStoredEvaluation} from '@/lib/saas/report-preview-server';
export const dynamic='force-dynamic';
export const metadata={title:'Revisão dos relatórios — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const reports=await previewStoredEvaluation((await params).id).catch(()=>null);if(!reports)notFound();
 return <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
  <h1 className="font-serif text-3xl">Relatórios da avaliação</h1>
  <aside className="rounded-xl bg-amber-100 p-4">Prévia privada para revisão. Os textos aguardam aprovação para entrega ao participante.</aside>
  {[{title:'Relatório do participante',report:reports.participant},{title:'Relatório comercial — exclusivo da equipe',report:reports.commercial}].map(({title,report})=><article key={title} className="space-y-5"><h2 className="font-serif text-2xl">{title}</h2>{report.sections.map(section=><section key={section.number} className="border-t pt-4"><h3 className="font-semibold text-lg">{section.number}. {section.title}</h3>{section.paragraphs.map((paragraph,i)=><p key={i} className="mt-2 leading-relaxed">{paragraph}</p>)}</section>)}</article>)}
 </main>;
}
