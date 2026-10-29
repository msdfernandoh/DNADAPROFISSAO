import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
export async function cityRoutingChecks(db,{id,tenant,unit,seller,member}){
 await db.exec(`ALTER TABLE public.units_v2 ALTER COLUMN id SET DEFAULT gen_random_uuid(),ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();ALTER TABLE public.participants_v2 ADD COLUMN IF NOT EXISTS vendor_slug text;CREATE TABLE public.sales_vendors(id uuid DEFAULT gen_random_uuid(),name text,slug text UNIQUE,active boolean DEFAULT true);`);
 await db.exec(await readFile('supabase/migrations/20261029024431_dna_city_unit_routing.sql','utf8'));
 const call=async(name,args)=>{await db.exec('SET ROLE service_role');try{return (await db.query('SELECT public.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') AS v',args)).rows[0].v;}finally{await db.exec('RESET ROLE');}};
 const route=(city,slug=null)=>call('dna_resolve_public_route',[city,slug]);
 const cityCode=async name=>(await db.query("SELECT ibge_code FROM public.city_catalog WHERE name=$1 AND state='MT'",[name])).rows[0].ibge_code;
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.city_catalog')).rows[0].n,5571);
 assert.equal((await route('Sinop, MT')).unitId,unit);assert.equal((await route('Cidade não informada')).route,'mother_unit');
 const admin=id(101),adminMember=id(102),adminSession=id(103),second=id(104),secondMember=id(105);
 for(const [user,email,name]of [[admin,'admin@example.invalid','Admin fictício'],[second,'seller@example.invalid','Vendedor fictício']]){await db.query('INSERT INTO auth.users VALUES($1,$2)',[user,email]);await db.query('INSERT INTO public.user_profiles(id,display_name) VALUES($1,$2)',[user,name]);}
 await db.query(`INSERT INTO public.institution_memberships VALUES($1,$2,$3,'institution_admin',true,false),($4,$2,$5,'seller',true,false)`,[adminMember,tenant,admin,secondMember,second]);
 await db.query(`INSERT INTO public.user_permission_grants(membership_id,institution_id,resource,action,scope_type,allowed) VALUES($1,$2,'commercial_report','read','assigned_leads',true)`,[secondMember,tenant]);
 await db.query(`INSERT INTO auth.sessions VALUES($1,$2,now()+interval '1 hour')`,[adminSession,admin]);await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:admin,session_id:adminSession,exp:Math.floor(Date.now()/1000)+3600})]);
 const save=async data=>{await db.exec('SET ROLE authenticated');try{return (await db.query('SELECT public.dna_save_routing_unit($1) AS id',[data])).rows[0].id;}finally{await db.exec('RESET ROLE');}};
 const sorriso=await cityCode('Sorriso'),vera=await cityCode('Vera'),sinop=await cityCode('Sinop');
 const setup={name:'Polo Sorriso Fictício',city_id:sorriso,neighbors:[vera],sellers:[seller,second],links:[],active:true};
 const polo=await save(setup);assert.ok(polo);assert.equal((await route('Sorriso, MT')).unitId,polo);assert.equal((await route('Vera, MT')).unitId,polo);assert.equal((await route('Vera, MT')).route,'neighbor_city');
 const random=new Set();for(let i=0;i<40;i++)random.add((await route('Sorriso, MT')).assignedUserId);assert.deepEqual([...random].sort(),[seller,second].sort());
 await db.query('UPDATE public.user_profiles SET active=false WHERE id=$1',[second]);for(let i=0;i<5;i++)assert.equal((await route('Sorriso, MT')).assignedUserId,seller);await db.query('UPDATE public.user_profiles SET active=true WHERE id=$1',[second]);
 const local=await save({name:'Polo Vera Fictício',city_id:vera,neighbors:[],sellers:[second],links:[],active:true});assert.equal((await route('Vera, MT')).unitId,local);assert.equal((await route('Vera, MT')).route,'own_city');
 await assert.rejects(save({...setup,id:polo,city_id:vera}));await assert.rejects(save({name:'Polo sem vendedor',city_id:await cityCode('Cláudia'),neighbors:[],sellers:[],links:[],active:true}));
 await db.query("INSERT INTO public.sales_vendors(name,slug) VALUES('Conta pessoal fictícia','vendedor-ficticio')");
 await db.query("INSERT INTO public.personal_vendor_routes VALUES('vendedor-ficticio',$1,$2,$3,true)",[seller,unit,tenant]);
 const personal=await route('Vera, MT','vendedor-ficticio');assert.equal(personal.assignedUserId,seller);assert.equal(personal.unitId,unit);assert.equal(personal.route,'personal_link');
 await assert.rejects(route('Vera, MT','inexistente'));await db.query("UPDATE public.personal_vendor_routes SET active=false WHERE slug='vendedor-ficticio'");await assert.rejects(route('Vera, MT','vendedor-ficticio'));await db.query("UPDATE public.personal_vendor_routes SET active=true WHERE slug='vendedor-ficticio'");
 // Stored registrations must retain the original random result through later requests.
 const reg={name:'Cadastro roteado fictício',phone:'66999990000',email:'route-fixture@example.invalid',city:'Vera, MT',escolaridade:null,course_interest:null,objective:null,priorCourse:null,orientationMode:'undefined_interest',declaredArea:null};
 const routedId=await call('dna_register_public_evaluation',[reg]);const row=(await db.query('SELECT * FROM public.participants_v2 WHERE id=$1',[routedId])).rows[0];assert.equal(row.unit_id,local);assert.equal(row.assigned_user_id,second);
 const referred=await call('dna_register_referred_evaluation',[{...reg,email:'personal-fixture@example.invalid'},'vendedor-ficticio']);const referredRow=(await db.query('SELECT * FROM public.participants_v2 WHERE id=$1',[referred])).rows[0];assert.equal(referredRow.unit_id,unit);assert.equal(referredRow.assigned_user_id,seller);assert.equal(referredRow.vendor_slug,'vendedor-ficticio');
 await db.exec('SET ROLE anon');await assert.rejects(db.query('SELECT public.dna_resolve_public_route($1,NULL)',['Vera, MT']));await assert.rejects(db.query('SELECT public.dna_save_routing_unit($1)',[setup]));await db.exec('RESET ROLE');
 await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:seller,session_id:id(109),exp:Math.floor(Date.now()/1000)+3600})]);await db.query(`INSERT INTO auth.sessions VALUES($1,$2,now()+interval '1 hour')`,[id(109),seller]);await db.exec('SET ROLE authenticated');await assert.rejects(db.query('SELECT public.dna_list_routing_units()'));await db.exec('RESET ROLE');
 // Keep the fixture's original no-credit completion and team tests unaffected.
 const {stateCoverageChecks}=await import('./state-coverage-checks.mjs');
 const stateChecks=await stateCoverageChecks(db,{id,tenant,unit,seller,admin,adminSession,polo,local,second,routedId});
 return {checks:15+stateChecks,polo,local};
}
