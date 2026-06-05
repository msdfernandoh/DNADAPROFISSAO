import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE = "dna_admin_session"
const SESSION_VALUE = "authenticated"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Falha ao buscar participantes" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("participants")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Falha ao atualizar participante" }, { status: 500 })
  }
}
