// Controlled real JWT smoke: synthetic identity only; no participant, membership, permission or credit.
import {createClient} from '@supabase/supabase-js';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
if(process.env.DNA_REAL_AUTH_SMOKE!=='SYNTHETIC_IDENTITY_ONLY')throw Error('Explicit synthetic identity marker required');
process.loadEnvFile('.env.production.local');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
if(url!=='https://ejcpumiypodpdmhiulwk.supabase.co')throw Error('Unexpected project');
const service=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const normal=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const email='dna-validation-'+randomUUID()+'@example.invalid',password=randomBytes(40).toString('base64url');
let userId,profileCreated=false,sessionStarted=false;
const counts=async()=>{const result=await service.from('participants').select('id',{count:'exact',head:true});if(result.error)throw Error('Baseline count unavailable');return result.count;};
const before=await counts();
try{
 const created=await service.auth.admin.createUser({email,password,email_confirm:true});
 if(created.error||!created.data.user)throw Error('Synthetic Auth creation failed');userId=created.data.user.id;
 const profile=await service.from('user_profiles').insert({id:userId,display_name:'Validação técnica temporária',active:true});
 if(profile.error)throw Error('Synthetic profile creation failed');profileCreated=true;
 const login=await normal.auth.signInWithPassword({email,password});if(login.error||!login.data.session)throw Error('Synthetic sign in failed');sessionStarted=true;
 const proof=await normal.rpc('dna_current_session');assert.equal(proof.error,null);assert.equal(proof.data?.user_id,userId);assert.ok(proof.data.session_id);console.log('PASS real Supabase password login and live stored session');
 const token=login.data.session.access_token;
 const list=await normal.rpc('dna_list_evaluations',{p_institution:'2de1fc01-8398-4633-86e4-5383b76b67bf'});assert.ok(list.error);console.log('PASS real JWT without membership cannot list Sinop evaluations');
 const forbidden=await normal.from('participants').select('id',{count:'exact',head:true});assert.ok(forbidden.error||forbidden.count===0);console.log('PASS ordinary JWT cannot read historical participants');
 const draft=await normal.rpc('dna_save_evaluation_draft',{p_participant:randomUUID(),p_revision:'dna-official-2026-10-26.v1',p_answers:[]});assert.ok(draft.error);console.log('PASS real JWT without scope cannot save evaluation answers');
 const logout=await normal.auth.signOut({scope:'global'});if(logout.error)throw Error('Synthetic session revocation failed');sessionStarted=false;
 const oldTokenClient=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const revoked=await oldTokenClient.rpc('dna_current_session');assert.equal(revoked.error,null);assert.equal(revoked.data,null);console.log('PASS revoked stored session rejects still-unexpired real JWT');
 assert.equal(await counts(),before);console.log('PASS historical participant count unchanged: '+before);
}finally{
 if(sessionStarted){const revoked=await normal.auth.signOut({scope:'global'});if(revoked.error)throw Error('Cleanup: synthetic session revocation failed');}
 if(profileCreated){const removed=await service.from('user_profiles').delete().eq('id',userId);if(removed.error)throw Error('Cleanup: synthetic profile removal failed');}
 if(userId){const removed=await service.auth.admin.deleteUser(userId);if(removed.error)throw Error('Cleanup: synthetic Auth removal failed');}
 console.log('Synthetic identity removed; no membership, participant or credit was created.');
}
