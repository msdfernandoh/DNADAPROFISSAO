import {notFound} from 'next/navigation';
import {participantReportByToken} from '@/lib/saas/participant-report-server';
import {ProfessionalMarketSources} from '@/components/questionnaire-report/ProfessionalMarketSources';
import {EditorialDocument} from '@/components/questionnaire-report/EditorialDocument';
export const dynamic='force-dynamic';
export const metadata={title:'Seu DNA da Profissão',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{token:string}>}){
 const report=await participantReportByToken((await params).token).catch(()=>null);if(!report)notFound();
 return <main className="min-h-screen"><EditorialDocument name={report.name} forces={report.profiles.distribution} sections={report.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/>
 <section className="max-w-3xl mx-auto p-6 bg-white text-slate-900"><h2 className="text-xl font-semibold mb-4">Pesquise o mercado profissional</h2><ProfessionalMarketSources/></section>
 </main>;
}
