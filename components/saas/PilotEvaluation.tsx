"use client"
import {useState} from 'react';
import {QuizV2} from '@/components/questionnaire-public/QuizV2';
import {submitPilotAnswers} from '@/lib/saas/pilot-evaluation-client';
import type {PublicQuestion} from '@/lib/questionnaire-platform/public-funnel';
export function PilotEvaluation({participantId,revision,questions,initialAnswers={}}:{participantId:string;revision:string;questions:PublicQuestion[];initialAnswers?:Record<string,string>}){
 const [done,setDone]=useState(false);
 if(done)return <p role="status">Avaliação concluída e resultado salvo. A disponibilização do relatório depende de autorização da equipe.</p>;
 return <QuizV2 participantId={participantId} questions={questions} initialAnswers={initialAnswers} saveDraft={async answers=>{
  const response=await fetch('/api/v1/evaluations/'+participantId+'/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,answers})});
  const result=await response.json();if(!response.ok||result.saved!==true)throw Error('Draft unavailable');
 }} submitAnswers={answers=>submitPilotAnswers(participantId,revision,answers)} onDone={()=>setDone(true)}/>;
}
