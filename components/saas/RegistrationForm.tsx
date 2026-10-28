'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {ESCOLARIDADE_OPTIONS} from '@/lib/dna-data';
export function RegistrationForm(){
 const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="space-y-5" onSubmit={async event=>{
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  const data=new FormData(event.currentTarget),registration=Object.fromEntries(data);
  try{
   const response=await fetch('/api/v1/evaluations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(registration)}),result=await response.json();
   if(!response.ok||typeof result.id!=='string')throw Error(result.error||'Não foi possível cadastrar.');
   router.push('/equipe/avaliacoes/'+result.id);
  }catch(err){setError(err instanceof Error?err.message:'Não foi possível cadastrar.');setBusy(false);}
 }}>
  <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
   {[['name','Nome completo','text'],['phone','Telefone com DDD','tel'],['email','E-mail','email'],['city','Cidade onde deseja trabalhar','text']].map(([name,label,type])=><label key={name} className="block"><span className="block mb-1">{label}</span><input name={name} type={type} required={name!=='city'} maxLength={250} className="w-full rounded-lg border p-3"/></label>)}
   <label className="block">Escolaridade<select name="escolaridade" className="block w-full rounded-lg border p-3"><option value="">Prefiro informar depois</option>{ESCOLARIDADE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
   <label className="block">Como deseja explorar possibilidades?<select name="orientationMode" defaultValue="undefined_interest" className="block w-full rounded-lg border p-3"><option value="undefined_interest">Ainda não defini um interesse</option><option value="declared_interest">Tenho interesse em um curso ou atividade</option><option value="area_undecided">Quero explorar uma área</option></select></label>
   {[['course_interest','Curso ou atividade de interesse, se houver'],['declaredArea','Área que deseja explorar, se houver'],['objective','O que gostaria de descobrir com o DNA?'],['priorCourse','Formação anterior, se houver']].map(([name,label])=><label key={name} className="block">{label}<input name={name} maxLength={500} className="block w-full rounded-lg border p-3"/></label>)}
   <p className="text-sm text-slate-600">O cadastro inicia uma avaliação e não consome créditos. As respostas são salvas ao avançar entre as perguntas.</p>
   <button className="w-full rounded-full bg-[#2D1F5E] p-3 text-white font-semibold" type="submit">{busy?'Cadastrando…':'Cadastrar e iniciar o DNA'}</button>
  </fieldset>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
 </form>;
}
