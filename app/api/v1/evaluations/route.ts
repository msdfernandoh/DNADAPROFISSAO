import {privateReply,smallJson} from '@/lib/saas/http';
import {evaluationFlags} from '@/lib/saas/flags';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {createClient} from '@/lib/supabase/individual-server';
import {createServiceClient} from '@/lib/supabase/service';
import {loadVerifiedIdentity,type IdentityClient} from '@/lib/saas/identity';
import {pilotIdentity} from '@/lib/saas/pilot';
import {validateRegistration,INTEGRATED_REVISION} from '@/lib/questionnaire-engine/integration/journey';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!evaluationFlags(process.env).completion)return privateReply({error:'Indisponível'},404);
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem não autorizada'},403);
 const input=await smallJson(request,8192);let registration;
 try{registration=validateRegistration(input);}catch{return privateReply({error:'Confira os campos de cadastro.'},400);}
 try{
  const client=await createClient(),identity=pilotIdentity(await loadVerifiedIdentity(client as unknown as IdentityClient),process.env);
  if(!identity)return privateReply({error:'Acesso não autorizado'},401);
  const service=await createServiceClient();
  const {data:unit,error}=await service.from('units_v2').select('id').eq('slug','unifecaf-sinop-piloto').eq('institution_id',identity.institutionIds[0]).eq('active',true).maybeSingle();
  if(error||!unit)throw Error('Unit unavailable');
  // The ordinary user RPC independently rechecks current session, unit and create permission.
  const result=await client.rpc('dna_register_evaluation_draft',{p_unit:unit.id,p_revision:INTEGRATED_REVISION,p_registration:registration});
  if(result.error||typeof result.data!=='string')return privateReply({error:'Cadastro não autorizado para esta unidade.'},403);
  return privateReply({id:result.data},201);
 }catch{return privateReply({error:'Cadastro temporariamente indisponível.'},503);}
}
