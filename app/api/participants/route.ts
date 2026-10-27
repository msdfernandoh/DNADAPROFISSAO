import { createServiceClient as createClient } from "@/lib/supabase/service"
import { setParticipantSession, ownsParticipant } from "@/lib/security/participant-session"
import { NextResponse } from "next/server"
import { smallJson } from "@/lib/saas/http"

// POST: cria registro inicial assim que o formulário é preenchido
// (antes do quiz começar) - status "Aguardando teste"
export async function POST(request: Request) {
  try {
    const body = await smallJson(request, 8192)
    if (!body || Object.keys(body).some(key => ![
      "name", "phone", "email", "city", "course_interest", "escolaridade",
      "tipo_questionario", "vendor_slug",
    ].includes(key))) {
      return NextResponse.json({ error: "Dados de cadastro inválidos" }, { status: 400 })
    }
    const { name, phone, email, city, course_interest, escolaridade, tipo_questionario, vendor_slug } =
      body

    if (![name, phone, email].every(value => typeof value === "string" && value.trim() && value.length <= 250)
      || [city, course_interest, escolaridade, vendor_slug].some(value => value != null && (typeof value !== "string" || value.length > 500))) {
      return NextResponse.json(
        { error: "name, phone e email são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const tipo =
      tipo_questionario === "rapido" || tipo_questionario === "completo"
        ? tipo_questionario
        : "completo"

    const insertPayload: Record<string, unknown> = {
      name,
      phone,
      email,
      city: city || null,
      course_interest: course_interest || null,
      escolaridade: escolaridade || null,
      tipo_questionario: tipo,
      vendor_slug: vendor_slug || null,
      status: "Aguardando teste",
      quiz_completed: false,
    }

    const { data, error } = await supabase
      .from("participants")
      .insert(insertPayload)
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await setParticipantSession(data.id, "v1")
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v0] API POST error:", err)
    return NextResponse.json({ error: "Falha ao registrar participante" }, { status: 500 })
  }
}

// PATCH: atualiza o registro existente com o resultado do quiz
// (chamado quando o usuário conclui as 24 perguntas)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, primary_profile, secondary_profile, percentages, tipo_questionario } = body

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    if (!(await ownsParticipant(id, "v1"))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = {
      primary_profile,
      secondary_profile,
      percentages,
      quiz_completed: true,
      quiz_completed_at: new Date().toISOString(),
      status: "Novo",
    }
    if (tipo_questionario === "rapido" || tipo_questionario === "completo") {
      updatePayload.tipo_questionario = tipo_questionario
    }

    const { data, error } = await supabase
      .from("participants")
      .update(updatePayload)
      .eq("id", id)
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Supabase update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v0] API PATCH error:", err)
    return NextResponse.json({ error: "Falha ao atualizar resultado" }, { status: 500 })
  }
}
