import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { loadVerifiedIdentity, type IdentityClient } from './identity';
/** Reload on every request; do not cache user activation or grants across users/requests. */
export async function currentIdentity() { const db=await createClient();return loadVerifiedIdentity(db as unknown as IdentityClient); }
