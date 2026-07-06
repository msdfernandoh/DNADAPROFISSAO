import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAccess, isSuperAdmin, type AdminAccessContext } from "@/lib/questionnaire-platform/auth-v2"
import {
  buildRankingFromResult,
  type LeadDetail,
  type LeadListItem,
  type LeadResultSummary,
} from "@/lib/questionnaire-platform/lead-types"

type RouteContext = { params: Promise<{ id: string }> }

function canAccessParticipant(
  ctx: AdminAccessContext,
  row: { unit_id?: string | null; seller_id?: string | null }
) {
  if (isSuperAdmin(ctx)) return true
  if (ctx.role === "city_admin") return !!ctx.unitId && row.unit_id === ctx.unitId
  if (ctx.role === "seller") return !!ctx.sellerId && row.seller_id === ctx.sellerId
  return false
}

async function loadProfileMaps(supabase: Awaited<ReturnType<typeof createClient>>, questionnaireId: string) {
  const { data: profiles } = await supabase
    .from("questionnaire_profiles")
    .select("id, code, name, sort_order")
    .eq("questionnaire_id", questionnaireId)

  const idToCode = new Map<string, string>()
  const meta: { code: string; sort_order: number }[] = []
  for (const p of profiles ?? []) {
    idToCode.set(p.id, p.code)
    meta.push({ code: p.code, sort_order: p.sort_order })
  }
  meta.sort((a, b) => a.sort_order - b.sort_order)
  return { idToCode, meta }
}

function mapResultRow(
  row: {
    scores: Record<string, number>
    percentages: Record<string, number>
    main_profile_id: string | null
    secondary_profile_id: string | null
    result_code: string | null
  } | null,
  idToCode: Map<string, string>,
  profileMeta: { code: string; sort_order: number }[]
): LeadResultSummary | null {
  if (!row) return null
  const scores = row.scores ?? {}
  const percentages = row.percentages ?? {}
  const main_profile = row.main_profile_id ? idToCode.get(row.main_profile_id) ?? null : null
  const secondary_profile = row.secondary_profile_id
    ? idToCode.get(row.secondary_profile_id) ?? null
    : null

  return {
    scores,
    percentages,
    main_profile,
    secondary_profile,
    result_code: row.result_code,
    ranking: buildRankingFromResult(scores, percentages, profileMeta),
  }
}

function mapParticipant(
  p: {
    id: string
    name: string
    phone: string
    email: string
    city: string | null
    course_interest: string | null
    escolaridade: string | null
    status: string
    notes: string | null
    quiz_completed: boolean
    quiz_completed_at: string | null
    created_at: string
    vendor_slug: string | null
  },
  result: LeadResultSummary | null
): LeadListItem {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    city: p.city,
    course_interest: p.course_interest,
    escolaridade: p.escolaridade,
    status: p.status,
    notes: p.notes,
    quiz_completed: p.quiz_completed,
    quiz_completed_at: p.quiz_completed_at,
    created_at: p.created_at,
    vendor_slug: p.vendor_slug,
    result,
  }
}

async function loadAnswersForParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  participantId: string,
  questionnaireId: string
) {
  const { data: answerRows, error } = await supabase
    .from("questionnaire_answers")
    .select("question_id, alternative_id")
    .eq("participant_id", participantId)
    .eq("questionnaire_id", questionnaireId)

  if (error || !answerRows?.length) return []

  const questionIds = [...new Set(answerRows.map(a => a.question_id))]
  const altIds = [...new Set(answerRows.map(a => a.alternative_id))]

  const [{ data: questions }, { data: alts }] = await Promise.all([
    supabase.from("questions").select("id, text, order").in("id", questionIds),
    supabase.from("alternatives").select("id, text").in("id", altIds),
  ])

  const qMap = new Map((questions ?? []).map(q => [q.id, q]))
  const aMap = new Map((alts ?? []).map(a => [a.id, a]))

  return answerRows
    .map(a => {
      const q = qMap.get(a.question_id)
      const alt = aMap.get(a.alternative_id)
      return {
        question_id: a.question_id,
        question_text: q?.text ?? "—",
        question_order: q?.order ?? 0,
        alternative_id: a.alternative_id,
        alternative_text: alt?.text ?? "—",
      }
    })
    .sort((x, y) => x.question_order - y.question_order)
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminAccess("seller")
  if (auth instanceof NextResponse) return auth
  const { ctx } = auth

  const { id: questionnaireId } = await context.params
  const { searchParams } = new URL(request.url)
  const participantId = searchParams.get("participantId")?.trim()

  try {
    const supabase = await createClient()

    const { data: questionnaire, error: qErr } = await supabase
      .from("questionnaires")
      .select("id, name")
      .eq("id", questionnaireId)
      .maybeSingle()

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })
    if (!questionnaire) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const { idToCode, meta: profileMeta } = await loadProfileMaps(supabase, questionnaireId)

    if (participantId) {
      const { data: p, error: pErr } = await supabase
        .from("participants_v2")
        .select("*")
        .eq("id", participantId)
        .eq("questionnaire_id", questionnaireId)
        .maybeSingle()

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
      if (!p) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 })
      if (!canAccessParticipant(ctx, p)) {
        return NextResponse.json({ error: "Sem permissão para este lead." }, { status: 403 })
      }

      const { data: resRow } = await supabase
        .from("questionnaire_results")
        .select("scores, percentages, main_profile_id, secondary_profile_id, result_code")
        .eq("participant_id", participantId)
        .maybeSingle()

      const result = mapResultRow(resRow, idToCode, profileMeta)
      const answers = await loadAnswersForParticipant(supabase, participantId, questionnaireId)

      const detail: LeadDetail = {
        ...mapParticipant(p, result),
        answers,
      }

      return NextResponse.json({ data: detail, questionnaire })
    }

    let listQuery = supabase
      .from("participants_v2")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("created_at", { ascending: false })

    if (!isSuperAdmin(ctx)) {
      if (ctx.role === "city_admin" && ctx.unitId) {
        listQuery = listQuery.eq("unit_id", ctx.unitId)
      } else if (ctx.role === "seller" && ctx.sellerId) {
        listQuery = listQuery.eq("seller_id", ctx.sellerId)
      } else {
        return NextResponse.json({ data: [], questionnaire, filters: { statuses: [], mainProfiles: [] } })
      }
    }

    const { data: participants, error: listErr } = await listQuery

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 })
    }

    const ids = (participants ?? []).map(p => p.id)
    let resultsByParticipant = new Map<string, LeadResultSummary | null>()

    if (ids.length > 0) {
      const { data: results, error: rErr } = await supabase
        .from("questionnaire_results")
        .select("participant_id, scores, percentages, main_profile_id, secondary_profile_id, result_code")
        .in("participant_id", ids)

      if (rErr) {
        return NextResponse.json({ error: rErr.message }, { status: 500 })
      }

      for (const row of results ?? []) {
        resultsByParticipant.set(
          row.participant_id,
          mapResultRow(row, idToCode, profileMeta)
        )
      }
    }

    const mainProfiles = [...new Set(profileMeta.map(p => p.code))]

    const data: LeadListItem[] = (participants ?? []).map(p =>
      mapParticipant(p, resultsByParticipant.get(p.id) ?? null)
    )

    return NextResponse.json({
      data,
      questionnaire,
      filters: {
        statuses: [...new Set(data.map(d => d.status))].sort(),
        mainProfiles,
      },
    })
  } catch (err) {
    console.error("[v2] participants GET:", err)
    return NextResponse.json({ error: "Falha ao listar leads." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminAccess("seller")
  if (auth instanceof NextResponse) return auth
  const { ctx } = auth

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const participantId = typeof body.id === "string" ? body.id.trim() : ""
    if (!participantId) {
      return NextResponse.json({ error: "id do participante é obrigatório." }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.status === "string" && body.status.trim()) {
      updates.status = body.status.trim()
    }
    if (body.notes !== undefined) {
      updates.notes =
        typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: "Informe status ou notes para atualizar." }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from("participants_v2")
      .select("id, unit_id, seller_id")
      .eq("id", participantId)
      .eq("questionnaire_id", questionnaireId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: "Lead não encontrado neste questionário." }, { status: 404 })
    }
    if (!canAccessParticipant(ctx, existing)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("participants_v2")
      .update(updates)
      .eq("id", participantId)
      .eq("questionnaire_id", questionnaireId)
      .select("id, status, notes, updated_at")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Lead não encontrado neste questionário." }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] participants PATCH:", err)
    return NextResponse.json({ error: "Falha ao atualizar lead." }, { status: 500 })
  }
}
