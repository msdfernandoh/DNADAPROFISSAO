'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Registration} from '@/components/dna/registration';
import {QuizV2} from '@/components/questionnaire-public/QuizV2';
import type {PublicQuestion} from '@/lib/questionnaire-platform/public-funnel';
type Answer={questionId:string;alternativeId:string};
const storageKey='dna-official-public-evaluation';
export function PublicDnaJourney(){
 const [config,setConfig]=useState<{revision:string;questions:PublicQuestion[]}|null>(null),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[id,setId]=useState<string|null>(null),[initial,setInitial]=useState<Record<string,string>>({});
 useEffect(()=>{let active=true;(async()=>{try{
  const r=await fetch('/api/dna',{cache:'no-store'}),data=await r.json();if(!r.ok||data.questions?.length!==15)throw Error(data.error||'Não foi possível carregar as 15 situações.');if(!active)return;setConfig(data);
  let saved:string|null=null;try{saved=sessionStorage.getItem(storageKey);}catch{}
  if(saved){const resume=await fetch('/api/dna/'+encodeURIComponent(saved),{cache:'no-store'});if(resume.ok){const state=await resume.json();if(state.completed){window.location.assign(state.url);return;}if(active){setId(state.id);setInitial(Object.fromEntries((state.answers as Answer[]).map(a=>[a.questionId,a.alternativeId])));}}else try{sessionStorage.removeItem(storageKey);}catch{}}
 }catch(e){if(active)setError(e instanceof Error?e.message:'Não foi possível conectar.');}finally{if(active)setLoaded(true);}})();return()=>{active=false;};},[]);
 if(!loaded)return <main className="max-w-xl mx-auto px-5 py-12"><p role="status">Carregando seu DNA da Profissão…</p></main>;
 if(!config)return <main className="max-w-xl mx-auto p-8 space-y-5"><h1 className="text-3xl font-serif">DNA da Profissão®</h1><p role="alert">{error}</p><button className="underline" onClick={()=>window.location.reload()}>Tentar novamente</button><p><Link href="/">Voltar ao início</Link></p></main>;
 const post=async(path:string,body:unknown)=>{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível salvar. Tente novamente.');return data;};
 return <main data-dna-version={config.revision}><header className="max-w-3xl mx-auto px-5 pt-7 pb-2 flex flex-wrap justify-between gap-4"><Link href="/" className="text-amber-200 underline">DNA DA PROFISSÃO®</Link><span className="text-sm text-slate-300">15 situações do cotidiano</span></header>
 {!id?<Registration settingsLoaded dnaRapidoEnabled={false} onComplete={async form=>{
  const interest=form.course.trim();const r=await post('/api/dna',{name:form.name,phone:form.phone,email:form.email,city:form.city||null,escolaridade:form.escolaridade||null,course_interest:interest||null,orientationMode:interest?'declared_interest':'undefined_interest',declaredArea:null,objective:null,priorCourse:null});
  if(typeof r.id!=='string'||!/^[-a-f0-9]{36}$/i.test(r.id))throw Error('O cadastro não foi confirmado. Tente novamente.');
  try{sessionStorage.setItem(storageKey,r.id);}catch{}setInitial({});setId(r.id);
 }}/>:<QuizV2 participantId={id} questions={config.questions} initialAnswers={initial} saveDraft={async answers=>{const r=await post('/api/dna/'+id+'/draft',{revision:config.revision,answers});if(r.saved!==true)throw Error('Respostas não confirmadas.');}} submitAnswers={async answers=>{const r=await post('/api/dna/'+id+'/complete',{revision:config.revision,answers});if(r.state==='committed'&&r.url==='/meu-dna/'+id){window.location.assign(r.url);return {state:'committed'};}if(r.state==='no_credit'&&r.answersSaved===true)return {state:'no_credit'};throw Error('A conclusão não foi confirmada.');}} onDone={()=>{}}/>}
 </main>;
}
