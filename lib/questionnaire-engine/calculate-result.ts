import type {
  Alternative,
  AlternativeWeight,
  Answer,
  CalculateQuestionnaireResultInput,
  CalculateQuestionnaireResultOutput,
  QuestionnaireProfile,
  RankingEntry,
  ScoringMode,
} from "./types"

function activeProfiles(profiles: QuestionnaireProfile[]) {
  return profiles.filter(p => p.active)
}

function buildProfileMaps(profiles: QuestionnaireProfile[]) {
  const active = activeProfiles(profiles)
  const idToCode = new Map<string, string>()
  const codeToSortOrder = new Map<string, number>()
  for (const p of active) {
    idToCode.set(p.id, p.code)
    codeToSortOrder.set(p.code, p.sort_order)
  }
  return { active, idToCode, codeToSortOrder }
}

function indexAlternatives(alternatives: Alternative[]) {
  const byId = new Map<string, Alternative>()
  for (const a of alternatives) {
    if (a.active) byId.set(a.id, a)
  }
  return byId
}

function indexWeightsByAlternative(weights: AlternativeWeight[]) {
  const map = new Map<string, AlternativeWeight[]>()
  for (const w of weights) {
    const list = map.get(w.alternative_id) ?? []
    list.push(w)
    map.set(w.alternative_id, list)
  }
  return map
}

function initScores(codes: string[]): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const code of codes) scores[code] = 0
  return scores
}

function computePercentages(
  scores: Record<string, number>,
  codes: string[],
  scoringMode: ScoringMode,
  answerCount: number
): Record<string, number> {
  const percentages: Record<string, number> = {}
  const totalScore = codes.reduce((sum, c) => sum + (scores[c] ?? 0), 0)

  if (scoringMode === "per_question") {
    if (answerCount === 0) {
      for (const code of codes) percentages[code] = 0
      return percentages
    }
    const divisor = answerCount
    for (const code of codes) {
      percentages[code] = Math.round(((scores[code] ?? 0) / divisor) * 100)
    }
    return percentages
  }

  // normalized_sum
  if (totalScore <= 0) {
    for (const code of codes) percentages[code] = 0
    return percentages
  }

  for (const code of codes) {
    percentages[code] = Math.round(((scores[code] ?? 0) / totalScore) * 100)
  }
  return percentages
}

function buildRanking(
  scores: Record<string, number>,
  percentages: Record<string, number>,
  codeToSortOrder: Map<string, number>
): RankingEntry[] {
  const codes = [...codeToSortOrder.keys()]
  return codes
    .map(profileCode => ({
      profileCode,
      score: scores[profileCode] ?? 0,
      percentage: percentages[profileCode] ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const orderA = codeToSortOrder.get(a.profileCode) ?? 0
      const orderB = codeToSortOrder.get(b.profileCode) ?? 0
      return orderA - orderB
    })
}

export function calculateQuestionnaireResult(
  input: CalculateQuestionnaireResultInput
): CalculateQuestionnaireResultOutput {
  const { profiles, alternatives, weights, answers, scoringMode } = input
  const { active, idToCode, codeToSortOrder } = buildProfileMaps(profiles)
  const activeCodes = active.map(p => p.code)

  const scores = initScores(activeCodes)
  const altById = indexAlternatives(alternatives)
  const weightsByAlt = indexWeightsByAlternative(weights)

  for (const answer of answers) {
    const alt = altById.get(answer.alternativeId)
    if (!alt) continue

    const altWeights = weightsByAlt.get(answer.alternativeId) ?? []

    for (const w of altWeights) {
      if (w.weight <= 0) continue
      const code = idToCode.get(w.profile_id) ?? w.profile_code
      if (!code || !(code in scores)) continue
      scores[code] += w.weight
    }
  }

  const answerCount = answers.length

  const percentages = computePercentages(
    scores,
    activeCodes,
    scoringMode,
    answerCount
  )

  const ranking = buildRanking(scores, percentages, codeToSortOrder)

  const mainProfile = ranking[0]?.profileCode ?? activeCodes[0] ?? ""
  const secondaryProfile =
    ranking[1]?.profileCode ?? activeCodes[1] ?? mainProfile

  const resultCode = `${mainProfile}_${secondaryProfile}`

  return {
    scores,
    percentages,
    mainProfile,
    secondaryProfile,
    resultCode,
    ranking,
  }
}
