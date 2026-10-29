import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
export async function stateCoverageChecks(db,{id,tenant,unit,seller,admin,adminSession,polo,local,second,routedId}){
 await db.exec('ALTER TABLE public.sales_vendors ADD COLUMN phone text');
 await db.exec(await readFile('supabase/migrations/20261029025948_dna_result_teaser_state_coverage.sql','utf8'));
 const as=async(role,sql,args=[])=>{await db.exec('SET ROLE '+role);try{return (await db.query(sql,args)).rows[0]?.v;}finally{await db.exec('RESET ROLE');}};
 const route=(city,slug=null)=>as('service_role','SELECT public.dna_resolve_public_route($1,$2) AS v',[city,slug]);
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:admin,session_id:adminSession,exp:Math.floor(Date.now()/1000)+3600})]);
 await assert.rejects(as('authenticated',"SELECT public.dna_set_state_coverage('MT',$1)",[unit]));
 await db.query('INSERT INTO public.platform_owners VALUES($1,true)',[admin]);
 await as('authenticated',"SELECT public.dna_set_state_coverage('MT',$1)",[unit]);
 assert.equal((await route('Sorriso, MT')).unitId,unit);assert.equal((await route('Sorriso, MT')).route,'state_coverage');
 await assert.rejects(as('authenticated',"SELECT public.dna_set_state_coverage('MT',$1)",[polo]));
 await db.query("INSERT INTO public.credit_events_v2(institution_id,unit_id,type,amount) VALUES($1,$2,'v1_grant',10)",[tenant,polo]);
 assert.equal((await route('Sorriso, MT')).unitId,polo);assert.equal((await route('Vera, MT')).unitId,polo);
 await db.query("INSERT INTO public.credit_events_v2(institution_id,unit_id,type,amount) VALUES($1,$2,'v1_grant',10)",[tenant,local]);
 assert.equal((await route('Vera, MT')).unitId,local);assert.equal((await route('Vera, MT')).route,'own_city');
 assert.equal((await route('Cláudia, MT')).route,'state_coverage');assert.equal((await route('Curitiba, PR')).route,'mother_unit');
 assert.equal((await route('Vera, MT','vendedor-ficticio')).assignedUserId,seller);
 const before=(await db.query('SELECT assigned_user_id,unit_id FROM public.participants_v2 WHERE id=$1',[routedId])).rows[0];
 await as('authenticated',"SELECT public.dna_set_state_coverage('MT',$1)",[polo]);assert.deepEqual((await db.query('SELECT assigned_user_id,unit_id FROM public.participants_v2 WHERE id=$1',[routedId])).rows[0],before);
 await assert.rejects(as('authenticated','SELECT public.dna_save_unit_contact($1,$2,$3,true)',[local,admin,'123']));
 await as('authenticated','SELECT public.dna_save_unit_contact($1,$2,$3,true)',[local,second,'+55 (66) 99999-9999']);
 await db.query('UPDATE public.unit_public_sellers SET active=false WHERE unit_id=$1',[local]);assert.equal((await route('Vera, MT')).assignedUserId,second);
 await db.query('UPDATE public.user_profiles SET active=false WHERE id=$1',[second]);await assert.rejects(route('Vera, MT'));await db.query('UPDATE public.user_profiles SET active=true WHERE id=$1',[second]);
 for(const role of ['anon','authenticated'])await assert.rejects(as(role,'SELECT public.dna_result_contact($1)',[routedId]));
 const settings=await as('authenticated','SELECT public.dna_list_unit_contacts() AS v');assert.ok(settings.contacts.some(c=>c.user_id===second&&c.phone==='5566999999999'));
 await as('authenticated',"SELECT public.dna_set_state_coverage('MT',null)");assert.equal((await route('Cláudia, MT')).route,'mother_unit');
 return 13;
}
