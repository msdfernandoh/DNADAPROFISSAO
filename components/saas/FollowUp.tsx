'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {STATUS_OPTS} from '@/lib/dna-data';
export function FollowUp({id,status,notes,updatedAt,canUpdate}:{id:string;status:string;notes:string|null;updatedAt:string;canUpdate:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[selectedStatus,setSelectedStatus]=useState(status);const router=useRouter();
 return <form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();if(busy)return;const data=new FormData(e.currentTarget);setBusy(true);setMessage('');
  try{const r=await fetch('/api/v1/evaluations/'+id+'/follow-up',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:data.get('status'),notes:data.get('notes'),updatedAt})}),result=await r.json();if(!r.ok||!result.saved)throw Error(result.error||'Falha ao salvar');setMessage('Atendimento salvo.');router.refresh();}catch(err){setMessage(err instanceof Error?err.message:'Falha ao salvar');}finally{setBusy(false);}
 }}><fieldset disabled={busy||!canUpdate} className="space-y-4"><div><p className="mb-3">Situação do atendimento</p><input type="hidden" name="status" value={selectedStatus}/><div className="flex flex-wrap gap-2">{STATUS_OPTS.map(s=><button key={s} type="button" aria-pressed={selectedStatus===s} onClick={()=>setSelectedStatus(s)} className="rounded-full border px-4 py-3 min-h-12" style={{background:selectedStatus===s?'#d8bd70':'#182236',color:selectedStatus===s?'#101728':'#f5f7ff',borderColor:selectedStatus===s?'#d8bd70':'#8391ac'}}>{selectedStatus===s?'✓ ':''}{s}</button>)}</div></div><label className="block">Notas do atendimento<textarea name="notes" defaultValue={notes||''} maxLength={5000} rows={6} className="block w-full p-3 rounded border bg-slate-900 text-white"/></label>{canUpdate&&<button className="rounded-full bg-purple-900 text-white px-6 py-3" type="submit">{busy?'Salvando…':'Salvar atendimento'}</button>}</fieldset>{message&&<p role="status">{message}</p>}</form>;
}
