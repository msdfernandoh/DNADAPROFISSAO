import {privateReply as reply,smallJson} from '@/lib/saas/http';
import {authThrottle} from '@/lib/saas/auth-throttle';
import { createClient } from '@/lib/supabase/individual-server';
import { v1Flags } from '@/lib/saas/flags';
import { loadVerifiedIdentity, type IdentityClient } from '@/lib/saas/identity';
import { allowedRequestOrigin } from '@/lib/saas/request-security';
export const dynamic='force-dynamic';
export async function GET(){
 if(!v1Flags(process.env).individualAccess)return reply({error:'Indisponível'},404);
 try{const db=await createClient(),identity=await loadVerifiedIdentity(db as unknown as IdentityClient);if(!identity)return reply({error:'Não autorizado'},401);
 return reply({userId:identity.userId,displayName:identity.displayName,globalOwner:identity.globalOwner,institutionIds:identity.institutionIds,operationalLeadAccess:false});}catch{return reply({error:'Acesso temporariamente indisponível'},503);}
}
export async function POST(request:Request){
 if(!v1Flags(process.env).individualAccess)return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 const input=await smallJson(request);if(!input)return reply({error:'Dados inválidos'},400);
 if(Object.keys(input).some(k=>!['email','password'].includes(k))||typeof input.email!=='string'||input.email.length>254||!input.email.includes('@')||typeof input.password!=='string'||!input.password.length||input.password.length>1024)return reply({error:'Dados inválidos'},400);
 if(!authThrottle.take('login',input.email))return reply({error:'Aguarde antes de tentar novamente.'},429);
 let signedInClient: Awaited<ReturnType<typeof createClient>> | null = null;
 try{const db=await createClient();signedInClient=db;const auth=await db.auth.signInWithPassword({email:input.email.trim(),password:input.password});
 if(auth.error)return reply({error:'Não foi possível autenticar com os dados informados'},401);
 const identity=await loadVerifiedIdentity(db as unknown as IdentityClient);
 if(!identity||(!identity.globalOwner&&!identity.memberships.length)){await db.auth.signOut({scope:'local'});return reply({error:'Acesso não autorizado'},403);}
 return reply({ok:true});
 }catch{if(signedInClient){try{await signedInClient.auth.signOut({scope:'local'});}catch{}}return reply({error:'Acesso temporariamente indisponível'},503);}
}
export async function DELETE(request:Request){
 if(!v1Flags(process.env).individualAccess)return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 try{const db=await createClient();const result=await db.auth.signOut({scope:'local'});if(result.error)return reply({error:'Não foi possível encerrar a sessão'},503);return reply({ok:true});}catch{return reply({error:'Acesso temporariamente indisponível'},503);}
}
