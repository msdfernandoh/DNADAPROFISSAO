import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  normalizeProfileCode,
  validateProfileCode,
} from "@/lib/questionnaire-platform/validators"

type RouteContext = { params: Promise<{ id: string }> }

async function questionnaireExists(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data, error } = await supabase.from("questionnaires").select("id").eq("id", id).maybeSingle()
  return !error && !!data
}

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("questionnaire_profiles")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error("[v2] profiles GET:", err)
    return NextResponse.json({ error: "Falha ao listar perfis" }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const code = normalizeProfileCode(typeof body.code === "string" ? body.code : "")
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const codeErr = validateProfileCode(code)

    if (codeErr) {
      return NextResponse.json({ error: codeErr }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: "Nome do perfil é obrigatório." }, { status: 400 })
    }

    const sortOrder =
      typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
        ? Math.trunc(body.sort_order)
        : 0

    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("questionnaire_profiles")
      .insert({
        questionnaire_id: questionnaireId,
        code,
        name,
        short_description:
          typeof body.short_description === "string" && body.short_description.trim()
            ? body.short_description.trim()
            : null,
        long_description:
          typeof body.long_description === "string" && body.long_description.trim()
            ? body.long_description.trim()
            : null,
        color: typeof body.color === "string" && body.color.trim() ? body.color.trim() : null,
        icon: typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : null,
        sort_order: sortOrder,
        active: body.active !== false,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Código já existe neste questionário." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] profiles POST:", err)
    return NextResponse.json({ error: "Falha ao criar perfil" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const profileId = typeof body.id === "string" ? body.id : ""
    if (!profileId) {
      return NextResponse.json({ error: "id do perfil é obrigatório." }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.code === "string") {
      const code = normalizeProfileCode(body.code)
      const codeErr = validateProfileCode(code)
      if (codeErr) return NextResponse.json({ error: codeErr }, { status: 400 })
      updates.code = code
    }

    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
      updates.name = name
    }

    if (body.short_description !== undefined) {
      updates.short_description =
        typeof body.short_description === "string" && body.short_description.trim()
          ? body.short_description.trim()
          : null
    }

    if (body.long_description !== undefined) {
      updates.long_description =
        typeof body.long_description === "string" && body.long_description.trim()
          ? body.long_description.trim()
          : null
    }

    if (body.color !== undefined) {
      updates.color =
        typeof body.color === "string" && body.color.trim() ? body.color.trim() : null
    }

    if (body.icon !== undefined) {
      updates.icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : null
    }

    if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
      updates.sort_order = Math.trunc(body.sort_order)
    }

    if (typeof body.active === "boolean") {
      updates.active = body.active
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("questionnaire_profiles")
      .update(updates)
      .eq("id", profileId)
      .eq("questionnaire_id", questionnaireId)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Código já existe neste questionário." }, { status: 409 })
      }
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] profiles PATCH:", err)
    return NextResponse.json({ error: "Falha ao atualizar perfil" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get("profileId")

  if (!profileId) {
    return NextResponse.json({ error: "profileId é obrigatório." }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("questionnaire_profiles")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", profileId)
      .eq("questionnaire_id", questionnaireId)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] profiles DELETE:", err)
    return NextResponse.json({ error: "Falha ao inativar perfil" }, { status: 500 })
  }
}
