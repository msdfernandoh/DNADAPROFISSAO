export type LeadResultSummary = {
  scores: Record<string, number>
  percentages: Record<string, number>
  main_profile: string | null
  secondary_profile: string | null
  result_code: string | null
  ranking?: { profileCode: string; score: number; percentage: number }[]
}

export type LeadListItem = {
  id: string
  name: string
  phone: string
  email: string
  city: string | null
  course_interest: string | null
  escolaridade: string | null
  status: string
  notes: string | null
  quiz_completed: boolean
  quiz_completed_at: string | null
  created_at: string
  vendor_slug: string | null
  result: LeadResultSummary | null
}

export type LeadAnswerRow = {
  question_id: string
  question_text: string
  question_order: number
  alternative_id: string
  alternative_text: string
}

export type LeadDetail = LeadListItem & {
  answers: LeadAnswerRow[]
}

export function buildRankingFromResult(
  scores: Record<string, number>,
  percentages: Record<string, number>,
  profileMeta: { code: string; sort_order: number }[]
): { profileCode: string; score: number; percentage: number }[] {
  const codes = profileMeta.length > 0 ? profileMeta.map(p => p.code) : Object.keys(scores)
  const sortByCode = new Map(profileMeta.map(p => [p.code, p.sort_order]))

  return codes
    .map(profileCode => ({
      profileCode,
      score: scores[profileCode] ?? 0,
      percentage: percentages[profileCode] ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (sortByCode.get(a.profileCode) ?? 0) - (sortByCode.get(b.profileCode) ?? 0)
    })
}
