'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
export function RecoveryAccess({mode}:{mode:'request'|'confirm'|'password'}){
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);const token=useRef('');
 useEffect(()=>{if(mode==='confirm'){token.current=new URLSearchParams(window.location.hash.slice(1)).get('token_hash')||'';window.history.replaceState(null,'','/equipe/recuperar/confirmar');}},[mode]);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy)return;const data=new FormData(event.currentTarget);setBusy(true);setMessage('');
 const url=mode==='request'?'/api/v1/identity/recovery':mode==='confirm'?'/api/v1/identity/recovery/confirm':'/api/v1/identity/password';
 const body=mode==='request'?{email:data.get('email')}:mode==='confirm'?{tokenHash:token.current}:{password:data.get('password')};
 try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){setMessage(r.status===429?'Aguarde antes de tentar novamente.':'Não foi possível continuar. Solicite um novo link ou tente novamente.');return;}
 if(mode==='confirm'){token.current='';window.location.assign('/equipe/recuperar/senha');}else if(mode==='password'){window.location.assign('/equipe/acesso');}else{setMessage('Se houver uma conta elegível, você receberá as instruções.');}
 }catch{setMessage('Não foi possível conectar. Tente novamente.');}finally{setBusy(false);}}
 return <form onSubmit={submit} className="max-w-md mx-auto flex flex-col gap-5 p-8"><h1 className="text-2xl">{mode==='password'?'Defina sua nova senha':'Recuperar acesso'}</h1>{mode==='request'&&<label>E-mail<input name="email" type="email" required autoComplete="username" className="block p-3 rounded text-black w-full"/></label>}{mode==='password'&&<label>Nova senha (12 a 128 caracteres)<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="block p-3 rounded text-black w-full"/></label>}{mode==='confirm'&&<p>Continue para validar o link de recuperação e definir sua nova senha.</p>}{message&&<p role="status">{message}</p>}<button disabled={busy} className="border rounded p-3">{busy?'Aguarde...':mode==='request'?'Enviar instruções':mode==='password'?'Salvar senha e encerrar sessões':'Continuar'}</button><Link href="/equipe/acesso">Voltar ao acesso individual</Link></form>;
}
