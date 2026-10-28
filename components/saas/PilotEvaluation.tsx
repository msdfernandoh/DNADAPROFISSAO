"use client"
import {useState} from 'react';
import Link from 'next/link';
import {QuizV2} from '@/components/questionnaire-public/QuizV2';
import {submitPilotAnswers} from '@/lib/saas/pilot-evaluation-client';
import type {PublicQuestion} from '@/lib/questionnaire-platform/public-funnel';
export function PilotEvaluation({participantId,revision,questions,initialAnswers={}}:{participantId:string;revision:string;questions:PublicQuestion[];initialAnswers?:Record<string,string>}){
 const [done,setDone]=useState(false);
 if(done)return <div className="max-w-lg mx-auto space-y-4"><p role="status">Avaliação concluída e resultado salvo.</p><Link className="underline" href={'/equipe/avaliacoes/'+participantId+'/relatorios'}>Ver relatórios</Link><p><Link className="underline" href="/equipe">Voltar ao painel</Link></p></div>;
 return <QuizV2 participantId={participantId} questions={questions} initialAnswers={initialAnswers} saveDraft={async answers=>{
  const response=await fetch('/api/v1/evaluations/'+participantId+'/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,answers})});
  const result=await response.json();if(!response.ok||result.saved!==true)throw Error('Draft unavailable');
 }} submitAnswers={answers=>submitPilotAnswers(participantId,revision,answers)} onDone={()=>setDone(true)}/>;
}
