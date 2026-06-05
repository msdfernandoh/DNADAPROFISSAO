import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST: cria registro inicial assim que o formulário é preenchido
// (antes do quiz começar) - status "Aguardando teste"
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email, city, course_interest } = body

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: "name, phone e email são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("participants")
      .insert({
        name,
        phone,
        email,
        city: city || null,
        course_interest: course_interest || null,
        status: "Aguardando teste",
        quiz_completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
    const { id, primary_profile, secondary_profile, percentages } = body

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("participants")
      .update({
        primary_profile,
        secondary_profile,
        percentages,
        quiz_completed: true,
        quiz_completed_at: new Date().toISOString(),
        status: "Novo",
      })
      .eq("id", id)
      .select()
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
