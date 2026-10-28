import {randomBytes,createHash} from 'node:crypto';
import {privateReply} from '@/lib/saas/http';
import {allowedRequestOrigin} from '@/lib/saas/request-security';
import {previewStoredEvaluation} from '@/lib/saas/report-preview-server';
import {currentIdentity} from '@/lib/saas/server';
import {createServiceClient} from '@/lib/supabase/service';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!allowedRequestOrigin(request,process.env.DNA_APP_ORIGIN))return privateReply({error:'Origem inválida'},403);
 try{
  const {id}=await params,report=await previewStoredEvaluation(id),identity=await currentIdentity();
  if(report.status!=='approved'||!identity)throw Error('Unavailable');
  const token=randomBytes(32).toString('hex'),db=await createServiceClient();
  const stored=await db.from('participant_report_links').insert({token_hash:createHash('sha256').update(token).digest('hex'),participant_id:id,created_by:identity.userId,expires_at:new Date(Date.now()+30*86400000).toISOString()});
  if(stored.error)throw Error('Unavailable');
  const audit=await db.from('access_audit_events').insert({institution_id:identity.institutionIds[0],actor_user_id:identity.userId,action:'participant_report_link_created',resource_type:'evaluation',resource_id:id,reason:'Authorized delivery of approved participant-only report',metadata:{expiresInDays:30}});
  if(audit.error){await db.from('participant_report_links').update({revoked:true}).eq('token_hash',createHash('sha256').update(token).digest('hex'));throw Error('Audit unavailable');}
  return privateReply({url:process.env.DNA_APP_ORIGIN+'/relatorio/'+token});
 }catch{return privateReply({error:'Relatório indisponível'},403);}
}
