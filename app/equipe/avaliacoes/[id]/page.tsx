import Link from 'next/link';
import {notFound} from 'next/navigation';
import {evaluationFlags} from '@/lib/saas/flags';
import {loadPilotEvaluation} from '@/lib/saas/pilot-evaluation-server';
import {PilotEvaluation} from '@/components/saas/PilotEvaluation';
export const dynamic='force-dynamic';
export const metadata={title:'Avaliação piloto — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 if(!evaluationFlags(process.env).completion)notFound();
 const p=await loadPilotEvaluation((await params).id).catch(()=>null);if(!p)notFound();
 return <main className="min-h-screen bg-[#0B0E1A] text-white px-4 py-8"><div className="max-w-lg mx-auto mb-6"><h1 className="font-serif text-2xl">DNA da Profissão®</h1><p>{p.name}</p></div>{p.completed?<div className="max-w-lg mx-auto space-y-4"><p role="status">Avaliação concluída e resultado salvo.</p><Link className="underline" href={'/equipe/avaliacoes/'+p.participantId+'/relatorios'}>Ver relatórios</Link></div>:<PilotEvaluation participantId={p.participantId} revision={p.revision} questions={p.questions} initialAnswers={p.initialAnswers}/>}</main>;
}
