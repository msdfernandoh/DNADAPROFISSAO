export const REPORT_CONTENT_FALLBACK = "Conteúdo não configurado"

export type ReportContentRow = {
  section_key: string
  field_key: string
  content_type: string
  content_value: unknown
  profile_id: string | null
  secondary_profile_id: string | null
  active: boolean
}

export type MergedReportFields = Record<string, string>

export function contentValueToText(contentType: string, contentValue: unknown): string {
  if (contentValue == null) return ""
  if (typeof contentValue === "string") return contentValue.trim()
  if (typeof contentValue === "number" || typeof contentValue === "boolean") {
    return String(contentValue)
  }
  if (Array.isArray(contentValue)) {
    return contentValue.map(v => contentValueToText("text", v)).filter(Boolean).join("\n")
  }
  if (typeof contentValue === "object") {
    const o = contentValue as Record<string, unknown>
    if (typeof o.text === "string") return o.text.trim()
    if (typeof o.html === "string") {
      return o.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    }
    if (Array.isArray(o.items)) {
      return o.items.map(v => contentValueToText("text", v)).filter(Boolean).join("\n")
    }
    if (contentType === "json") {
      try {
        return JSON.stringify(o, null, 2)
      } catch {
        return ""
      }
    }
  }
  return ""
}

function rowApplies(
  row: ReportContentRow,
  mainProfileId: string | null,
  secondaryProfileId: string | null
): boolean {
  if (!row.active) return false
  const isGlobal = !row.profile_id && !row.secondary_profile_id
  if (isGlobal) return true
  if (row.profile_id && row.secondary_profile_id) {
    return (
      row.profile_id === mainProfileId && row.secondary_profile_id === secondaryProfileId
    )
  }
  if (row.profile_id && !row.secondary_profile_id) {
    if (row.profile_id === mainProfileId) return true
    if (
      secondaryProfileId &&
      row.profile_id === secondaryProfileId &&
      row.section_key === "profile_secondary"
    ) {
      return true
    }
  }
  return false
}

function priority(
  row: ReportContentRow,
  mainProfileId: string | null,
  secondaryProfileId: string | null
): number {
  if (row.profile_id && row.secondary_profile_id) return 3
  if (
    row.profile_id &&
    (row.profile_id === mainProfileId ||
      (row.section_key === "profile_secondary" && row.profile_id === secondaryProfileId))
  ) {
    return 2
  }
  if (!row.profile_id && !row.secondary_profile_id) return 1
  return 0
}

export function mergeReportContents(
  rows: ReportContentRow[],
  mainProfileId: string | null,
  secondaryProfileId: string | null
): { fields: MergedReportFields; warnings: string[] } {
  const warnings: string[] = []
  const byKey = new Map<string, ReportContentRow>()

  for (const row of rows) {
    if (!rowApplies(row, mainProfileId, secondaryProfileId)) continue
    const key = `${row.section_key}::${row.field_key}`
    const existing = byKey.get(key)
    if (!existing || priority(row, mainProfileId, secondaryProfileId) > priority(existing, mainProfileId, secondaryProfileId)) {
      byKey.set(key, row)
    }
  }

  const fields: MergedReportFields = {}
  for (const row of byKey.values()) {
    const fullKey = `${row.section_key}.${row.field_key}`
    const text = contentValueToText(row.content_type, row.content_value)
    fields[fullKey] = text || REPORT_CONTENT_FALLBACK
    if (!text) {
      warnings.push(`Campo vazio: ${fullKey}`)
    }
  }

  return { fields, warnings }
}

export function getField(
  fields: MergedReportFields,
  sectionKey: string,
  fieldKey: string,
  fallback = REPORT_CONTENT_FALLBACK
): string {
  return fields[`${sectionKey}.${fieldKey}`]?.trim() || fallback
}
