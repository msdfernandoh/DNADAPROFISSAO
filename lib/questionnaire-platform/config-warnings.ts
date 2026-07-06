import { validateQuestionnaireConfig } from "@/lib/questionnaire-engine"
import type { QuestionWithAlternatives } from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow } from "@/lib/questionnaire-platform/validators"

/** Avisos não bloqueantes (Fase 4) — reutiliza regras do motor de publicação. */
export function collectConfigWarnings(
  questions: QuestionWithAlternatives[],
  profiles: QuestionnaireProfileRow[]
): string[] {
  const profileIdToCode = new Map(profiles.map(p => [p.id, p.code]))

  const engineInput = {
    profiles: profiles.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      sort_order: p.sort_order,
      active: p.active,
    })),
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      order: q.order,
      active: q.active,
    })),
    alternatives: questions.flatMap(q =>
      q.alternatives.map(a => ({
        id: a.id,
        question_id: a.question_id,
        text: a.text,
        order: a.order,
        active: a.active,
      }))
    ),
    weights: questions.flatMap(q =>
      q.alternatives.flatMap(a =>
        a.weights.map(w => ({
          alternative_id: a.id,
          profile_id: w.profile_id,
          profile_code: profileIdToCode.get(w.profile_id) ?? "",
          weight: w.weight,
        }))
      )
    ),
  }

  const result = validateQuestionnaireConfig(engineInput)
  return [...result.errors, ...result.warnings]
}

export function alternativeHasPositiveWeight(
  alt: QuestionWithAlternatives["alternatives"][number]
): boolean {
  return alt.weights.some(w => w.weight > 0)
}
