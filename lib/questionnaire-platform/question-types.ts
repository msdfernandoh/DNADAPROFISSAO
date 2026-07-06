export type AlternativeWeightRow = {
  id: string
  alternative_id: string
  profile_id: string
  weight: number
}

export type AlternativeWithWeights = {
  id: string
  question_id: string
  text: string
  order: number
  active: boolean
  weights: AlternativeWeightRow[]
}

export type QuestionWithAlternatives = {
  id: string
  questionnaire_id: string
  text: string
  description: string | null
  order: number
  type: string
  required: boolean
  active: boolean
  alternatives: AlternativeWithWeights[]
}
