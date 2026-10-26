import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isAdminAuthed, ADMIN_SESSION_COOKIE } from "@/lib/questionnaire-platform/auth"
import { ADMIN_CREDENTIAL_KEY, getAdminCredential, matchesAdminCredential } from "@/lib/security/admin-credential"
import { hashAdminPassword } from "@/lib/security/password-credential"
import { signSession } from "@/lib/security/session"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origem inválida" }, { status: 403 })
  try {
    const { currentPassword, newPassword, confirmation } = await request.json()
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 1024) {
      return NextResponse.json({ error: "A nova senha deve ter entre 8 e 1024 caracteres." }, { status: 400 })
    }
    if (newPassword !== confirmation) return NextResponse.json({ error: "A confirmação não corresponde à nova senha." }, { status: 400 })
    const credential = await getAdminCredential()
    if (!credential || !(await matchesAdminCredential(currentPassword, credential))) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 })
    if (await matchesAdminCredential(newPassword, credential)) return NextResponse.json({ error: "Escolha uma senha diferente da atual." }, { status: 400 })
    const next = await hashAdminPassword(newPassword)
    const db = await createServiceClient()
    const row = { key: ADMIN_CREDENTIAL_KEY, value: next, updated_at: new Date().toISOString() }
    const result = credential.stored
      ? await db.from("app_settings").update(row).eq("key", ADMIN_CREDENTIAL_KEY).eq("value->>revision", credential.stored.revision).select("key").maybeSingle()
      : await db.from("app_settings").insert(row).select("key").single()
    if (result.error?.code === "23505" || (!result.error && !result.data)) return NextResponse.json({ error: "A senha já foi alterada em outra sessão. Entre novamente." }, { status: 409 })
    if (result.error) throw new Error("Falha ao salvar credencial")
    const store = await cookies()
    store.set(ADMIN_SESSION_COOKIE, signSession("admin", "admin:" + next.revision), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Não foi possível alterar a senha. Tente novamente." }, { status: 500 })
  }
}
