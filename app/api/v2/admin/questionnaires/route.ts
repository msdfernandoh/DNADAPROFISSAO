import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  isScoringMode,
  normalizeSlug,
  validateSlug,
  type QuestionnaireRow,
} from "@/lib/questionnaire-platform/validators"

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("questionnaires")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v2] questionnaires list:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data as QuestionnaireRow[] })
  } catch (err) {
    console.error("[v2] questionnaires GET:", err)
    return NextResponse.json({ error: "Falha ao listar questionários" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const slugRaw = typeof body.slug === "string" ? body.slug : ""
    const slug = normalizeSlug(slugRaw)
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null
    const scoringMode = typeof body.scoring_mode === "string" ? body.scoring_mode : "per_question"
    const active = body.active !== false

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
    }

    const slugErr = validateSlug(slug)
    if (slugErr) {
      return NextResponse.json({ error: slugErr }, { status: 400 })
    }

    if (!isScoringMode(scoringMode)) {
      return NextResponse.json({ error: "Scoring mode inválido." }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("questionnaires")
      .insert({
        name,
        slug,
        description,
        status: "draft",
        version: 1,
        active,
        scoring_mode: scoringMode,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 })
      }
      console.error("[v2] questionnaires insert:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] questionnaires POST:", err)
    return NextResponse.json({ error: "Falha ao criar questionário" }, { status: 500 })
  }
}
