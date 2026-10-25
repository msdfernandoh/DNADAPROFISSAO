import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthed } from "@/lib/questionnaire-platform/auth"
import { createServiceClient as createClient } from "@/lib/supabase/service"

const isAuthed = isAdminAuthed

// GET — público (formulário de cadastro consome essa lista)
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST — protegido (cadastro de curso individual)
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const body = await req.json()
  const name = (body?.name || "").trim()
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .insert({
      name,
      level: body?.level?.trim() || null,
      external_id: body?.external_id?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT — protegido (edição de curso existente)
export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const body = await req.json()
  const id = body?.id
  const name = (body?.name || "").trim()
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .update({
      name,
      level: body?.level?.trim() || null,
      external_id: body?.external_id?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — protegido (exclusão por id)
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from("courses").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
