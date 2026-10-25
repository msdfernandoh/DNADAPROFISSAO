import { signSession, passwordMatches } from "@/lib/security/session"
import { isAdminAuthed } from "@/lib/questionnaire-platform/auth"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const SESSION_COOKIE = "dna_admin_session"


export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Senha inválida" }, { status: 400 })
    }

    if (!ADMIN_PASSWORD) return NextResponse.json({ error: "Acesso administrativo ainda não configurado." }, { status: 503 })

    if (!passwordMatches(password, ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, signSession("admin", "legacy-admin"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro ao processar login" }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ authed: await isAdminAuthed() })
}
