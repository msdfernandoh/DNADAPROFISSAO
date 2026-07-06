import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/** Mesmos valores de app/api/admin/login/route.ts — não alterar o login V1. */
export const ADMIN_SESSION_COOKIE = "dna_admin_session"
export const ADMIN_SESSION_VALUE = "authenticated"

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === ADMIN_SESSION_VALUE
}

export async function requireAdminAuth(): Promise<NextResponse | null> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  return null
}
