import {privateReply as reply} from '@/lib/saas/http';
import {evaluationFlags} from '@/lib/saas/flags';
import {previewStoredEvaluation} from '@/lib/saas/report-preview-server';
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 if(!evaluationFlags(process.env).draftPreview)return reply({error:'Indisponível'},404);
 try{return reply(await previewStoredEvaluation((await context.params).id));}
 catch{return reply({error:'Prévia indisponível'},503);}
}
