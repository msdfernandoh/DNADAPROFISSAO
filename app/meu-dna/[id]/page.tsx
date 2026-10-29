import {notFound} from 'next/navigation';
import {ownsParticipant} from '@/lib/security/participant-session';
import {storedParticipantReport} from '@/lib/saas/participant-report-server';
import {EditorialDocument} from '@/components/questionnaire-report/EditorialDocument';
import {PrintReport} from '@/components/questionnaire-report/EditorialReviewTools';
export const dynamic='force-dynamic';
export const metadata={title:'Seu DNA da Profissão',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id)||!await ownsParticipant(id,'v2'))notFound();
 const report=await storedParticipantReport(id).catch(()=>null);if(!report)notFound();
 return <main><div className="max-w-6xl mx-auto p-5 space-y-3 print:hidden"><p>Seu resultado foi salvo. Você pode voltar a esta página neste navegador.</p><PrintReport/></div><EditorialDocument name={report.name} forces={report.profiles.distribution} sections={report.sections.map(s=>({...s,paragraphs:s.paragraphs.map(text=>({text}))}))}/></main>;
}
