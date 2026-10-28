import {notFound} from 'next/navigation';
import {participantReportByToken} from '@/lib/saas/participant-report-server';
import {ProfessionalMarketSources} from '@/components/questionnaire-report/ProfessionalMarketSources';
export const dynamic='force-dynamic';
export const metadata={title:'Seu DNA da Profissão',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{token:string}>}){
 const report=await participantReportByToken((await params).token).catch(()=>null);if(!report)notFound();
 return <main className="max-w-3xl mx-auto p-5 md:p-10 space-y-6 bg-white text-slate-900 min-h-screen"><h1 className="font-serif text-3xl">{report.name}, conheça seu DNA</h1>
 <p>Este relatório apoia sua reflexão profissional. Não é diagnóstico psicológico nem promessa de aptidão, salário ou emprego.</p>
 <section className="rounded-xl bg-slate-100 p-5"><h2 className="text-xl font-semibold">Suas forças nas respostas</h2>{report.profiles.distribution.map(p=><p key={p.code}>{p.name}: {p.points} pontos</p>)}<p className="mt-3">Os pontos representam as respostas desta avaliação; não são percentuais de compatibilidade com profissões.</p></section>
 {report.sections.map(s=><section key={s.number} className="border-t pt-5"><h2 className="text-xl font-semibold">{s.number}. {s.title}</h2>{s.paragraphs.map((p,i)=><p key={i} className="mt-3 leading-relaxed">{p}</p>)}</section>)}
 <section className="border-t pt-5"><h2 className="text-xl font-semibold mb-4">Pesquise o mercado profissional</h2><ProfessionalMarketSources/></section>
 </main>;
}
