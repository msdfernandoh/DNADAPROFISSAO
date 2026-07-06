import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  isScoringMode,
  normalizeSlug,
  validateSlug,
} from "@/lib/questionnaire-platform/validators"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("questionnaires").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error("[v2] questionnaire GET:", err)
    return NextResponse.json({ error: "Falha ao buscar questionário" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id } = await context.params

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
      }
      updates.name = name
    }

    if (typeof body.slug === "string") {
      const slug = normalizeSlug(body.slug)
      const slugErr = validateSlug(slug)
      if (slugErr) {
        return NextResponse.json({ error: slugErr }, { status: 400 })
      }
      updates.slug = slug
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null
    }

    if (typeof body.scoring_mode === "string") {
      if (!isScoringMode(body.scoring_mode)) {
        return NextResponse.json({ error: "Scoring mode inválido." }, { status: 400 })
      }
      updates.scoring_mode = body.scoring_mode
    }

    if (typeof body.active === "boolean") {
      updates.active = body.active
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("questionnaires")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 })
      }
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] questionnaire PATCH:", err)
    return NextResponse.json({ error: "Falha ao atualizar questionário" }, { status: 500 })
  }
}
