import type { SupabaseClient } from "@supabase/supabase-js"
import { DEFAULT_REPORT_SECTIONS } from "@/lib/questionnaire-platform/report-editor-fields"

export async function ensureReportTemplate(
  supabase: SupabaseClient,
  questionnaireId: string,
  questionnaireName: string
) {
  const { data: existing } = await supabase
    .from("report_templates")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from("report_templates")
    .insert({
      questionnaire_id: questionnaireId,
      name: `Relatório — ${questionnaireName}`,
      layout_key: "dna_profissional_v1",
      active: true,
    })
    .select()
    .single()

  if (error) throw error

  const sectionRows = DEFAULT_REPORT_SECTIONS.map(s => ({
    report_template_id: created.id,
    section_key: s.section_key,
    title: s.title,
    sort_order: s.sort_order,
    active: true,
  }))

  await supabase.from("report_sections").insert(sectionRows)
  return created
}

export function contentKey(
  section_key: string,
  field_key: string,
  profile_id: string | null,
  secondary_profile_id: string | null
) {
  return `${profile_id ?? ""}:${secondary_profile_id ?? ""}:${section_key}:${field_key}`
}

export function rowsToEditorMap(
  rows: {
    section_key: string
    field_key: string
    content_value: unknown
    profile_id: string | null
    secondary_profile_id: string | null
  }[]
) {
  const map: Record<string, string> = {}
  for (const r of rows) {
    const key = contentKey(r.section_key, r.field_key, r.profile_id, r.secondary_profile_id)
    const val = r.content_value as { text?: string }
    map[key] = typeof val?.text === "string" ? val.text : ""
  }
  return map
}
