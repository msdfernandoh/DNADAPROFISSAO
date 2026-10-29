import {privateReply,smallJson} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {publicEntryContext,publicQuestions} from '@/lib/saas/public-journey-server';
import {createServiceClient} from '@/lib/supabase/service';
import {setParticipantSession} from '@/lib/security/participant-session';
import {validateRegistration} from '@/lib/questionnaire-engine/integration/journey';
import {AuthThrottle} from '@/lib/saas/auth-throttle';
import {findCity,cityText} from '@/lib/locations/catalog';
import {normalizeVendorSlug} from '@/lib/vendor-utils';
export const dynamic='force-dynamic';
const throttle=new AuthThrottle();
export async function GET(){try{const c=await publicEntryContext();return privateReply({revision:c.revision,questions:publicQuestions()});}catch{return privateReply({error:'A nova experiência está temporariamente indisponível. Tente novamente em instantes.'},503);}}
export async function POST(request:Request){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida.'},403);
 let registration;try{registration=validateRegistration(await smallJson(request,8192));}catch{return privateReply({error:'Confira os campos do cadastro.'},400);}
 if(registration.city){const city=findCity(registration.city);if(city)registration.city=cityText(city);}
 const params=new URL(request.url).searchParams,rawVendor=params.get('v')||params.get('ref'),vendor=rawVendor?normalizeVendorSlug(rawVendor):null;
 if(rawVendor&&(!vendor||vendor!==rawVendor.trim().toLowerCase()))return privateReply({error:'Link pessoal inválido. Solicite o link ao vendedor.'},400);
 const source=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||registration.email;
 if(!throttle.take('login',source))return privateReply({error:'Aguarde alguns minutos antes de tentar novamente.'},429);
 try{await publicEntryContext();const db=await createServiceClient(),r=await db.rpc(vendor?'dna_register_referred_evaluation':'dna_register_public_evaluation',{p_registration:registration,...(vendor?{p_vendor:vendor}:{})});
  if(r.error||typeof r.data!=='string')throw Error('Registration unavailable');await setParticipantSession(r.data,'v2');return privateReply({id:r.data},201);
 }catch{return privateReply({error:vendor?'Este link pessoal está temporariamente indisponível. Fale com seu vendedor; seu cadastro não será enviado a outra pessoa.':'Não foi possível iniciar agora. Seu cadastro não avançou; tente novamente em instantes.'},503);}
}
