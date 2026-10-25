import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import {
  alternativeBelongsToQuestionnaireSafe,
  parseWeight,
  profileBelongsToQuestionnaire,
  questionnaireExists,
} from "@/lib/questionnaire-platform/questionnaire-db-helpers"

type RouteContext = { params: Promise<{ id: string }> }

type WeightInput = {
  alternative_id: string
  profile_id: string
  weight: number
}

export async function PATCH(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const items: WeightInput[] = Array.isArray(body.weights) ? body.weights : []

    if (items.length === 0) {
      return NextResponse.json({ error: "Informe ao menos um peso em weights." }, { status: 400 })
    }

    const supabase = await createClient()
    if (!(await questionnaireExists(supabase, questionnaireId))) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    const { data: profiles } = await supabase
      .from("questionnaire_profiles")
      .select("id, code, active")
      .eq("questionnaire_id", questionnaireId)

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

    const rows: { alternative_id: string; profile_id: string; weight: number }[] = []

    for (const item of items) {
      if (typeof item.alternative_id !== "string" || typeof item.profile_id !== "string") {
        return NextResponse.json({ error: "alternative_id e profile_id são obrigatórios." }, { status: 400 })
      }

      const weight = parseWeight(item.weight)
      if (weight === null) {
        return NextResponse.json(
          { error: "Peso inválido. Use inteiro entre 0 e 5." },
          { status: 400 }
        )
      }

      const profile = profileMap.get(item.profile_id)
      if (!profile || !profile.active) {
        return NextResponse.json({ error: `Perfil inválido ou inativo: ${item.profile_id}` }, { status: 400 })
      }

      if (!(await profileBelongsToQuestionnaire(supabase, questionnaireId, item.profile_id))) {
        return NextResponse.json({ error: "Perfil não pertence ao questionário." }, { status: 400 })
      }

      if (!(await alternativeBelongsToQuestionnaireSafe(supabase, questionnaireId, item.alternative_id))) {
        return NextResponse.json({ error: "Alternativa não pertence ao questionário." }, { status: 400 })
      }

      rows.push({
        alternative_id: item.alternative_id,
        profile_id: item.profile_id,
        weight,
      })
    }

    const { data, error } = await supabase
      .from("alternative_weights")
      .upsert(rows, { onConflict: "alternative_id,profile_id" })
      .select()

    if (error) {
      console.error("[v2] weights upsert:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, count: data?.length ?? 0 })
  } catch (err) {
    console.error("[v2] weights PATCH:", err)
    return NextResponse.json({ error: "Falha ao salvar pesos" }, { status: 500 })
  }
}
