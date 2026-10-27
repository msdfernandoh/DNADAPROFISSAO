import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
/** Separate cookie namespace: the legacy admin/session can never authenticate SaaS. */
export async function createClient(){
 const store=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
  cookieOptions:{name:'dna-saas-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>store.getAll(),setAll(values){try{for(const {name,value,options}of values)store.set(name,value,options);}catch{/* SSR reads: proxy refreshes cookies before rendering. */}}}
 });
}
