import {cookies} from 'next/headers';
import {createClient} from '@/lib/supabase/individual-server';
import {v1Flags} from '@/lib/saas/flags';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {recoveryEnabled,verifyRecoveryGrant,RECOVERY_COOKIE} from '@/lib/saas/recovery';
import {loadVerifiedIdentity,type IdentityClient} from '@/lib/saas/identity';
import {privateReply as reply,smallJson} from '@/lib/saas/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!v1Flags(process.env).individualAccess||!recoveryEnabled(process.env))return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 const input=await smallJson(request);if(!input||Object.keys(input).some(k=>k!=='password')||typeof input.password!=='string'||input.password.length<12||input.password.length>128)return reply({error:'Utilize uma senha de 12 a 128 caracteres.'},400);
 try{const db=await createClient(),identity=await loadVerifiedIdentity(db as unknown as IdentityClient),store=await cookies();
 if(!identity?.sessionId||!verifyRecoveryGrant(store.get(RECOVERY_COOKIE)?.value,identity.userId,identity.sessionId,process.env.DNA_RECOVERY_SECRET))return reply({error:'Solicite novamente a recuperação de acesso.'},403);
 const result=await db.auth.updateUser({password:input.password});if(result.error)return reply({error:'Não foi possível atualizar a senha.'},400);
 store.set(RECOVERY_COOKIE,'',{path:'/api/v1/identity',maxAge:0,httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production'});
 const logout=await db.auth.signOut({scope:'global'});if(logout.error)return reply({error:'Senha atualizada. Não foi possível encerrar todas as sessões; contate o administrador.'},503);
 return reply({ok:true});
 }catch{return reply({error:'Acesso temporariamente indisponível'},503);}
}
