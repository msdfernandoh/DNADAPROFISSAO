import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {publicEntryContext,publicQuestions} from '@/lib/saas/public-journey-server';
import {createServiceClient} from '@/lib/supabase/service';
import {setParticipantSession} from '@/lib/security/participant-session';
import {validateRegistration} from '@/lib/questionnaire-engine/integration/journey';
import {AuthThrottle} from '@/lib/saas/auth-throttle';
export const dynamic='force-dynamic';
const throttle=new AuthThrottle();
export async function GET(){try{const c=await publicEntryContext();return privateReply({revision:c.revision,questions:publicQuestions()});}catch{return privateReply({error:'A nova experiência está temporariamente indisponível. Tente novamente em instantes.'},503);}}
export async function POST(request:Request){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 let registration;try{registration=validateRegistration(await smallJson(request,8192));}catch{return privateReply({error:'Confira os campos do cadastro.'},400);}
 const source=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||registration.email;
 if(!throttle.take('login',source))return privateReply({error:'Aguarde alguns minutos antes de tentar novamente.'},429);
 try{await publicEntryContext();const db=await createServiceClient(),r=await db.rpc('dna_register_public_evaluation',{p_registration:registration});
  if(r.error||typeof r.data!=='string')throw Error('Registration unavailable');await setParticipantSession(r.data,'v2');return privateReply({id:r.data},201);
 }catch{return privateReply({error:'Não foi possível iniciar agora. Seu cadastro não avançou; tente novamente em instantes.'},503);}
}
