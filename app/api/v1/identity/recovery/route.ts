import {createClient} from '@/lib/supabase/individual-server';
import {v1Flags} from '@/lib/saas/flags';
import {allowedRequestOrigin,trustedAppOrigin} from '@/lib/saas/request-security';
import {recoveryEnabled} from '@/lib/saas/recovery';
import {authThrottle} from '@/lib/saas/auth-throttle';
import {privateReply as reply,smallJson} from '@/lib/saas/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!v1Flags(process.env).individualAccess||!recoveryEnabled(process.env))return reply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return reply({error:'Origem não autorizada'},403);
 const input=await smallJson(request);if(!input||Object.keys(input).some(k=>k!=='email')||typeof input.email!=='string'||input.email.length>254||!input.email.includes('@'))return reply({error:'Dados inválidos'},400);
 if(!authThrottle.take('recovery',input.email))return reply({error:'Aguarde antes de tentar novamente.'},429);
 try{const db=await createClient();await db.auth.resetPasswordForEmail(input.email.trim(),{redirectTo:trustedAppOrigin(process.env.DNA_APP_ORIGIN)+'/equipe/recuperar/confirmar'});
 // Same answer for unknown emails and provider errors: never reveal whether an account exists.
 return reply({ok:true,message:'Se houver uma conta elegível, você receberá as instruções.'});
 }catch{return reply({ok:true,message:'Se houver uma conta elegível, você receberá as instruções.'});}
}
