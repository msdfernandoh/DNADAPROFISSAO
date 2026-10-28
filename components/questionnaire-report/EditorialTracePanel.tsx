import type {restoreHumanized} from '@/lib/questionnaire-engine/individual/editorial/restore-humanized';

/** Only rendered inside the administrator-only review route, outside the reading document. */
export function EditorialTracePanel({report}:{report:ReturnType<typeof restoreHumanized>}){
 return <aside className="max-w-6xl mx-auto px-5 py-8 print:hidden" data-editorial-audit>
  <details className="border border-slate-600 rounded-xl p-5"><summary className="cursor-pointer font-semibold">Painel técnico da revisão — abrir ou ocultar</summary>
   <p className="text-sm mt-4">Reservado à administração. Alternativas literais são respostas selecionadas em cenários fictícios, não definições da pessoa. A leitura acima usa uma interpretação separada.</p>
   <p className="text-sm mt-3">Versão: {report.version}. Situação: aguardando homologação da Carla. Os novos textos não herdam a aprovação anterior.</p>
   <p className="text-sm mt-3">Cena original compatível com as condições: {report.audit.originalSceneSupported?'sim':'não; usada cena das escolhas efetivas'}. Hash das fontes: {report.sourceHash}.</p>
   <details className="mt-5"><summary>Alternativas selecionadas — transcrição literal para auditoria</summary>{report.evidence.map(e=><p className="text-sm mt-4" key={e.id}><b>{e.questionId} · alternativa {e.letter} · {e.scenario}:</b> {e.selectedText}</p>)}</details>
   {[['Participante',report.participant],['Comercial',report.commercial]] .map(([audience,sections])=><details className="mt-5" key={String(audience)}><summary>Rastreabilidade: {String(audience)}</summary>{(sections as typeof report.participant).map(s=><section className="mt-4" key={s.number}><h3>{s.number}. {s.title}</h3>{s.paragraphs.map((p,i)=><p className="text-xs mt-2 break-words" key={i}>Bloco {i+1} · {p.origin} · {p.source} · {p.evidenceRefs.join(', ')||'Informação declarada ou orientação de processo'}</p>)}</section>)}</details>)}
   <details className="mt-5"><summary>Fontes preservadas e camadas do motor</summary><pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify({missingSources:report.missingSources,classification:report.classification,conditions:report.audit.sceneConditions,analysis:report.audit.thirdLayer,originalParticipant:report.audit.originalParticipant,originalCommercial:report.audit.originalCommercial},null,2)}</pre></details>
  </details>
 </aside>;
}
