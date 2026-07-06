import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { loadQuestionnaireBundle } from "@/lib/questionnaire-platform/load-questionnaire-bundle"
import {
  buildPublicQuestionnairePayload,
  publicPayloadHasNoWeights,
} from "@/lib/questionnaire-platform/public-funnel"

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  const normalized = slug.trim().toLowerCase()

  try {
    const supabase = await createClient()
    const { data: questionnaire, error } = await supabase
      .from("questionnaires")
      .select("id, name, slug, description, status, active")
      .eq("slug", normalized)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!questionnaire || questionnaire.status !== "published" || !questionnaire.active) {
      return NextResponse.json(
        { error: "Questionário não encontrado ou indisponível." },
        { status: 404 }
      )
    }

    const { bundle, error: loadErr } = await loadQuestionnaireBundle(supabase, questionnaire.id)
    if (loadErr || !bundle) {
      return NextResponse.json({ error: loadErr ?? "Falha ao carregar." }, { status: 500 })
    }

    const payload = buildPublicQuestionnairePayload(bundle.questionnaire, bundle.questions)

    if (!publicPayloadHasNoWeights(payload)) {
      console.error("[v2] public questionnaire leaked weights", normalized)
      return NextResponse.json({ error: "Erro interno." }, { status: 500 })
    }

    if (payload.questions.length === 0) {
      return NextResponse.json(
        { error: "Questionário sem perguntas disponíveis." },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: payload })
  } catch (err) {
    console.error("[v2] public questionnaire GET:", err)
    return NextResponse.json({ error: "Falha ao buscar questionário." }, { status: 500 })
  }
}
