import "server-only"
import { createServiceClient } from "@/lib/supabase/service"
import { isStoredCredential, bootstrapSubject, verifyAdminPassword, type StoredCredential } from "./password-credential"
import { passwordMatches } from "./session"
export const ADMIN_CREDENTIAL_KEY = "admin_password_credential"
export type AdminCredential = { subject: string; stored: StoredCredential | null; bootstrap: string | null }
export async function getAdminCredential(): Promise<AdminCredential | null> {
  const db = await createServiceClient()
  const { data, error } = await db.from("app_settings").select("value").eq("key", ADMIN_CREDENTIAL_KEY).maybeSingle()
  if (error) throw new Error("Falha ao consultar credencial administrativa")
  if (data) {
    if (!isStoredCredential(data.value)) throw new Error("Credencial administrativa inválida")
    return { subject: "admin:" + data.value.revision, stored: data.value, bootstrap: null }
  }
  const password = process.env.ADMIN_PASSWORD
  return password ? { subject: bootstrapSubject(password), stored: null, bootstrap: password } : null
}
export async function matchesAdminCredential(password: string, credential: AdminCredential): Promise<boolean> {
  if (password.length > 1024) return false
  return credential.stored ? verifyAdminPassword(password, credential.stored) : credential.bootstrap !== null && passwordMatches(password, credential.bootstrap)
}
