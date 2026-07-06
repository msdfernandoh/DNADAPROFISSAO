import type { QuestionWithAlternatives } from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow, QuestionnaireRow } from "@/lib/questionnaire-platform/validators"
import type { Answer } from "@/lib/questionnaire-engine/types"

export type PublicAlternative = {
  id: string
  question_id: string
  text: string
  order: number
}

export type PublicQuestion = {
  id: string
  text: string
  description: string | null
  order: number
  required: boolean
  type: string
  alternatives: PublicAlternative[]
}

export type PublicQuestionnairePayload = {
  questionnaire: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  questions: PublicQuestion[]
}

export function buildPublicQuestionnairePayload(
  questionnaire: Pick<QuestionnaireRow, "id" | "name" | "slug" | "description">,
  questions: QuestionWithAlternatives[]
): PublicQuestionnairePayload {
  const activeQuestions = questions
    .filter(q => q.active)
    .sort((a, b) => a.order - b.order)
    .map(q => ({
      id: q.id,
      text: q.text,
      description: q.description,
      order: q.order,
      required: q.required,
      type: q.type,
      alternatives: q.alternatives
        .filter(a => a.active)
        .sort((a, b) => a.order - b.order)
        .map(a => ({
          id: a.id,
          question_id: a.question_id,
          text: a.text,
          order: a.order,
        })),
    }))

  return {
    questionnaire: {
      id: questionnaire.id,
      name: questionnaire.name,
      slug: questionnaire.slug,
      description: questionnaire.description,
    },
    questions: activeQuestions,
  }
}

/** Garantia de que payload público não inclui pesos (testes). */
export function publicPayloadHasNoWeights(payload: unknown): boolean {
  const json = JSON.stringify(payload)
  return !json.includes('"weight"') && !json.includes('"weights"')
}

export function bundleToEngineInput(
  questionnaire: QuestionnaireRow,
  profiles: QuestionnaireProfileRow[],
  questions: QuestionWithAlternatives[],
  answers: Answer[]
) {
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

  return {
    profiles: engineProfiles,
    questions: engineQuestions,
    alternatives: engineAlternatives,
    weights: engineWeights,
    answers,
    scoringMode: questionnaire.scoring_mode,
  }
}

export function codeToProfileId(profiles: QuestionnaireProfileRow[], code: string): string | null {
  const p = profiles.find(x => x.code === code && x.active)
  return p?.id ?? null
}
