import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import { loadQuestionnaireBundle } from "@/lib/questionnaire-platform/load-questionnaire-bundle"
import { runPublishChecklist } from "@/lib/questionnaire-engine/publish-checklist"

type RouteContext = { params: Promise<{ id: string }> }

async function getChecklistForId(id: string) {
  const supabase = await createClient()
  const { bundle, error } = await loadQuestionnaireBundle(supabase, id)
  if (error || !bundle) {
    return { httpStatus: 404 as const, body: { error: error ?? "Questionário não encontrado." } }
  }

  const checklist = runPublishChecklist({
    questionnaire: bundle.questionnaire,
    profiles: bundle.profiles,
    questions: bundle.questions,
  })

  return {
    httpStatus: 200 as const,
    body: {
      data: checklist,
      questionnaire: {
        id: bundle.questionnaire.id,
        status: bundle.questionnaire.status,
        version: bundle.questionnaire.version,
      },
    },
  }
}

/** Verificar publicação (dry-run) */
export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id } = await context.params

  try {
    const result = await getChecklistForId(id)
    if (result.httpStatus === 404) {
      return NextResponse.json(result.body, { status: 404 })
    }
    return NextResponse.json(result.body)
  } catch (err) {
    console.error("[v2] publish GET:", err)
    return NextResponse.json({ error: "Falha ao verificar publicação" }, { status: 500 })
  }
}

/** Publicar questionário (checklist bloqueante) */
export async function POST(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { bundle, error } = await loadQuestionnaireBundle(supabase, id)
    if (error || !bundle) {
      return NextResponse.json({ error: error ?? "Questionário não encontrado." }, { status: 404 })
    }

    const checklist = runPublishChecklist({
      questionnaire: bundle.questionnaire,
      profiles: bundle.profiles,
      questions: bundle.questions,
    })

    if (!checklist.canPublish) {
      return NextResponse.json(
        {
          error: "Questionário não atende aos requisitos para publicação.",
          errors: checklist.errors,
          warnings: checklist.warnings,
          data: checklist,
        },
        { status: 400 }
      )
    }

    const nextVersion = bundle.questionnaire.version + 1

    const { data, error: updErr } = await supabase
      .from("questionnaires")
      .update({
        status: "published",
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      warnings: checklist.warnings,
      checklist,
    })
  } catch (err) {
    console.error("[v2] publish POST:", err)
    return NextResponse.json({ error: "Falha ao publicar questionário" }, { status: 500 })
  }
}
