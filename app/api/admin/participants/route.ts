import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { isAdminAuthed } from "@/lib/questionnaire-platform/auth"

import { parseAdminParticipantUpdate } from "@/lib/security/admin-participant-update"

const isAuthed = isAdminAuthed

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
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }
    const parsed = parseAdminParticipantUpdate(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { id, updates } = parsed.data

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
