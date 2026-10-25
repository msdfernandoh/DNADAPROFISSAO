import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifySession } from "@/lib/security/session"

export const ADMIN_SESSION_COOKIE = "dna_admin_session"
export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, "admin", "legacy-admin")
}
export async function requireAdminAuth(): Promise<NextResponse | null> {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  return null
}
