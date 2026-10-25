import "server-only"
import { createClient } from "@supabase/supabase-js"

/** Somente rotas de servidor com autenticação/autorização explícita. */
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error("Configure a URL e a chave privada do Supabase no servidor.")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}
