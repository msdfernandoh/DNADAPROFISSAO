import {notFound} from 'next/navigation';
import {ownsParticipant} from '@/lib/security/participant-session';
import {ownResultTeaser} from '@/lib/saas/result-teaser-server';
import {ResultTeaser} from '@/components/questionnaire-report/ResultTeaser';
export const dynamic='force-dynamic';
export const metadata={title:'Seu DNA da Profissão',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id)||!await ownsParticipant(id,'v2'))notFound();
 const report=await ownResultTeaser(id).catch(()=>null);if(!report)notFound();
 return <ResultTeaser {...report}/>;
}
