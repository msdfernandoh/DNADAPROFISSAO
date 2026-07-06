import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  isValidVendorSlug,
  normalizeVendorSlug,
  phoneToWhatsAppDigits,
} from "@/lib/vendor-utils"

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

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_vendors")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const name = (body?.name || "").trim()
  const phoneRaw = (body?.phone || "").trim()
  const slugInput = body?.slug ? normalizeVendorSlug(String(body.slug)) : normalizeVendorSlug(name)
  const active = body?.active !== false

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const phone = phoneToWhatsAppDigits(phoneRaw)
  if (phone.length < 12) {
    return NextResponse.json({ error: "WhatsApp inválido (informe DDD)" }, { status: 400 })
  }

  if (!isValidVendorSlug(slugInput)) {
    return NextResponse.json(
      { error: "Slug inválido (use letras minúsculas, números e hífens)" },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_vendors")
    .insert({ name, phone, slug: slugInput, active })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este slug já está em uso" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const id = body?.id
  const name = (body?.name || "").trim()
  const phoneRaw = (body?.phone || "").trim()
  const slugInput = normalizeVendorSlug(String(body?.slug || ""))
  const active = body?.active !== false

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const phone = phoneToWhatsAppDigits(phoneRaw)
  if (phone.length < 12) {
    return NextResponse.json({ error: "WhatsApp inválido (informe DDD)" }, { status: 400 })
  }

  if (!isValidVendorSlug(slugInput)) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_vendors")
    .update({ name, phone, slug: slugInput, active })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este slug já está em uso" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from("sales_vendors").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
