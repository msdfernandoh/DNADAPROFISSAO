'use client';
import {useState} from 'react';
export function ParticipantReportLink({id}:{id:string}){
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <div className="space-y-3"><button disabled={busy} className="rounded-full bg-purple-900 text-white px-5 py-3" onClick={async()=>{setBusy(true);setError('');try{const r=await fetch('/api/v1/evaluations/'+id+'/report-link',{method:'POST'}),d=await r.json();if(!r.ok||typeof d.url!=='string')throw Error();setUrl(d.url);}catch{setError('Não foi possível criar o link.');}finally{setBusy(false);}}}>Criar link privado do relatório individual</button>{url&&<div><a href={url} className="underline" target="_blank" rel="noreferrer">Abrir relatório do participante</a><p className="text-sm">Link privado válido por 30 dias. Compartilhe somente com o participante.</p><input aria-label="Link privado do participante" readOnly value={url} className="w-full border rounded p-2" onFocus={e=>e.target.select()}/></div>}{error&&<p role="alert">{error}</p>}</div>;
}
