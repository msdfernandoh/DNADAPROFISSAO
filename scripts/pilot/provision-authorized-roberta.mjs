// Explicitly authorized identity only. Secrets must arrive through stdin and are never logged.
import {createClient} from '@supabase/supabase-js';
let raw='';
for await(const chunk of process.stdin){raw+=chunk;if(raw.length>32768)throw Error('Runtime payload too large');}
const input=JSON.parse(raw);raw='';
if(!input.serviceKey||!input.initialPassword)throw Error('Secure runtime credentials required');
const admin=createClient('https://ejcpumiypodpdmhiulwk.supabase.co',input.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const created=await admin.auth.admin.createUser({email:'roberta@msdeducacao.com.br',password:input.initialPassword,email_confirm:true,app_metadata:{initial_password_change_required:true}});
input.initialPassword='';input.serviceKey='';
if(created.error||!created.data.user)throw Error('Authorized account could not be created; inspect existing identity before retrying.');
const id=created.data.user.id;
const profile=await admin.from('user_profiles').insert({id,display_name:'Roberta',active:true});
if(profile.error)throw Error('Auth identity created; profile pending. Do not recreate the Auth identity.');
console.log(JSON.stringify({created:true,email:'roberta@msdeducacao.com.br',id,emailSent:false}));
