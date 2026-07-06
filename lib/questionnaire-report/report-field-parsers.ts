import { REPORT_CONTENT_FALLBACK } from "@/lib/questionnaire-engine/merge-report-content"

export type CompatibilityArea = { name: string; pct: number }
export type RecommendedCourse = {
  name: string
  pct: number
  description: string
  areas: string[]
  idealFor: string
}
export type SalaryRow = { role: string; min: number; max: number; note?: string }

export function isMissingContent(text: string | undefined | null): boolean {
  if (!text) return true
  const t = text.trim()
  return t === "" || t === REPORT_CONTENT_FALLBACK
}

/** Uma linha por item ou JSON array de strings. */
export function parseStringList(raw: string, fallback: string[] = []): string[] {
  if (isMissingContent(raw)) return fallback
  const trimmed = raw.trim()
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v).trim()).filter(Boolean)
      }
    } catch {
      /* fallthrough */
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
}

export function parseCompatibilityAreas(raw: string, fallback: CompatibilityArea[] = []): CompatibilityArea[] {
  if (isMissingContent(raw)) return fallback
  const trimmed = raw.trim()
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map(row => {
            const o = row as { name?: string; pct?: number }
            if (!o?.name) return null
            return { name: o.name, pct: Number(o.pct) || 0 }
          })
          .filter((x): x is CompatibilityArea => x !== null)
      }
    } catch {
      /* fallthrough */
    }
  }
  return fallback
}

export function parseRecommendedCourses(raw: string, fallback: RecommendedCourse[] = []): RecommendedCourse[] {
  if (isMissingContent(raw)) return fallback
  const trimmed = raw.trim()
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map(row => {
            const o = row as Partial<RecommendedCourse> & { areas?: string[] }
            if (!o?.name) return null
            return {
              name: o.name,
              pct: Number(o.pct) || 0,
              description: o.description?.trim() || "",
              areas: Array.isArray(o.areas) ? o.areas.map(String) : [],
              idealFor: o.idealFor?.trim() || "",
            }
          })
          .filter((x): x is RecommendedCourse => x !== null)
      }
    } catch {
      /* fallthrough */
    }
  }
  return fallback
}

export function parseSalaries(raw: string, fallback: SalaryRow[] = []): SalaryRow[] {
  if (isMissingContent(raw)) return fallback
  const trimmed = raw.trim()
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map(row => {
            const o = row as Partial<SalaryRow>
            if (!o?.role) return null
            return {
              role: o.role,
              min: Number(o.min) || 0,
              max: Number(o.max) || 0,
              note: o.note?.trim() || undefined,
            }
          })
          .filter((x): x is SalaryRow => x !== null)
      }
    } catch {
      /* fallthrough */
    }
  }
  return fallback
}

export function parseNumber(raw: string, fallback: number): number {
  if (isMissingContent(raw)) return fallback
  const n = Number(raw.replace(/[^\d.,]/g, "").replace(",", "."))
  return Number.isFinite(n) ? n : fallback
}
