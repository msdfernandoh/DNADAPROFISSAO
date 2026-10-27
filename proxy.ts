import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {v1Flags} from './lib/saas/flags';
/** Refresh only the isolated SaaS cookie on new SSR pages. Authorization is re-read in each handler. */
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 if(!v1Flags(process.env).individualAccess)return response;
 const db=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
 cookieOptions:{name:'dna-saas-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
 cookies:{getAll:()=>request.cookies.getAll(),setAll(values){for(const {name,value}of values)request.cookies.set(name,value);response=NextResponse.next({request});for(const {name,value,options}of values)response.cookies.set(name,value,options);}}
 });
 try{await db.auth.getUser();}catch{/* Protected pages still fail closed on their own identity read. */}
 response.headers.set('Cache-Control','no-store');return response;
}
export const config={matcher:['/equipe/:path*','/admin/integracao-v1/:path*']};
