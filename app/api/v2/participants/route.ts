import { createServiceClient as createClient } from "@/lib/supabase/service"
import { setParticipantSession } from "@/lib/security/participant-session"
import { NextResponse } from "next/server"
import { validateParticipantBody } from "@/lib/questionnaire-platform/participant-validators"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = validateParticipantBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: questionnaire, error: qErr } = await supabase
      .from("questionnaires")
      .select("id, status, active")
      .eq("id", parsed.data.questionnaire_id)
      .maybeSingle()

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 })
    }
    if (!questionnaire) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }
    if (questionnaire.status !== "published" || !questionnaire.active) {
      return NextResponse.json(
        { error: "Questionário não está disponível para novos participantes." },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("participants_v2")
      .insert({
        questionnaire_id: parsed.data.questionnaire_id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        city: parsed.data.city,
        course_interest: parsed.data.course_interest,
        escolaridade: parsed.data.escolaridade,
        vendor_slug: parsed.data.vendor_slug,
        unit_id: parsed.data.unit_id,
        seller_id: parsed.data.seller_id,
        source_link: parsed.data.source_link,
        status: "Aguardando teste",
        quiz_completed: false,
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await setParticipantSession(data.id, "v2")
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error("[v2] participants POST:", err)
    return NextResponse.json({ error: "Falha ao criar participante." }, { status: 500 })
  }
}
