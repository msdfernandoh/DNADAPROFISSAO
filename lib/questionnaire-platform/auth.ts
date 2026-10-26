import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getAdminCredential } from "@/lib/security/admin-credential"
import { verifySession } from "@/lib/security/session"

export const ADMIN_SESSION_COOKIE = "dna_admin_session"
export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!verifySession(token, "admin")) return false
  try {
    const credential = await getAdminCredential()
    return !!credential && verifySession(token, "admin", credential.subject)
  } catch { return false }
}
export async function requireAdminAuth(): Promise<NextResponse | null> {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  return null
}
