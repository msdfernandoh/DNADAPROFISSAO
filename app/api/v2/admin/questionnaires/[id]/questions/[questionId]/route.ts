import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  questionBelongsToQuestionnaire,
  questionnaireExists,
} from "@/lib/questionnaire-platform/questionnaire-db-helpers"

type RouteContext = { params: Promise<{ id: string; questionId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId, questionId } = await context.params

  try {
    const supabase = await createClient()
    if (!(await questionBelongsToQuestionnaire(supabase, questionnaireId, questionId))) {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.text === "string") {
      const text = body.text.trim()
      if (!text) return NextResponse.json({ error: "Texto é obrigatório." }, { status: 400 })
      updates.text = text
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null
    }

    if (typeof body.order === "number" && Number.isFinite(body.order)) {
      updates.order = Math.trunc(body.order)
    }

    if (typeof body.required === "boolean") updates.required = body.required
    if (typeof body.active === "boolean") updates.active = body.active

    const { data, error } = await supabase
      .from("questions")
      .update(updates)
      .eq("id", questionId)
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
    console.error("[v2] question PATCH:", err)
    return NextResponse.json({ error: "Falha ao atualizar pergunta" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId, questionId } = await context.params

  try {
    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }
    if (!(await questionBelongsToQuestionnaire(supabase, questionnaireId, questionId))) {
      return NextResponse.json({ error: "Pergunta não encontrada." }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("questions")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", questionId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] question DELETE:", err)
    return NextResponse.json({ error: "Falha ao inativar pergunta" }, { status: 500 })
  }
}
