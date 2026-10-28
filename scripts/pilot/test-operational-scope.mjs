import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{Client}=require(process.env.DNA_TEST_PG_MODULE),bin=process.env.DNA_TEST_PG_BIN;
const root=path.resolve('.local-tests'),run=path.join(root,'dna-scope-'+Date.now());await fs.mkdir(run,{recursive:true});
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','Path'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
function exec(exe,args){return new Promise((resolve,reject)=>{const c=spawn(exe,args,{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let out='';c.stdout.on('data',b=>out+=b);c.stderr.on('data',b=>out+=b);c.on('error',reject);c.on('exit',n=>{c.stdout.destroy();c.stderr.destroy();n===0?resolve(out):reject(Error(out));});});}
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const pw=path.join(run,'pw'),password=randomBytes(32).toString('hex'),data=path.join(run,'data');await fs.writeFile(pw,password);let started=false,client;
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');let checks=0;const pass=t=>{checks++;console.log('PASS '+t);};
try{
 await exec(path.join(bin,'initdb.exe'),['-D',data,'-U','fixture','--pwfile='+pw,'--auth=scram-sha-256','--encoding=UTF8','--locale=C']);await fs.unlink(pw);
 await exec(path.join(bin,'pg_ctl.exe'),['-D',data,'-l',path.join(run,'pg.log'),'-o','-h 127.0.0.1 -p '+port,'-w','start']);started=true;
 client=new Client({host:'127.0.0.1',port,user:'fixture',password,database:'postgres'});await client.connect();await client.query('CREATE DATABASE dna_p4_ficticio');await client.end();
 client=new Client({host:'127.0.0.1',port,user:'fixture',password,database:'dna_p4_ficticio'});await client.connect();
 await client.query(await fs.readFile('scripts/pilot/fictitious-baseline.sql','utf8'));
 // Helpers reproduce the preserved production behavior, not P3 001 replacements.
 await client.query(`CREATE FUNCTION dna_private.is_active_user() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=auth.uid() AND active) $$;
 CREATE FUNCTION dna_private.is_platform_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.platform_owners o JOIN public.user_profiles p ON p.id=o.user_id WHERE o.user_id=auth.uid() AND o.active AND p.active) $$;`);
 await client.query(await fs.readFile('supabase/migrations/20261027233924_dna_session_dependency_only.sql','utf8'));
 const helper=await client.query("SELECT proname,pg_get_functiondef(oid) AS def FROM pg_proc WHERE pronamespace='dna_private'::regnamespace ORDER BY proname");
 const policies=await client.query('SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname');
 const migration=await fs.readFile('scripts/pilot/P3-002-NEXT-NOT-EXECUTED.sql','utf8');
 // Demonstrate failed DDL is atomic before committing the candidate.
 await client.query(migration.replace(/COMMIT;\s*$/,'SELECT 1/0; COMMIT;')).then(()=>assert.fail('Expected rollback'),()=>{});await client.query('ROLLBACK');
 assert.equal((await client.query("SELECT to_regclass('public.membership_unit_scopes') AS t")).rows[0].t,null);pass('failed migration leaves no partial schema');
 await client.query(migration);
 for(const row of helper.rows)assert.equal((await client.query('SELECT pg_get_functiondef(oid) AS def FROM pg_proc WHERE pronamespace=$1::regnamespace AND proname=$2',['dna_private',row.proname])).rows[0].def,row.def);
 assert.deepEqual((await client.query('SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname')).rows,policies.rows);pass('old helpers and policies unchanged');
 const actor=id(1),session=id(2),tenant=id(3),unit=id(4),otherUnit=id(5),otherTenant=id(6),otherTenantUnit=id(7),member=id(8),own=id(9),foreign=id(10),unassigned=id(11),otherOwner=id(12);
 await client.query('INSERT INTO auth.users VALUES($1),($2)',[actor,otherOwner]);await client.query('INSERT INTO public.user_profiles VALUES($1,$2,true),($3,$4,true)',[actor,'Fixture',otherOwner,'Other fixture']);await client.query("INSERT INTO auth.sessions VALUES($1,$2,now()+interval '1 hour')",[session,actor]);
 await client.query('INSERT INTO public.institutions(id,name) VALUES($1,$2),($3,$4)',[tenant,'Fixture',otherTenant,'Other']);
 await client.query('INSERT INTO public.units_v2(id,name,institution_id) VALUES($1,$2,$3),($4,$5,$3),($6,$7,$8)',[unit,'One',tenant,otherUnit,'Two',otherTenantUnit,'Other',otherTenant]);
 await client.query("INSERT INTO public.institution_memberships VALUES($1,$2,$3,'seller',true,false)",[member,tenant,actor]);await client.query('INSERT INTO public.membership_unit_scopes VALUES($1,$2,$3,true)',[member,tenant,unit]);
 for(const [pid,t,u]of [[own,tenant,unit],[foreign,otherTenant,otherTenantUnit],[unassigned,tenant,otherUnit]])await client.query('INSERT INTO public.participants_v2(id,institution_id,unit_id,assigned_user_id) VALUES($1,$2,$3,$4)',[pid,t,u,actor]);
 await client.query("INSERT INTO public.user_permission_grants(membership_id,institution_id,resource,action,scope_type,allowed) VALUES($1,$2,'lead','read','assigned_leads',true)",[member,tenant]);
 const claim=async exp=>client.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:actor,session_id:session,exp:exp??Math.floor(Date.now()/1000)+3600})]);await claim();
 const allowed=async pid=>{await client.query('SET ROLE authenticated');try{return(await client.query("SELECT public.dna_authorize_participant($1,'lead','read') AS a",[pid])).rows[0].a;}finally{await client.query('RESET ROLE');}};
 assert(await allowed(own));assert(!await allowed(foreign));assert(!await allowed(unassigned));pass('own lead allowed; foreign institution and unit denied');
 await client.query('UPDATE public.participants_v2 SET assigned_user_id=$1 WHERE id=$2',[otherOwner,own]);assert(!await allowed(own));await client.query('UPDATE public.participants_v2 SET assigned_user_id=$1 WHERE id=$2',[actor,own]);pass('stored responsibility enforced after transfer');
 await client.query('UPDATE public.membership_unit_scopes SET active=false');assert(!await allowed(own));await client.query('UPDATE public.membership_unit_scopes SET active=true');pass('unit revocation effective immediately');
 await client.query('UPDATE public.institution_memberships SET active=false');assert(!await allowed(own));await client.query('UPDATE public.institution_memberships SET active=true');pass('membership revocation enforced');
 await claim(1);assert(!await allowed(own));await claim();await client.query("UPDATE auth.sessions SET not_after=now()-interval '1 second'");assert(!await allowed(own));await client.query("UPDATE auth.sessions SET not_after=now()+interval '1 hour'");pass('expired JWT and stored session rejected with original helpers');
 await client.query("UPDATE public.user_permission_grants SET allowed=false");assert(!await allowed(own));await client.query("UPDATE public.user_permission_grants SET allowed=true");pass('explicit deny blocks access');
 await client.query('SET ROLE authenticated');await assert.rejects(client.query('SELECT * FROM public.participants_v2'),{code:'42501'});await assert.rejects(client.query("UPDATE public.institution_memberships SET role_code='institution_admin'"),{code:'42501'});await client.query('RESET ROLE');pass('direct reads and self elevation blocked');
 await assert.rejects(client.query('INSERT INTO public.membership_unit_scopes VALUES($1,$2,$3,true)',[member,tenant,otherTenantUnit]),{code:'23503'});pass('foreign tenant unit binding rejected by FK');
 const before=(await client.query('SELECT count(*)::integer AS n FROM public.participants_v2')).rows[0].n;
 await client.query(await fs.readFile('scripts/pilot/P3-002-disable.sql','utf8'));
 assert.equal((await client.query("SELECT has_function_privilege('authenticated','public.dna_authorize_participant(uuid,text,text)','EXECUTE') AS a")).rows[0].a,false);
 assert.equal((await client.query('SELECT count(*)::integer AS n FROM public.participants_v2')).rows[0].n,before);assert((await client.query('SELECT public.dna_current_session() AS s')).rows[0].s);pass('operational rollback disables RPC without losing records or login');
 console.log(JSON.stringify({passed:checks,claims:'simulated; real JWT tested separately',recovery:'non-destructive capability disable; no full restore claimed'}));
}finally{if(client)await client.end();if(started)await exec(path.join(bin,'pg_ctl.exe'),['-D',data,'-m','fast','-w','stop']);const a=await fs.realpath(run),b=await fs.realpath(root);if(path.dirname(a)!==b||!path.basename(a).startsWith('dna-scope-'))throw Error('Unsafe cleanup');await fs.rm(a,{recursive:true});console.log('Temporary fixture cluster stopped and removed.');}
