import {cookies} from 'next/headers';
import {createClient} from '@/lib/supabase/individual-server';
import {v1Flags} from '@/lib/saas/flags';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {recoveryEnabled,recoveryGrant,RECOVERY_COOKIE} from '@/lib/saas/recovery';
import {authThrottle} from '@/lib/saas/auth-throttle';
import {loadVerifiedIdentity,type IdentityClient} from '@/lib/saas/identity';
import {privateReply as reply,smallJson} from '@/lib/saas/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!v1Flags(process.env).individualAccess||!recoveryEnabled(process.env))return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 const input=await smallJson(request);if(!input||Object.keys(input).some(k=>k!=='tokenHash')||typeof input.tokenHash!=='string'||!/^[a-zA-Z0-9_-]{32,256}$/.test(input.tokenHash))return reply({error:'Link inválido'},400);
 // A process-wide bucket also bounds attempts using different random token hashes.
 if(!authThrottle.take('confirm','all-confirmations'))return reply({error:'Aguarde antes de tentar novamente.'},429);
 let db:Awaited<ReturnType<typeof createClient>>|null=null;
 try{db=await createClient();const verified=await db.auth.verifyOtp({token_hash:input.tokenHash,type:'recovery'});
 if(verified.error)return reply({error:'Link inválido ou expirado'},400);
 const identity=await loadVerifiedIdentity(db as unknown as IdentityClient);
 if(!identity?.sessionId||(!identity.globalOwner&&!identity.memberships.length)){await db.auth.signOut({scope:'local'});return reply({error:'Acesso não autorizado'},403);}
 const store=await cookies();store.set(RECOVERY_COOKIE,recoveryGrant(identity.userId,identity.sessionId,process.env.DNA_RECOVERY_SECRET!),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/v1/identity',maxAge:600});
 return reply({ok:true});
 }catch{if(db)try{await db.auth.signOut({scope:'local'});}catch{}return reply({error:'Acesso temporariamente indisponível'},503);}
}
