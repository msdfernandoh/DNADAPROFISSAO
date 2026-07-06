export type ScoringMode = "per_question" | "normalized_sum"

export type QuestionnaireProfile = {
  id: string
  code: string
  name: string
  sort_order: number
  active: boolean
}

export type Question = {
  id: string
  text: string
  order: number
  active: boolean
}

export type Alternative = {
  id: string
  question_id: string
  text: string
  order: number
  active: boolean
}

export type AlternativeWeight = {
  alternative_id: string
  profile_id: string
  profile_code: string
  weight: number
}

export type Answer = {
  questionId: string
  alternativeId: string
}

export type CalculateQuestionnaireResultInput = {
  profiles: QuestionnaireProfile[]
  questions: Question[]
  alternatives: Alternative[]
  weights: AlternativeWeight[]
  answers: Answer[]
  scoringMode: ScoringMode
}

export type RankingEntry = {
  profileCode: string
  score: number
  percentage: number
}

export type CalculateQuestionnaireResultOutput = {
  scores: Record<string, number>
  percentages: Record<string, number>
  mainProfile: string
  secondaryProfile: string
  resultCode: string
  ranking: RankingEntry[]
}

export type ValidateQuestionnaireConfigInput = {
  profiles: QuestionnaireProfile[]
  questions: Question[]
  alternatives: Alternative[]
  weights: AlternativeWeight[]
}

export type ValidateQuestionnaireConfigOutput = {
  valid: boolean
  errors: string[]
  warnings: string[]
}
