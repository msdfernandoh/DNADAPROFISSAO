import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"
import { buildReportPreviewProps } from "@/lib/questionnaire-engine/build-report-preview-props"
import { ensureReportTemplate } from "@/lib/questionnaire-platform/report-template-defaults"
import type { ReportContentRow } from "@/lib/questionnaire-engine/merge-report-content"

type RouteContext = { params: Promise<{ id: string }> }

function parsePercentages(raw: string | null, profileCodes: string[]): Record<string, number> {
  if (raw) {
    try {
      const o = JSON.parse(raw) as Record<string, number>
      if (o && typeof o === "object") return o
    } catch {
      /* fallthrough */
    }
  }
  const n = profileCodes.length
  if (n === 0) return {}
  const base = Math.floor(100 / n)
  const out: Record<string, number> = {}
  profileCodes.forEach((c, i) => {
    out[c] = i === 0 ? 100 - base * (n - 1) : base
  })
  return out
}

export async function GET(request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id: questionnaireId } = await context.params
  const { searchParams } = new URL(request.url)
  const mainCode = searchParams.get("main")?.trim()
  const secondaryCode = searchParams.get("secondary")?.trim()
  const participantName = searchParams.get("name")?.trim() || "Participante Preview"
  const pctParam = searchParams.get("percentages")

  try {
    const supabase = await createClient()
    const { data: questionnaire, error: qErr } = await supabase
      .from("questionnaires")
      .select("id, name, slug")
      .eq("id", questionnaireId)
      .maybeSingle()

    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })
    if (!questionnaire) return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })

    const { data: profiles } = await supabase
      .from("questionnaire_profiles")
      .select("id, code, name, color, short_description, sort_order")
      .eq("questionnaire_id", questionnaireId)
      .eq("active", true)
      .order("sort_order", { ascending: true })

    const list = profiles ?? []
    if (list.length < 2) {
      return NextResponse.json({ error: "Cadastre pelo menos 2 perfis ativos." }, { status: 400 })
    }

    const mainRow = list.find(p => p.code === mainCode) ?? list[0]
    const secRow =
      list.find(p => p.code === secondaryCode && p.id !== mainRow.id) ??
      list.find(p => p.id !== mainRow.id) ??
      list[1]

    const template = await ensureReportTemplate(supabase, questionnaireId, questionnaire.name)

    const { data: sections } = await supabase
      .from("report_sections")
      .select("section_key, title, sort_order")
      .eq("report_template_id", template.id)
      .eq("active", true)
      .order("sort_order", { ascending: true })

    const { data: contentRows, error: cErr } = await supabase
      .from("report_contents")
      .select("section_key, field_key, content_type, content_value, profile_id, secondary_profile_id, active")
      .eq("questionnaire_id", questionnaireId)
      .eq("active", true)

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

    const percentages = parsePercentages(
      pctParam,
      list.map(p => p.code)
    )

    const props = buildReportPreviewProps({
      questionnaire,
      template,
      sectionDefs: sections ?? [],
      contentRows: (contentRows ?? []) as ReportContentRow[],
      profiles: list,
      mainProfileId: mainRow.id,
      secondaryProfileId: secRow.id,
      participantName,
      percentages,
    })

    return NextResponse.json({ data: props })
  } catch (err) {
    console.error("[v2] report-preview GET:", err)
    return NextResponse.json({ error: "Falha ao montar preview." }, { status: 500 })
  }
}
