import { createClient } from "@/lib/supabase/server"
import type {
  AlternativeWeightRow,
  AlternativeWithWeights,
  QuestionWithAlternatives,
} from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow, QuestionnaireRow } from "@/lib/questionnaire-platform/validators"

export type QuestionnaireBundle = {
  questionnaire: QuestionnaireRow
  profiles: QuestionnaireProfileRow[]
  questions: QuestionWithAlternatives[]
}

export async function loadQuestionnaireBundle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string
): Promise<{ bundle: QuestionnaireBundle | null; error?: string }> {
  const { data: questionnaire, error: qErr } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("id", questionnaireId)
    .maybeSingle()

  if (qErr) return { bundle: null, error: qErr.message }
  if (!questionnaire) return { bundle: null, error: "Questionário não encontrado." }

  const { data: profiles, error: pErr } = await supabase
    .from("questionnaire_profiles")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .order("sort_order", { ascending: true })

  if (pErr) return { bundle: null, error: pErr.message }

  const { data: questions, error: qsErr } = await supabase
    .from("questions")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .order("order", { ascending: true })

  if (qsErr) return { bundle: null, error: qsErr.message }

  const questionIds = (questions ?? []).map(q => q.id)
  let alternatives: { id: string; question_id: string; text: string; order: number; active: boolean }[] =
    []

  if (questionIds.length > 0) {
    const { data: alts, error: aErr } = await supabase
      .from("alternatives")
      .select("*")
      .in("question_id", questionIds)
      .order("order", { ascending: true })
    if (aErr) return { bundle: null, error: aErr.message }
    alternatives = alts ?? []
  }

  const altIds = alternatives.map(a => a.id)
  let weights: AlternativeWeightRow[] = []

  if (altIds.length > 0) {
    const { data: wRows, error: wErr } = await supabase
      .from("alternative_weights")
      .select("id, alternative_id, profile_id, weight")
      .in("alternative_id", altIds)
    if (wErr) return { bundle: null, error: wErr.message }
    weights = wRows ?? []
  }

  const weightsByAlt = new Map<string, AlternativeWeightRow[]>()
  for (const w of weights) {
    const list = weightsByAlt.get(w.alternative_id) ?? []
    list.push(w)
    weightsByAlt.set(w.alternative_id, list)
  }

  const altsByQuestion = new Map<string, AlternativeWithWeights[]>()
  for (const a of alternatives) {
    const list = altsByQuestion.get(a.question_id) ?? []
    list.push({ ...a, weights: weightsByAlt.get(a.id) ?? [] })
    altsByQuestion.set(a.question_id, list)
  }

  const tree: QuestionWithAlternatives[] = (questions ?? []).map(q => ({
    ...q,
    alternatives: altsByQuestion.get(q.id) ?? [],
  }))

  return {
    bundle: {
      questionnaire: questionnaire as QuestionnaireRow,
      profiles: (profiles ?? []) as QuestionnaireProfileRow[],
      questions: tree,
    },
  }
}
