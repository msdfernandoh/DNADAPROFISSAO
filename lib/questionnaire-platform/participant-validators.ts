const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "")
}

export function validateParticipantBody(body: Record<string, unknown>): {
  ok: true
  data: {
    questionnaire_id: string
    name: string
    phone: string
    email: string
    city: string | null
    course_interest: string | null
    escolaridade: string
    vendor_slug: string | null
    unit_id: string | null
    seller_id: string | null
    source_link: string | null
  }
} | { ok: false; error: string } {
  const questionnaire_id =
    typeof body.questionnaire_id === "string" ? body.questionnaire_id.trim() : ""
  if (!questionnaire_id) {
    return { ok: false, error: "questionnaire_id é obrigatório." }
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return { ok: false, error: "Nome é obrigatório." }

  const phoneRaw = typeof body.phone === "string" ? body.phone : ""
  const phone = normalizePhone(phoneRaw)
  if (phone.length < 10) return { ok: false, error: "Telefone inválido." }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "E-mail inválido." }

  const escolaridade = typeof body.escolaridade === "string" ? body.escolaridade.trim() : ""
  if (!escolaridade) return { ok: false, error: "Escolaridade é obrigatória." }

  const city =
    typeof body.city === "string" && body.city.trim() ? body.city.trim() : null
  const course_interest =
    typeof body.course_interest === "string" && body.course_interest.trim()
      ? body.course_interest.trim()
      : null
  const vendor_slug =
    typeof body.vendor_slug === "string" && body.vendor_slug.trim()
      ? body.vendor_slug.trim()
      : null

  const unit_id =
    typeof body.unit_id === "string" && body.unit_id.trim() ? body.unit_id.trim() : null
  const seller_id =
    typeof body.seller_id === "string" && body.seller_id.trim() ? body.seller_id.trim() : null
  const source_link =
    typeof body.source_link === "string" && body.source_link.trim() ? body.source_link.trim() : null

  return {
    ok: true,
    data: {
      questionnaire_id,
      name,
      phone: phoneRaw.trim() || phone,
      email,
      city,
      course_interest,
      escolaridade,
      vendor_slug,
      unit_id,
      seller_id,
      source_link,
    },
  }
}

export type AnswerInput = { questionId: string; alternativeId: string }

export function parseAnswersBody(body: unknown): { ok: true; answers: AnswerInput[] } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Corpo inválido." }
  }
  const answers = (body as { answers?: unknown }).answers
  if (!Array.isArray(answers) || answers.length === 0) {
    return { ok: false, error: "Informe ao menos uma resposta." }
  }

  const parsed: AnswerInput[] = []
  for (const item of answers) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Formato de resposta inválido." }
    }
    const questionId =
      typeof (item as AnswerInput).questionId === "string" ? (item as AnswerInput).questionId.trim() : ""
    const alternativeId =
      typeof (item as AnswerInput).alternativeId === "string"
        ? (item as AnswerInput).alternativeId.trim()
        : ""
    if (!questionId || !alternativeId) {
      return { ok: false, error: "Cada resposta precisa de questionId e alternativeId." }
    }
    parsed.push({ questionId, alternativeId })
  }

  return { ok: true, answers: parsed }
}
