import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { normalizeCityState } from "@/lib/city-utils"
import { BRAZIL_UFS } from "@/lib/brazil-ufs"

const SESSION_COOKIE = "dna_admin_session"
const SESSION_VALUE = "authenticated"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

function parseCityBody(body: unknown) {
  const raw = body as { name?: string; state?: string; id?: string }
  const name = (raw?.name || "").trim()
  const state = normalizeCityState(raw?.state || "")
  return { id: raw?.id, name, state }
}

function validateCity(name: string, state: string) {
  if (!name) return "Nome da cidade é obrigatório."
  if (!state || state.length !== 2) return "Informe a UF com 2 letras."
  if (!BRAZIL_UFS.includes(state as (typeof BRAZIL_UFS)[number])) {
    return "UF inválida."
  }
  return null
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true })
    .order("state", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const { name, state } = parseCityBody(await req.json())
  const errMsg = validateCity(name, state)
  if (errMsg) return NextResponse.json({ error: errMsg }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .insert({ name, state })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const { id, name, state } = parseCityBody(await req.json())
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
  const errMsg = validateCity(name, state)
  if (errMsg) return NextResponse.json({ error: errMsg }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cities")
    .update({ name, state })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from("cities").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
