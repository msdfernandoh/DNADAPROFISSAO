import type {CookieOptions} from '@supabase/ssr';
export const REMEMBER_COOKIE='dna-saas-remember';
export const REMEMBER_SECONDS=30*24*60*60;
/** Only cookie lifetime changes. Authorization and server-side session checks remain mandatory. */
export function sessionCookieOptions(options:CookieOptions,remember:boolean):CookieOptions{
 if(options.maxAge===0)return options; // Preserve logout and obsolete-chunk deletion.
 const result={...options};delete result.expires;
 if(remember)result.maxAge=REMEMBER_SECONDS;else delete result.maxAge;
 return result;
}
