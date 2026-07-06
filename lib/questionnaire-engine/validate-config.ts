import type {
  Alternative,
  AlternativeWeight,
  Question,
  QuestionnaireProfile,
  ValidateQuestionnaireConfigInput,
  ValidateQuestionnaireConfigOutput,
} from "./types"

export function validateQuestionnaireConfig(
  input: ValidateQuestionnaireConfigInput
): ValidateQuestionnaireConfigOutput {
  const errors: string[] = []
  const warnings: string[] = []

  const activeProfiles = input.profiles.filter(p => p.active)
  const activeQuestions = input.questions.filter(q => q.active)
  const profileIds = new Set(activeProfiles.map(p => p.id))
  const profileIdToCode = new Map(activeProfiles.map(p => [p.id, p.code]))

  if (activeProfiles.length < 2) {
    errors.push("É necessário pelo menos 2 perfis ativos.")
  }

  if (activeQuestions.length < 5) {
    errors.push("É necessário pelo menos 5 perguntas ativas.")
  }

  const altsByQuestion = new Map<string, Alternative[]>()
  for (const alt of input.alternatives) {
    if (!alt.active) continue
    const list = altsByQuestion.get(alt.question_id) ?? []
    list.push(alt)
    altsByQuestion.set(alt.question_id, list)
  }

  for (const q of activeQuestions) {
    const alts = altsByQuestion.get(q.id) ?? []
    if (alts.length < 2) {
      errors.push(`Pergunta "${q.text.slice(0, 40)}…" (order ${q.order}) precisa de pelo menos 2 alternativas ativas.`)
    }
  }

  const weightsByAlternative = new Map<string, AlternativeWeight[]>()
  for (const w of input.weights) {
    if (w.weight < 0) {
      errors.push(`Peso negativo na alternativa ${w.alternative_id} para perfil ${w.profile_id}.`)
    }
    if (!profileIds.has(w.profile_id)) {
      errors.push(`Peso referencia perfil inválido ou inativo: ${w.profile_id}.`)
      continue
    }
    const expectedCode = profileIdToCode.get(w.profile_id)
    if (expectedCode && w.profile_code && w.profile_code !== expectedCode) {
      warnings.push(
        `profile_code "${w.profile_code}" diverge do perfil ${w.profile_id} (esperado "${expectedCode}").`
      )
    }
    const list = weightsByAlternative.get(w.alternative_id) ?? []
    list.push(w)
    weightsByAlternative.set(w.alternative_id, list)
  }

  const profileCodesWithPositiveWeight = new Set<string>()

  for (const alt of input.alternatives.filter(a => a.active)) {
    const wList = weightsByAlternative.get(alt.id) ?? []
    const positive = wList.filter(w => w.weight > 0 && profileIds.has(w.profile_id))
    const sumPositive = positive.reduce((s, w) => s + w.weight, 0)

    if (sumPositive <= 0) {
      errors.push(`Alternativa "${alt.text.slice(0, 40)}…" não possui peso maior que zero em nenhum perfil ativo.`)
    }

    for (const w of positive) {
      const code = profileIdToCode.get(w.profile_id)
      if (code) profileCodesWithPositiveWeight.add(code)
    }
  }

  for (const p of activeProfiles) {
    if (!profileCodesWithPositiveWeight.has(p.code)) {
      errors.push(`Perfil "${p.code}" não recebe peso em nenhuma alternativa ativa.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
