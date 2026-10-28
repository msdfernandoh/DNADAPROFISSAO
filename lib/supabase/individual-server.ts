import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {REMEMBER_COOKIE,REMEMBER_SECONDS,sessionCookieOptions} from '../saas/session-persistence';
/** Separate cookie namespace: the legacy admin/session can never authenticate SaaS. */
export async function createClient(preference?:{remember:boolean}){
 const store=await cookies();
 const remember=preference?.remember??store.getAll().find(c=>c.name===REMEMBER_COOKIE)?.value!=='0';
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
  cookieOptions:{name:'dna-saas-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>store.getAll(),setAll(values){try{for(const {name,value,options}of values)store.set(name,value,sessionCookieOptions(options,remember));if(preference)store.set(REMEMBER_COOKIE,remember?'1':'0',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',...(remember?{maxAge:REMEMBER_SECONDS}:{})});}catch{/* SSR reads: proxy refreshes cookies before rendering. */}}}
 });
}
