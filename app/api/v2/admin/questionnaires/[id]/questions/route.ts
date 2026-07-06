import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  nextQuestionOrder,
  questionnaireExists,
} from "@/lib/questionnaire-platform/questionnaire-db-helpers"

type RouteContext = { params: Promise<{ id: string }> }

import type {
  AlternativeWeightRow,
  AlternativeWithWeights,
  QuestionWithAlternatives,
} from "@/lib/questionnaire-platform/question-types"

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const { data: profiles, error: pErr } = await supabase
      .from("questionnaire_profiles")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("sort_order", { ascending: true })

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("order", { ascending: true })

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

    const questionIds = (questions ?? []).map(q => q.id)
    let alternatives: { id: string; question_id: string; text: string; order: number; active: boolean }[] =
      []

    if (questionIds.length > 0) {
      const { data: alts, error: aErr } = await supabase
        .from("alternatives")
        .select("*")
        .in("question_id", questionIds)
        .order("order", { ascending: true })
      if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })
      alternatives = alts ?? []
    }

    const altIds = alternatives.map(a => a.id)
    let weights: AlternativeWeightRow[] = []

    if (altIds.length > 0) {
      const { data: wRows, error: wErr } = await supabase
        .from("alternative_weights")
        .select("id, alternative_id, profile_id, weight")
        .in("alternative_id", altIds)
      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })
      weights = wRows ?? []
    }

    const weightsByAlt = new Map<string, AlternativeWeightRow[]>()
    for (const w of weights) {
      const list = weightsByAlt.get(w.alternative_id) ?? []
      list.push(w)
      weightsByAlt.set(w.alternative_id, list)
    }

    const altsByQuestion = new Map<string, AlternativeWithWeights[]>()
    for (const a of alternatives) {
      const list = altsByQuestion.get(a.question_id) ?? []
      list.push({
        ...a,
        weights: weightsByAlt.get(a.id) ?? [],
      })
      altsByQuestion.set(a.question_id, list)
    }

    const tree: QuestionWithAlternatives[] = (questions ?? []).map(q => ({
      ...q,
      alternatives: altsByQuestion.get(q.id) ?? [],
    }))

    return NextResponse.json({
      data: {
        questions: tree,
        profiles: profiles ?? [],
      },
    })
  } catch (err) {
    console.error("[v2] questions GET:", err)
    return NextResponse.json({ error: "Falha ao carregar perguntas" }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const text = typeof body.text === "string" ? body.text.trim() : ""
    if (!text) {
      return NextResponse.json({ error: "Texto da pergunta é obrigatório." }, { status: 400 })
    }

    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const order =
      typeof body.order === "number" && Number.isFinite(body.order)
        ? Math.trunc(body.order)
        : await nextQuestionOrder(supabase, questionnaireId)

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("questions")
      .insert({
        questionnaire_id: questionnaireId,
        text,
        description:
          typeof body.description === "string" && body.description.trim()
            ? body.description.trim()
            : null,
        order,
        type: "single_choice",
        required: body.required !== false,
        active: body.active !== false,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ordem já usada neste questionário." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] questions POST:", err)
    return NextResponse.json({ error: "Falha ao criar pergunta" }, { status: 500 })
  }
}
