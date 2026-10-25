import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  nextAlternativeOrder,
  questionBelongsToQuestionnaire,
} from "@/lib/questionnaire-platform/questionnaire-db-helpers"

type RouteContext = { params: Promise<{ id: string; questionId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId, questionId } = await context.params

  try {
    const body = await request.json()
    const text = typeof body.text === "string" ? body.text.trim() : ""
    if (!text) {
      return NextResponse.json({ error: "Texto da alternativa é obrigatório." }, { status: 400 })
    }

    const supabase = await createClient()
    if (!(await questionBelongsToQuestionnaire(supabase, questionnaireId, questionId))) {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 })
    }

    const order =
      typeof body.order === "number" && Number.isFinite(body.order)
        ? Math.trunc(body.order)
        : await nextAlternativeOrder(supabase, questionId)

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("alternatives")
      .insert({
        question_id: questionId,
        text,
        order,
        active: body.active !== false,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ordem já usada nesta pergunta." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] alternatives POST:", err)
    return NextResponse.json({ error: "Falha ao criar alternativa" }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId, questionId } = await context.params

  try {
    const body = await request.json()
    const alternativeId = typeof body.id === "string" ? body.id : ""
    if (!alternativeId) {
      return NextResponse.json({ error: "id da alternativa é obrigatório." }, { status: 400 })
    }

    const supabase = await createClient()
    if (!(await questionBelongsToQuestionnaire(supabase, questionnaireId, questionId))) {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 })
    }

    const { data: altCheck } = await supabase
      .from("alternatives")
      .select("id")
      .eq("id", alternativeId)
      .eq("question_id", questionId)
      .maybeSingle()

    if (!altCheck) {
      return NextResponse.json({ error: "Alternativa não encontrada." }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.text === "string") {
      const text = body.text.trim()
      if (!text) return NextResponse.json({ error: "Texto é obrigatório." }, { status: 400 })
      updates.text = text
    }

    if (typeof body.order === "number" && Number.isFinite(body.order)) {
      updates.order = Math.trunc(body.order)
    }

    if (typeof body.active === "boolean") updates.active = body.active

    const { data, error } = await supabase
      .from("alternatives")
      .update(updates)
      .eq("id", alternativeId)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ordem já usada." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] alternatives PATCH:", err)
    return NextResponse.json({ error: "Falha ao atualizar alternativa" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId, questionId } = await context.params
  const alternativeId = new URL(request.url).searchParams.get("alternativeId")

  if (!alternativeId) {
    return NextResponse.json({ error: "alternativeId é obrigatório." }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    if (!(await questionBelongsToQuestionnaire(supabase, questionnaireId, questionId))) {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("alternatives")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", alternativeId)
      .eq("question_id", questionId)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Alternativa não encontrada." }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] alternatives DELETE:", err)
    return NextResponse.json({ error: "Falha ao inativar alternativa" }, { status: 500 })
  }
}
