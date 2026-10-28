'use client';
import {useState} from 'react';
export function PrintReport(){return <button type="button" onClick={()=>window.print()} className="border border-amber-500 rounded-full px-5 py-2 text-sm">Imprimir / salvar PDF</button>;}
export function EditableMessage({text}:{text:string}){
 const [value,setValue]=useState(text),[copied,setCopied]=useState(false);
 return <div className="space-y-3"><label htmlFor="review-whatsapp" className="block">Mensagem inicial editável</label><textarea id="review-whatsapp" value={value} onChange={e=>{setValue(e.target.value);setCopied(false);}} rows={5} className="block w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white"/><button type="button" className="border rounded-full px-5 py-2" onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);}catch{setCopied(false);}}}>Copiar mensagem</button><p role="status" className="text-sm">{copied?'Copiada. Nenhuma mensagem foi enviada.':'Editar ou copiar não envia mensagens nem registra leitura.'}</p></div>;
}
