"use client"
import {useState} from 'react';
import {QuizV2} from '@/components/questionnaire-public/QuizV2';
import {submitPilotAnswers} from '@/lib/saas/pilot-evaluation-client';
import type {PublicQuestion} from '@/lib/questionnaire-platform/public-funnel';
export function PilotEvaluation({participantId,revision,questions}:{participantId:string;revision:string;questions:PublicQuestion[]}){
 const [done,setDone]=useState(false);
 if(done)return <p role="status">Avaliação concluída e resultado salvo. A disponibilização do relatório depende de autorização da equipe.</p>;
 return <QuizV2 participantId={participantId} questions={questions} submitAnswers={answers=>submitPilotAnswers(participantId,revision,answers)} onDone={()=>setDone(true)}/>;
}
