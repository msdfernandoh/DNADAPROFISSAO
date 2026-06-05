import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const SESSION_COOKIE = "dna_admin_session"
const SESSION_VALUE = "authenticated"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Senha inválida" }, { status: 400 })
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
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
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return NextResponse.json({ authed: session?.value === SESSION_VALUE })
}
