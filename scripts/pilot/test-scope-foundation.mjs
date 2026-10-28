import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!process.env.DNA_TEST_PGLITE_MODULE)throw Error('Explicit local PGlite module required');
const {PGlite}=require(process.env.DNA_TEST_PGLITE_MODULE);
const db=new PGlite();
const client={query:async(sql,args)=>args?db.query(sql,args):(await db.exec(sql)).at(-1)};
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
let checks=0;const pass=t=>{checks++;console.log('PASS '+t)};
try{
 const name=(await db.query('SELECT current_database() AS name')).rows[0].name;
 if(!/^[a-z0-9_]+$/.test(name))throw Error('Unexpected local database name');
 const fixture=(await fs.readFile('scripts/pilot/fictitious-baseline.sql','utf8')).replace("current_database()<>'dna_p4_ficticio'", "current_database()<>'"+name+"'");
 await db.exec(fixture);
 const helpers=(await client.query("SELECT oid,pg_get_functiondef(oid) AS def FROM pg_proc WHERE pronamespace IN ('public'::regnamespace,'dna_private'::regnamespace)")).rows;
 const policies=(await client.query('SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname')).rows;
 const migration=await fs.readFile('supabase/migrations/20261028154932_dna_operational_scope_foundation.sql','utf8');
 await assert.rejects(client.query(migration.replace(/COMMIT;\s*$/,'SELECT 1/0; COMMIT;')));await client.query('ROLLBACK');
 assert.equal((await client.query("SELECT to_regclass('public.membership_unit_scopes') AS t")).rows[0].t,null);pass('failed DDL rolls back all changes');
 await client.query(migration);
 for(const h of helpers)assert.equal((await client.query('SELECT pg_get_functiondef($1) AS def',[h.oid])).rows[0].def,h.def);
 assert.deepEqual((await client.query('SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname')).rows,policies);pass('all prior functions and policies unchanged');
 const tenant=id(1),other=id(2),unit=id(3),member=id(4),actor=id(5);
 await client.query('INSERT INTO auth.users VALUES($1)',[actor]);await client.query('INSERT INTO public.user_profiles(id) VALUES($1)',[actor]);
 await client.query("INSERT INTO public.institutions(id,name) VALUES($1,'One'),($2,'Two')",[tenant,other]);
 await client.query("INSERT INTO public.institution_memberships VALUES($1,$2,$3,'seller',true,false)",[member,tenant,actor]);
 await client.query("INSERT INTO public.units_v2(id,name,institution_id) VALUES($1,'One',$2)",[unit,tenant]);
 await client.query('INSERT INTO public.membership_unit_scopes VALUES($1,$2,$3,true)',[member,tenant,unit]);
 await assert.rejects(client.query('UPDATE public.membership_unit_scopes SET institution_id=$1 WHERE membership_id=$2',[other,member]),{code:'23503'});pass('cross institution membership binding rejected');
 await assert.rejects(client.query('INSERT INTO public.participants_v2(id,unit_id,institution_id) VALUES($1,$2,$3)',[id(6),unit,other]),{code:'23503'});pass('cross institution participant binding rejected');
 await client.query('INSERT INTO public.participants_v2(id,unit_id,institution_id) VALUES($1,$2,$3)',[id(6),unit,tenant]);
 const row=(await client.query('SELECT report_released,content_homologated FROM public.participants_v2')).rows[0];assert.equal(row.report_released,false);assert.equal(row.content_homologated,false);pass('report release defaults remain closed');
 assert.equal((await client.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.membership_unit_scopes'::regclass")).rows[0].relrowsecurity,true);
 for(const role of ['anon','authenticated']){
  await client.query('SET ROLE '+role);
  for(const sql of ['SELECT * FROM public.membership_unit_scopes',"INSERT INTO public.membership_unit_scopes SELECT * FROM public.membership_unit_scopes",'UPDATE public.membership_unit_scopes SET active=false','DELETE FROM public.membership_unit_scopes'])await assert.rejects(client.query(sql),{code:'42501'});
  await client.query('RESET ROLE');
 }
 pass('RLS enabled and direct CRUD denied for anon and authenticated');
 console.log(JSON.stringify({passed:checks,productionAccess:false}));

}finally{await db.close();console.log('In-memory PostgreSQL engine closed; no production access.');}
