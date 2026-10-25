import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import { REPORT_EDITOR_TABS } from "@/lib/questionnaire-platform/report-editor-fields"
import {
  contentKey,
  ensureReportTemplate,
  rowsToEditorMap,
} from "@/lib/questionnaire-platform/report-template-defaults"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const supabase = await createClient()
    const { data: questionnaire, error: qErr } = await supabase
      .from("questionnaires")
      .select("id, name")
      .eq("id", questionnaireId)
      .maybeSingle()

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })
    if (!questionnaire) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })

    const template = await ensureReportTemplate(supabase, questionnaireId, questionnaire.name)

    const { data: sections } = await supabase
      .from("report_sections")
      .select("*")
      .eq("report_template_id", template.id)
      .order("sort_order", { ascending: true })

    const { data: contents, error: cErr } = await supabase
      .from("report_contents")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .eq("active", true)

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

    const { data: profiles } = await supabase
      .from("questionnaire_profiles")
      .select("id, code, name, sort_order")
      .eq("questionnaire_id", questionnaireId)
      .order("sort_order", { ascending: true })

    return NextResponse.json({
      data: {
        template,
        sections: sections ?? [],
        contents: contents ?? [],
        values: rowsToEditorMap(contents ?? []),
        profiles: profiles ?? [],
        tabs: REPORT_EDITOR_TABS,
      },
    })
  } catch (err) {
    console.error("[v2] report-contents GET:", err)
    return NextResponse.json({ error: "Falha ao carregar conteúdos." }, { status: 500 })
  }
}

type SaveItem = {
  section_key: string
  field_key: string
  text: string
  profile_id?: string | null
  secondary_profile_id?: string | null
}

export async function POST(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params

  try {
    const body = await request.json()
    const items = body.items as SaveItem[] | undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Informe items para salvar." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: questionnaire } = await supabase
      .from("questionnaires")
      .select("id")
      .eq("id", questionnaireId)
      .maybeSingle()

    if (!questionnaire) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })

    const rows = items.map(it => ({
      questionnaire_id: questionnaireId,
      section_key: it.section_key.trim(),
      field_key: it.field_key.trim(),
      profile_id: it.profile_id || null,
      secondary_profile_id: it.secondary_profile_id || null,
      content_type: "text",
      content_value: { text: it.text ?? "" },
      active: true,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("report_contents").upsert(rows, {
      onConflict: "questionnaire_id,profile_id,secondary_profile_id,section_key,field_key",
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, saved: rows.length })
  } catch (err) {
    console.error("[v2] report-contents POST:", err)
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 })
  }
}

/** PATCH — alias com mesmo corpo que POST */
export async function PATCH(request: Request, context: RouteContext) {
  return POST(request, context)
}
