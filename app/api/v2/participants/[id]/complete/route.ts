import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { calculateQuestionnaireResult } from "@/lib/questionnaire-engine"
import { loadQuestionnaireBundle } from "@/lib/questionnaire-platform/load-questionnaire-bundle"
import {
  bundleToEngineInput,
  codeToProfileId,
} from "@/lib/questionnaire-platform/public-funnel"

async function consultantWhatsappForVendor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vendorSlug: string | null
): Promise<string | null> {
  if (!vendorSlug) return null
  const { data } = await supabase
    .from("vendors")
    .select("whatsapp, active")
    .eq("slug", vendorSlug)
    .maybeSingle()
  if (!data?.active || !data.whatsapp) return null
  return data.whatsapp
}

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { id: participantId } = await context.params

  try {
    const supabase = await createClient()

    const { data: participant, error: pErr } = await supabase
      .from("participants_v2")
      .select("id, questionnaire_id, quiz_completed, vendor_slug")
      .eq("id", participantId)
      .maybeSingle()

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }
    if (!participant?.questionnaire_id) {
      return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 })
    }

    const questionnaireId = participant.questionnaire_id

    if (participant.quiz_completed) {
      const { data: existing } = await supabase
        .from("questionnaire_results")
        .select("result_code, percentages, main_profile_id, secondary_profile_id")
        .eq("participant_id", participantId)
        .maybeSingle()

      if (existing) {
        const { data: profiles } = await supabase
          .from("questionnaire_profiles")
          .select("id, code")
          .eq("questionnaire_id", questionnaireId)

        const codeById = new Map((profiles ?? []).map(p => [p.id, p.code]))
        const consultantWhatsapp = await consultantWhatsappForVendor(
          supabase,
          participant.vendor_slug
        )
        return NextResponse.json({
          success: true,
          alreadyCompleted: true,
          data: {
            mainProfile: codeById.get(existing.main_profile_id ?? "") ?? "",
            secondaryProfile: codeById.get(existing.secondary_profile_id ?? "") ?? "",
            resultCode: existing.result_code,
            percentages: existing.percentages,
            consultantWhatsapp,
          },
        })
      }
    }

    const { data: questionnaire, error: qMetaErr } = await supabase
      .from("questionnaires")
      .select("id, status, active, scoring_mode")
      .eq("id", questionnaireId)
      .maybeSingle()

    if (qMetaErr) {
      return NextResponse.json({ error: qMetaErr.message }, { status: 500 })
    }
    if (!questionnaire || questionnaire.status !== "published") {
      return NextResponse.json({ error: "Questionário indisponível." }, { status: 403 })
    }

    const { bundle, error: loadErr } = await loadQuestionnaireBundle(supabase, questionnaireId)
    if (loadErr || !bundle) {
      return NextResponse.json({ error: loadErr ?? "Falha ao carregar questionário." }, { status: 500 })
    }

    const requiredQuestions = bundle.questions.filter(q => q.active && q.required)
    const { data: answerRows, error: aErr } = await supabase
      .from("questionnaire_answers")
      .select("question_id, alternative_id")
      .eq("participant_id", participantId)

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 })
    }

    const answers = (answerRows ?? []).map(r => ({
      questionId: r.question_id,
      alternativeId: r.alternative_id,
    }))

    const answeredIds = new Set(answers.map(a => a.questionId))
    const missing = requiredQuestions.filter(q => !answeredIds.has(q.id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Responda todas as perguntas obrigatórias antes de finalizar." },
        { status: 400 }
      )
    }

    const engineInput = bundleToEngineInput(
      bundle.questionnaire,
      bundle.profiles,
      bundle.questions,
      answers
    )

    const result = calculateQuestionnaireResult(engineInput)

    const mainProfileId = codeToProfileId(bundle.profiles, result.mainProfile)
    const secondaryProfileId = codeToProfileId(bundle.profiles, result.secondaryProfile)

    const { error: resErr } = await supabase.from("questionnaire_results").upsert(
      {
        questionnaire_id: questionnaireId,
        participant_id: participantId,
        scores: result.scores,
        percentages: result.percentages,
        main_profile_id: mainProfileId,
        secondary_profile_id: secondaryProfileId,
        result_code: result.resultCode,
      },
      { onConflict: "participant_id" }
    )

    if (resErr) {
      return NextResponse.json({ error: resErr.message }, { status: 500 })
    }

    const now = new Date().toISOString()
    const { error: updErr } = await supabase
      .from("participants_v2")
      .update({
        quiz_completed: true,
        quiz_completed_at: now,
        status: "Teste concluído",
        updated_at: now,
      })
      .eq("id", participantId)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    const consultantWhatsapp = await consultantWhatsappForVendor(supabase, participant.vendor_slug)

    return NextResponse.json({
      success: true,
      data: {
        mainProfile: result.mainProfile,
        secondaryProfile: result.secondaryProfile,
        resultCode: result.resultCode,
        percentages: result.percentages,
        consultantWhatsapp,
      },
    })
  } catch (err) {
    console.error("[v2] complete POST:", err)
    return NextResponse.json({ error: "Falha ao finalizar questionário." }, { status: 500 })
  }
}
