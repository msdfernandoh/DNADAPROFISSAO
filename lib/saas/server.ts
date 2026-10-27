import {pilotIdentity} from '@/lib/saas/pilot';
import 'server-only';
import { createClient } from '@/lib/supabase/individual-server';
import { loadVerifiedIdentity, type IdentityClient } from './identity';
/** Reload on every request; do not cache user activation or grants across users/requests. */
export async function currentIdentity() { const db=await createClient();return pilotIdentity(await loadVerifiedIdentity(db as unknown as IdentityClient),process.env); }
