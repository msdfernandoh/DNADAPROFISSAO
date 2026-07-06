import { calculateQuestionnaireResult } from "./calculate-result"
import { validateQuestionnaireConfig } from "./validate-config"
import type { ScoringMode } from "./types"
import type { QuestionWithAlternatives } from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow, QuestionnaireRow } from "@/lib/questionnaire-platform/validators"
import { validateSlug } from "@/lib/questionnaire-platform/validators"

export type ChecklistItemStatus = "ok" | "error" | "warning"

export type PublishChecklistItem = {
  key: string
  label: string
  status: ChecklistItemStatus
  detail?: string
}

export type PublishChecklistResult = {
  canPublish: boolean
  errors: string[]
  warnings: string[]
  items: PublishChecklistItem[]
  simulation?: {
    mainProfile: string
    secondaryProfile: string
    resultCode: string
  }
}

export type RunPublishChecklistInput = {
  questionnaire: Pick<QuestionnaireRow, "slug" | "status" | "active" | "scoring_mode">
  profiles: QuestionnaireProfileRow[]
  questions: QuestionWithAlternatives[]
}

function buildSimulationAnswers(questions: QuestionWithAlternatives[]) {
  const answers: { questionId: string; alternativeId: string }[] = []
  for (const q of questions.filter(x => x.active)) {
    const alts = q.alternatives.filter(a => a.active).sort((a, b) => a.order - b.order)
    if (alts[0]) {
      answers.push({ questionId: q.id, alternativeId: alts[0].id })
    }
  }
  return answers
}

function countProfilesWithPositiveWeightPerQuestion(q: QuestionWithAlternatives): number {
  const profileIds = new Set<string>()
  for (const alt of q.alternatives.filter(a => a.active)) {
    for (const w of alt.weights) {
      if (w.weight > 0) profileIds.add(w.profile_id)
    }
  }
  return profileIds.size
}

function profileTotalWeightExposure(
  profiles: QuestionnaireProfileRow[],
  questions: QuestionWithAlternatives[]
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const p of profiles.filter(x => x.active)) totals.set(p.id, 0)

  for (const q of questions) {
    for (const alt of q.alternatives) {
      for (const w of alt.weights) {
        if (w.weight > 0 && totals.has(w.profile_id)) {
          totals.set(w.profile_id, (totals.get(w.profile_id) ?? 0) + w.weight)
        }
      }
    }
  }
  return totals
}

export function runPublishChecklist(input: RunPublishChecklistInput): PublishChecklistResult {
  const errors: string[] = []
  const warnings: string[] = []
  const items: PublishChecklistItem[] = []

  const { questionnaire, profiles, questions } = input
  const activeProfiles = profiles.filter(p => p.active)
  const activeQuestions = questions.filter(q => q.active)

  const push = (key: string, label: string, status: ChecklistItemStatus, detail?: string) => {
    items.push({ key, label, status, detail })
  }

  // 10. Status
  if (questionnaire.status === "published") {
    errors.push("Questionário já está publicado. Use voltar para rascunho antes de republicar.")
    push("status", "Status permite publicação", "error", "Já publicado")
  } else if (questionnaire.status === "archived") {
    warnings.push("Questionário arquivado será reativado ao publicar.")
    push("status", "Status permite publicação", "warning", "Arquivado → publicação permitida")
  } else {
    push("status", "Status permite publicação", "ok", `Atual: ${questionnaire.status}`)
  }

  if (!questionnaire.active) {
    warnings.push("Questionário marcado como inativo no cadastro.")
    push("active", "Questionário ativo", "warning")
  } else {
    push("active", "Questionário ativo", "ok")
  }

  // 9. Slug
  const slugErr = validateSlug(questionnaire.slug)
  if (slugErr) {
    errors.push(slugErr)
    push("slug", "Slug válido", "error", slugErr)
  } else {
    push("slug", "Slug válido", "ok", questionnaire.slug)
  }

  const profileIdToCode = new Map(profiles.map(p => [p.id, p.code]))

  const engineProfiles = profiles.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    sort_order: p.sort_order,
    active: p.active,
  }))

  const engineQuestions = questions.map(q => ({
    id: q.id,
    text: q.text,
    order: q.order,
    active: q.active,
  }))

  const engineAlternatives = questions.flatMap(q =>
    q.alternatives.map(a => ({
      id: a.id,
      question_id: a.question_id,
      text: a.text,
      order: a.order,
      active: a.active,
    }))
  )

  const engineWeights = questions.flatMap(q =>
    q.alternatives.flatMap(a =>
      a.weights.map(w => ({
        alternative_id: a.id,
        profile_id: w.profile_id,
        profile_code: profileIdToCode.get(w.profile_id) ?? "",
        weight: w.weight,
      }))
    )
  )

  const configResult = validateQuestionnaireConfig({
    profiles: engineProfiles,
    questions: engineQuestions,
    alternatives: engineAlternatives,
    weights: engineWeights,
  })

  errors.push(...configResult.errors)
  warnings.push(...configResult.warnings)

  // Map config to checklist items 1-6
  if (activeProfiles.length >= 2) {
    push("profiles_min", "Pelo menos 2 perfis ativos", "ok", `${activeProfiles.length} perfis`)
  } else {
    push("profiles_min", "Pelo menos 2 perfis ativos", "error")
  }

  if (activeQuestions.length >= 5) {
    push("questions_min", "Pelo menos 5 perguntas ativas", "ok", `${activeQuestions.length} perguntas`)
  } else {
    push("questions_min", "Pelo menos 5 perguntas ativas", "error")
  }

  const altOk = !configResult.errors.some(e =>
    e.includes("alternativas ativas") || e.includes("Alternativa")
  )
  push(
    "alternatives_per_question",
    "Cada pergunta com ≥2 alternativas e pesos",
    altOk ? "ok" : "error"
  )

  const weightsOk = !configResult.errors.some(
    e => e.includes("peso") || e.includes("Perfil") && e.includes("não recebe")
  )
  push("weights_valid", "Pesos válidos e perfis pontuam", weightsOk ? "ok" : "error")

  // 7-8 Simulation
  let simulation: PublishChecklistResult["simulation"]
  const scoringMode = questionnaire.scoring_mode as ScoringMode
  const answers = buildSimulationAnswers(questions)

  if (answers.length !== activeQuestions.length) {
    errors.push("Simulação falhou: nem toda pergunta ativa possui alternativa ativa.")
    push("simulation", "Simulação de resultado", "error")
  } else {
    try {
      const result = calculateQuestionnaireResult({
        profiles: engineProfiles,
        questions: engineQuestions,
        alternatives: engineAlternatives,
        weights: engineWeights,
        answers,
        scoringMode,
      })

      if (!result.mainProfile || !result.secondaryProfile) {
        errors.push("Simulação não retornou perfis principal e secundário.")
        push("simulation", "Simulação de resultado", "error")
      } else if (
        activeProfiles.length >= 2 &&
        result.mainProfile === result.secondaryProfile
      ) {
        warnings.push("Simulação: perfil principal e secundário coincidem (empate ou configuração).")
        push("simulation", "Simulação de resultado", "warning", result.resultCode)
      } else {
        push("simulation", "Simulação de resultado", "ok", result.resultCode)
      }

      simulation = {
        mainProfile: result.mainProfile,
        secondaryProfile: result.secondaryProfile,
        resultCode: result.resultCode,
      }

      // Tie warning at top of ranking
      if (result.ranking.length >= 2 && result.ranking[0].score === result.ranking[1].score) {
        warnings.push("Simulação indica empate entre os dois primeiros perfis.")
        push("tie_ranking", "Empates no ranking", "warning")
      } else {
        push("tie_ranking", "Empates no ranking", "ok")
      }
    } catch (e) {
      errors.push("Erro ao executar simulação de cálculo.")
      push("simulation", "Simulação de resultado", "error")
    }
  }

  // Non-blocking warnings
  const singleProfileQuestions = activeQuestions.filter(
    q => countProfilesWithPositiveWeightPerQuestion(q) <= 1
  )
  if (activeQuestions.length > 0) {
    const ratio = singleProfileQuestions.length / activeQuestions.length
    if (ratio > 0.8) {
      warnings.push(
        "Mais de 80% das perguntas pontuam apenas um perfil — diversifique os pesos."
      )
      push("single_profile_questions", "Diversidade de pesos por pergunta", "warning")
    } else {
      push("single_profile_questions", "Diversidade de pesos por pergunta", "ok")
    }
  }

  const exposure = profileTotalWeightExposure(profiles, questions)
  const maxExposure = Math.max(0, ...[...exposure.values()])
  for (const p of activeProfiles) {
    const exp = exposure.get(p.id) ?? 0
    if (maxExposure > 0 && exp > 0 && exp <= maxExposure * 0.15) {
      warnings.push(`Perfil "${p.code}" pontua pouco no conjunto de alternativas (exposição baixa).`)
    }
  }
  const lowProfiles = activeProfiles.filter(p => {
    const exp = exposure.get(p.id) ?? 0
    return maxExposure > 0 && exp > 0 && exp <= maxExposure * 0.15
  })
  if (lowProfiles.length > 0) {
    push("profile_exposure", "Exposição equilibrada dos perfis", "warning")
  } else {
    push("profile_exposure", "Exposição equilibrada dos perfis", "ok")
  }

  if (activeQuestions.length > 0 && activeProfiles.length > 0) {
    if (activeQuestions.length < activeProfiles.length + 2) {
      warnings.push("Poucas perguntas em relação ao número de perfis.")
      push("questions_vs_profiles", "Perguntas vs perfis", "warning")
    } else {
      push("questions_vs_profiles", "Perguntas vs perfis", "ok")
    }
  }

  const uniqueErrors = [...new Set(errors)]
  const uniqueWarnings = [...new Set(warnings)]

  return {
    canPublish: uniqueErrors.length === 0,
    errors: uniqueErrors,
    warnings: uniqueWarnings,
    items,
    simulation,
  }
}
