import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateParticipantBody } from "@/lib/questionnaire-platform/participant-validators"
import { CREDIT_LIMIT_MESSAGE, unitHasCreditCapacity } from "@/lib/questionnaire-platform/credits"

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

    let unitId = parsed.data.unit_id
    let sellerId = parsed.data.seller_id

    if (unitId) {
      const { data: unit, error: uErr } = await supabase
        .from("units_v2")
        .select("id, active, monthly_credit_limit, credits_used")
        .eq("id", unitId)
        .maybeSingle()

      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })
      if (!unit || !unit.active) {
        return NextResponse.json({ error: "Unidade inválida." }, { status: 400 })
      }
      if (!unitHasCreditCapacity(unit)) {
        return NextResponse.json({ error: CREDIT_LIMIT_MESSAGE }, { status: 403 })
      }
    }

    if (sellerId) {
      const { data: seller, error: sErr } = await supabase
        .from("sellers_v2")
        .select("id, unit_id, active")
        .eq("id", sellerId)
        .maybeSingle()

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
      if (!seller || !seller.active) {
        return NextResponse.json({ error: "Vendedor inválido." }, { status: 400 })
      }
      if (unitId && seller.unit_id !== unitId) {
        return NextResponse.json({ error: "Vendedor não pertence à unidade." }, { status: 400 })
      }
      if (!unitId) unitId = seller.unit_id
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
        unit_id: unitId,
        seller_id: sellerId,
        source_link: parsed.data.source_link,
        status: "Aguardando teste",
        quiz_completed: false,
      })
      .select("id, questionnaire_id, name, email, quiz_completed, unit_id, seller_id, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error("[v2] participants POST:", err)
    return NextResponse.json({ error: "Falha ao criar participante." }, { status: 500 })
  }
}
