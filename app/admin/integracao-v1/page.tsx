import { notFound,redirect } from 'next/navigation';
import Link from 'next/link';
import { v1Flags } from '@/lib/saas/flags';
import { currentIdentity } from '@/lib/saas/server';
import { canReviewDrafts } from '@/lib/saas/identity';
export const dynamic='force-dynamic';
export const metadata={title:'Revisão interna — DNA da Profissão',robots:{index:false,follow:false}};
export default async function ReviewPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const flags=v1Flags(process.env);if(!flags.individualAccess||!flags.internalPreview)notFound();
 const identity=await currentIdentity();if(!identity)redirect('/equipe/acesso');if(!canReviewDrafts(identity))notFound();
 const {buildReviewCase,reviewCaseNames}=await import('@/lib/questionnaire-engine/integration/review-cases');
 const {participantDraftPreview,commercialReport}=await import('@/lib/questionnaire-engine/integration/journey');
 const params=await searchParams;const name=typeof params.case==='string'?params.case:'Ana';if(!reviewCaseNames.some(n=>n===name))notFound();
 const j=buildReviewCase(name),actor={id:identity!.userId,active:true,role:'platform_owner' as const,explicitGlobalOwner:true,institutionIds:[],unitIds:[]};
 const participant=participantDraftPreview(j,actor),commercial=commercialReport(j,actor);
 return <main className="max-w-5xl mx-auto p-6 space-y-8"><h1 className="font-serif text-3xl">Revisão interna de conteúdo</h1><p className="border border-yellow-600 rounded p-4">Somente exemplos fictícios. Textos e associações aguardam homologação; nenhuma oferta ou cobrança é habilitada.</p><nav className="flex flex-wrap gap-4">{reviewCaseNames.map(n=><Link key={n} className="underline" href={'?case='+encodeURIComponent(n)}>{n}</Link>)}</nav><p>Seções sem conteúdo suficiente: {j.readiness.missingSections.join(', ')||'nenhuma neste exemplo'}.</p><h2 className="text-2xl">Visão do participante — {participant.name}</h2>{participant.sections.map(s=><section key={s.number} className="border rounded p-6"><h3 className="font-serif text-xl mb-4">{s.number}. {s.title}</h3>{s.paragraphs.map((p,i)=><p key={i} className="mb-4">{p}</p>)}</section>)}<details className="border rounded p-6"><summary>Ficha comercial exclusiva da revisão autorizada</summary>{commercial.sections.map(s=><section key={s.number} className="py-4"><h3 className="font-bold">{s.title}</h3>{s.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</section>)}</details><details><summary>Evidências e lacunas internas</summary><pre className="whitespace-pre-wrap text-xs">{JSON.stringify({evidence:commercial.evidence,readiness:j.readiness},null,2)}</pre></details></main>;
}
