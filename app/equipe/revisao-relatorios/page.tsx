import {composePublishedEditorial} from '@/lib/saas/published-editorial';
import {composeIntegratedHumanized} from '@/lib/questionnaire-engine/individual/editorial/integrated-humanized';
import {EditorialTracePanel} from '@/components/questionnaire-report/EditorialTracePanel';
import {RestoredProfiles,RestoredPairs} from '@/components/questionnaire-report/RestoredCatalog';
import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {currentIdentity} from '@/lib/saas/server';
import {v1Flags} from '@/lib/saas/flags';
import {buildRestoredReview,restoredReviewNames} from '@/lib/questionnaire-engine/integration/restored-review-cases';
import {restoreHumanized,restoredProfiles,restoredPairs} from '@/lib/questionnaire-engine/individual/editorial/restore-humanized';
import {profileDisplaySummary} from '@/lib/questionnaire-engine/integration/profile-summary';
import {EditorialDocument} from '@/components/questionnaire-report/EditorialDocument';
import {EditableMessage,PrintReport} from '@/components/questionnaire-report/EditorialReviewTools';
export const dynamic='force-dynamic';
export const metadata={title:'Ateliê dos relatórios — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!v1Flags(process.env).internalPreview)notFound();
 const identity=await currentIdentity();if(!identity)redirect('/equipe/acesso');
 if(!identity.globalOwner&&!identity.memberships.some(m=>m.role_code==='institution_admin'))notFound();
 const params=await searchParams,view=typeof params.view==='string'?params.view:'participante',name=typeof params.case==='string'?params.case:'Ana';
 const pairList=restoredPairs();if(!restoredReviewNames.includes(name as typeof restoredReviewNames[number])&&!pairList.some(p=>p.code===name))notFound();
 const {journey:j,careerPreference}=buildRestoredReview(name),old=restoreHumanized(j,careerPreference),integrated=composeIntegratedHumanized(j),publication=composePublishedEditorial(j),forces=profileDisplaySummary(j.analysis).distribution;
 const blocks=(sections:typeof publication.participant,audience:'participant'|'commercial')=>sections.map(s=>({...s,paragraphs:s.paragraphs.map((text,i)=>integrated[audience][s.number-1].paragraphs[i]?.text===text?integrated[audience][s.number-1].paragraphs[i]:{text,origin:'adapted_awaiting_carla' as const,source:'Composição publicada e catálogo declarado',evidenceRefs:[]})}));
 const report={...old,version:publication.version,participant:blocks(publication.participant,'participant'),commercial:blocks(publication.commercial,'commercial'),whatsapp:publication.whatsapp};
 return <main className="min-h-screen bg-[#0b0e1a] pb-12"><div className="max-w-6xl mx-auto px-5 py-8 space-y-6 print:hidden"><Link href="/equipe" className="underline text-amber-200">Voltar à equipe</Link><p className="uppercase text-xs tracking-[.25em] text-amber-200">DNA DA PROFISSÃO® · ATELIÊ EDITORIAL</p><h1 className="font-serif text-4xl">Uma conversa que merece ser lida.</h1><p className="max-w-3xl leading-relaxed">Textos originais recuperados, adaptações rastreáveis e novos trechos identificados. Exemplos fictícios do motor real, sem cadastro ou crédito. A leitura usa a mesma composição da edição atual. O painel técnico mantém as fontes para comparação.</p><nav className="flex flex-wrap gap-2" aria-label="Exemplos fictícios">{restoredReviewNames.map(n=><Link key={n} href={'?case='+encodeURIComponent(n)+'&view='+view} className={'border rounded-full px-4 py-2 text-sm '+(n===name?'border-amber-300 text-amber-200':'border-slate-600')}>{n}</Link>)}</nav><nav className="flex flex-wrap gap-4 border-b border-slate-700 pb-5" aria-label="Áreas de revisão">{[['participante','Participante'],['comercial','Ficha comercial'],['perfis','Cinco perfis'],['pares','Vinte combinações'],['origens','Fontes e personalização']].map(([id,label])=><Link key={id} className={view===id?'text-amber-200 underline':'underline'} href={'?case='+encodeURIComponent(name)+'&view='+id}>{label}</Link>)}<PrintReport/></nav></div>
 {(view==='participante'||view==='comercial')&&<><div className="max-w-6xl mx-auto px-5 pb-6 text-sm text-slate-300 print:hidden">Exemplo {name} · {j.analysis.classification.pair||'Empate preservado; nenhum par foi escolhido artificialmente.'} · versão {report.version}</div><EditorialDocument name={j.registration.name} sections={view==='comercial'?report.commercial:report.participant} forces={forces} commercial={view==='comercial'}/><EditorialTracePanel report={report}/>{view==='comercial'&&<div className="max-w-3xl mx-auto px-5 py-8"><EditableMessage key={name} text={report.whatsapp}/></div>}</>}
 {view==='perfis'&&<RestoredProfiles/>}
 {view==='pares'&&<RestoredPairs/>}
 {view==='origens'&&<div className="max-w-5xl mx-auto px-5 space-y-6"><h2 className="font-serif text-3xl">O que foi recuperado e o que mudou</h2><p>Recuperadas em transcrições locais: as referências dos documentos 02 e 03, os 20 textos do Anexo B e o exemplo Ana. Os arquivos integrais citados não foram encontrados nesta auditoria. Perfis preexistentes: lib/dna-data.ts. O histórico Git foi consultado para preservar as versões anteriores.</p><p>Não localizados: {report.missingSources.join(' e ')}. Não se afirma que as analogias desses PDFs foram recuperadas.</p><p>As origens e alternativas literais estão no painel técnico separado da leitura. Perguntas, pesos, cálculo, créditos, banco e snapshots permanecem como estavam.</p><p>Casos “Mesmos pontos A” e “Mesmos pontos B” permitem comparar respostas diferentes com pontuação igual. Ana, Beatriz e Camila variam a motivação na parte 6. Carreira pública é informação declarada do exemplo; não foi inferida do perfil.</p><details><summary>Referências das respostas do exemplo</summary><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(report.evidence,null,2)}</pre></details></div>}
 </main>;
}
