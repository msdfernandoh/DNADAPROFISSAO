import type {
  Alternative,
  AlternativeWeight,
  Answer,
  Question,
  QuestionnaireProfile,
} from "../types"

const Q_IDS = ["q1", "q2", "q3", "q4", "q5"] as const

export const sampleProfiles: QuestionnaireProfile[] = [
  { id: "p-lid", code: "LID", name: "Líder", sort_order: 0, active: true },
  { id: "p-com", code: "COM", name: "Comunicador", sort_order: 1, active: true },
  { id: "p-est", code: "EST", name: "Estratégico", sort_order: 2, active: true },
  { id: "p-hum", code: "HUM", name: "Humanizado", sort_order: 3, active: true },
  { id: "p-pra", code: "PRA", name: "Prático", sort_order: 4, active: true },
]

export const sampleQuestions: Question[] = Q_IDS.map((id, i) => ({
  id,
  text: `Pergunta ${i + 1}`,
  order: i + 1,
  active: true,
}))

/** Por pergunta: alt-a favorece LID, alt-b favorece COM, alternando EST/HUM/PRA */
export const sampleAlternatives: Alternative[] = Q_IDS.flatMap((qId, qi) => [
  {
    id: `${qId}-a`,
    question_id: qId,
    text: `Opção A da pergunta ${qi + 1}`,
    order: 1,
    active: true,
  },
  {
    id: `${qId}-b`,
    question_id: qId,
    text: `Opção B da pergunta ${qi + 1}`,
    order: 2,
    active: true,
  },
])

const profileByCode: Record<string, string> = {
  LID: "p-lid",
  COM: "p-com",
  EST: "p-est",
  HUM: "p-hum",
  PRA: "p-pra",
}

function w(altId: string, code: keyof typeof profileByCode, weight: number): AlternativeWeight {
  return {
    alternative_id: altId,
    profile_id: profileByCode[code],
    profile_code: code,
    weight,
  }
}

export const sampleWeights: AlternativeWeight[] = [
  // q1: A -> LID, B -> COM
  w("q1-a", "LID", 3),
  w("q1-b", "COM", 3),
  // q2: A -> COM, B -> EST
  w("q2-a", "COM", 2),
  w("q2-b", "EST", 2),
  // q3: A -> EST, B -> HUM
  w("q3-a", "EST", 2),
  w("q3-b", "HUM", 2),
  // q4: A -> HUM, B -> PRA
  w("q4-a", "HUM", 2),
  w("q4-b", "PRA", 2),
  // q5: A -> PRA, B -> LID (empate possível)
  w("q5-a", "PRA", 2),
  w("q5-b", "LID", 2),
]

/** Todas opção A: LID domina (3+2 em q5-b se B...) — respostas all A */
export const sampleAnswersAllA: Answer[] = Q_IDS.map(qId => ({
  questionId: qId,
  alternativeId: `${qId}-a`,
}))

/** Respostas para empate LID x COM com sort_order (LID vence) */
export const sampleAnswersTieLidCom: Answer[] = [
  { questionId: "q1", alternativeId: "q1-a" }, // LID +3
  { questionId: "q2", alternativeId: "q2-a" }, // COM +2
  { questionId: "q3", alternativeId: "q3-b" }, // HUM +2
  { questionId: "q4", alternativeId: "q4-b" }, // PRA +2
  { questionId: "q5", alternativeId: "q5-b" }, // LID +2  -> LID 5, COM 2
]

/** Empate score LID e COM both 3: q1-a LID +3, q1-b COM +3 only one answer */
export const sampleAnswersExactTie: Answer[] = [
  { questionId: "q1", alternativeId: "q1-a" },
  { questionId: "q2", alternativeId: "q2-b" },
  { questionId: "q3", alternativeId: "q3-b" },
  { questionId: "q4", alternativeId: "q4-b" },
  { questionId: "q5", alternativeId: "q5-a" },
]

export function buildInvalidConfigNoWeightsOnAlt(): AlternativeWeight[] {
  return sampleWeights.filter(w => w.alternative_id !== "q1-a")
}

export function buildInvalidProfileNoPoints(): AlternativeWeight[] {
  return sampleWeights.filter(w => w.profile_code !== "PRA")
}

export function buildInvalidOnlyOneProfile(): QuestionnaireProfile[] {
  return [sampleProfiles[0]]
}
