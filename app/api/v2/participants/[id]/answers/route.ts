import { createServiceClient as createClient } from "@/lib/supabase/service"
import { ownsParticipant } from "@/lib/security/participant-session"
import { NextResponse } from "next/server"
import { parseAnswersBody } from "@/lib/questionnaire-platform/participant-validators"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id: participantId } = await context.params

  try {
    const body = await request.json()
    const parsed = parseAnswersBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    if (!(await ownsParticipant(participantId, "v2"))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    const supabase = await createClient()

    const { data: participant, error: pErr } = await supabase
      .from("participants_v2")
      .select("id, questionnaire_id, quiz_completed")
      .eq("id", participantId)
      .maybeSingle()

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 })
    }
    if (!participant?.questionnaire_id) {
      return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 })
    }
    if (participant.quiz_completed) {
      return NextResponse.json({ error: "Questionário já finalizado." }, { status: 409 })
    }

    const questionnaireId = participant.questionnaire_id

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id")
      .eq("questionnaire_id", questionnaireId)

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 })
    }

    const questionIds = new Set((questions ?? []).map(q => q.id))
    const answerQuestionIds = [...new Set(parsed.answers.map(a => a.questionId))]

    for (const qid of answerQuestionIds) {
      if (!questionIds.has(qid)) {
        return NextResponse.json(
          { error: "Pergunta não pertence a este questionário." },
          { status: 400 }
        )
      }
    }

    const { data: alts, error: aErr } = await supabase
      .from("alternatives")
      .select("id, question_id")
      .in("question_id", [...questionIds])

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 })
    }

    const altToQuestion = new Map((alts ?? []).map(a => [a.id, a.question_id]))

    const rows: {
      questionnaire_id: string
      participant_id: string
      question_id: string
      alternative_id: string
    }[] = []

    for (const ans of parsed.answers) {
      const qForAlt = altToQuestion.get(ans.alternativeId)
      if (!qForAlt) {
        return NextResponse.json({ error: "Alternativa inválida." }, { status: 400 })
      }
      if (qForAlt !== ans.questionId) {
        return NextResponse.json(
          { error: "Alternativa não corresponde à pergunta." },
          { status: 400 }
        )
      }
      rows.push({
        questionnaire_id: questionnaireId,
        participant_id: participantId,
        question_id: ans.questionId,
        alternative_id: ans.alternativeId,
      })
    }

    const { error: insErr } = await supabase.from("questionnaire_answers").upsert(rows, {
      onConflict: "participant_id,question_id",
    })

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved: rows.length })
  } catch (err) {
    console.error("[v2] answers POST:", err)
    return NextResponse.json({ error: "Falha ao salvar respostas." }, { status: 500 })
  }
}
