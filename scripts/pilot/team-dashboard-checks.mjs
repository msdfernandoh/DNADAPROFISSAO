import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
export async function teamDashboardChecks(db,{id,tenant,unit,seller,member}){
 await db.exec('ALTER TABLE public.participants_v2 ADD COLUMN IF NOT EXISTS notes text');
 await db.exec(await readFile('supabase/migrations/20261028172514_dna_scoped_follow_up.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/20261029105817_dna_integrated_reports_team_dashboard.sql','utf8'));
 const as=async(role,sql,args=[])=>{await db.exec('SET ROLE '+role);try{return (await db.query(sql,args)).rows[0]?.v;}finally{await db.exec('RESET ROLE');}};
 const jwt=async(user,session)=>db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:user,session_id:session,exp:Math.floor(Date.now()/1000)+3600})]);
 await db.query("INSERT INTO public.user_permission_grants(membership_id,institution_id,resource,action,scope_type,allowed) VALUES($1,$2,'lead','read','assigned_leads',true)",[member,tenant]);
 const revision=(await db.query('SELECT revision FROM dna_private.evaluation_revisions LIMIT 1')).rows[0].revision;
 for(let n=0;n<125;n++)await db.query('INSERT INTO public.participants_v2(id,name,institution_id,unit_id,assigned_user_id,v1_revision,status,updated_at,notes) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8)',[id(1000+n),'Lead fictício '+n,tenant,unit,seller,revision,n%3===0?'Matriculado':'Novo','Nota preservada']);
 await jwt(seller,id(5));
 const expected=(await db.query("SELECT count(*)::int AS total,count(*) filter(where status='Matriculado')::int AS enrolled FROM public.participants_v2 WHERE institution_id=$1 AND assigned_user_id=$2 AND unit_id=$3 AND v1_revision IS NOT NULL",[tenant,seller,unit])).rows[0];
 const dashboard=(filter='all',cursor=null)=>as('authenticated','SELECT public.dna_team_dashboard($1,$2,$3,$4) AS v',[tenant,filter,cursor?.updatedAt||null,cursor?.id||null]);
 const first=await dashboard();assert.equal(first.counts.all,expected.total);assert.equal(first.counts.enrolled,expected.enrolled);assert.ok(first.counts.all>100);assert.equal(first.leads.length,50);assert.ok(first.nextCursor);
 const ids=new Set(first.leads.map(p=>p.id));let cursor=first.nextCursor;while(cursor){const next=await dashboard('all',cursor);for(const p of next.leads){assert.ok(!ids.has(p.id));ids.add(p.id);}cursor=next.nextCursor;}assert.equal(ids.size,expected.total);
 const enrolled=await dashboard('enrolled');assert.ok(enrolled.leads.every(p=>p.status==='Matriculado'));const reports=await dashboard('report');assert.ok(reports.leads.every(p=>p.has_report));assert.equal(reports.leads.length,reports.counts.report);
 const lead=first.leads.find(p=>p.status!=='Matriculado');const beforeCount=first.counts.enrolled;
 await as('authenticated','SELECT public.dna_update_follow_up($1,$2,$3) AS v',[lead.id,{status:'Matriculado'},lead.updated_at]);
 const after=await dashboard();assert.equal(after.counts.enrolled,beforeCount+1);assert.equal((await db.query('SELECT notes FROM public.participants_v2 WHERE id=$1',[lead.id])).rows[0].notes,'Nota preservada');await assert.rejects(as('authenticated','SELECT public.dna_update_follow_up($1,$2,$3)',[lead.id,{status:'Novo'},lead.updated_at]));
 await assert.rejects(as('authenticated','SELECT public.dna_team_dashboard($1)',[id(999)]));await assert.rejects(as('anon','SELECT public.dna_team_dashboard($1)',[tenant]));
 const denied=await db.query("INSERT INTO public.user_permission_grants(membership_id,institution_id,resource,action,scope_type,allowed) VALUES($1,$2,'lead','read','assigned_leads',false) RETURNING id",[member,tenant]);assert.equal((await dashboard()).counts.all,0);await db.query('DELETE FROM public.user_permission_grants WHERE id=$1',[denied.rows[0].id]);
 const original=(await db.query('SELECT participant_id,v1_snapshot FROM public.questionnaire_results WHERE v1_snapshot IS NOT NULL AND v1_debit_id IS NOT NULL LIMIT 1')).rows[0],publication=original.v1_snapshot.publication;assert.ok(publication);
 const before=JSON.stringify(original.v1_snapshot),debits=(await db.query('SELECT count(*)::int AS n FROM public.credit_events_v2')).rows[0].n;
 for(const role of ['anon','authenticated'])await assert.rejects(as(role,'SELECT public.dna_store_editorial_edition($1,$2)',[original.participant_id,publication]));
 const saved=await as('service_role','SELECT public.dna_store_editorial_edition($1,$2) AS v',[original.participant_id,publication]);assert.deepEqual(saved,publication);await as('service_role','SELECT public.dna_store_editorial_edition($1,$2) AS v',[original.participant_id,publication]);assert.equal((await db.query('SELECT count(*)::int AS n FROM public.evaluation_editorial_editions')).rows[0].n,1);await assert.rejects(db.query("UPDATE public.evaluation_editorial_editions SET publication='{}'"));assert.equal(JSON.stringify((await db.query('SELECT v1_snapshot FROM public.questionnaire_results WHERE participant_id=$1',[original.participant_id])).rows[0].v1_snapshot),before);assert.equal((await db.query('SELECT count(*)::int AS n FROM public.credit_events_v2')).rows[0].n,debits);
 return {checks:15,over100Leads:true,disposableDatabase:true};
}
