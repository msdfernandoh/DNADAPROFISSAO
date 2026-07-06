export type QuestionnaireRow = {
  id: string
  name: string
  slug: string
  description: string | null
  status: "draft" | "published" | "archived"
  version: number
  active: boolean
  scoring_mode: "per_question" | "normalized_sum"
  created_at: string
  updated_at: string
}

export type QuestionnaireProfileRow = {
  id: string
  questionnaire_id: string
  code: string
  name: string
  short_description: string | null
  long_description: string | null
  color: string | null
  icon: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CODE_RE = /^[A-Z0-9_]+$/

export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug é obrigatório."
  if (slug !== slug.toLowerCase()) return "Slug deve estar em lowercase."
  if (/\s/.test(slug)) return "Slug não pode conter espaços."
  if (!SLUG_RE.test(slug)) return "Slug inválido. Use letras minúsculas, números e hífens."
  return null
}

export function normalizeProfileCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
}

export function validateProfileCode(code: string): string | null {
  if (!code) return "Código do perfil é obrigatório."
  if (/\s/.test(code)) return "Código não pode conter espaços."
  if (!CODE_RE.test(code)) return "Código inválido. Use letras maiúsculas, números e underscore."
  return null
}

export function isScoringMode(v: string): v is "per_question" | "normalized_sum" {
  return v === "per_question" || v === "normalized_sum"
}
