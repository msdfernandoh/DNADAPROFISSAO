import { createClient } from "@/lib/supabase/server"

export async function questionnaireExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
) {
  const { data, error } = await supabase.from("questionnaires").select("id").eq("id", id).maybeSingle()
  return !error && !!data
}

export async function questionBelongsToQuestionnaire(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string,
  questionId: string
) {
  const { data } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("questionnaire_id", questionnaireId)
    .maybeSingle()
  return !!data
}

export async function alternativeBelongsToQuestionnaire(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string,
  alternativeId: string
) {
  const { data } = await supabase
    .from("alternatives")
    .select("id, question_id, questions!inner(questionnaire_id)")
    .eq("id", alternativeId)
    .maybeSingle()

  if (!data) return false
  const row = data as { questions?: { questionnaire_id?: string } }
  return row.questions?.questionnaire_id === questionnaireId
}

/** Supabase nested select fallback: two-step */
export async function alternativeBelongsToQuestionnaireSafe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string,
  alternativeId: string
) {
  const { data: alt } = await supabase.from("alternatives").select("question_id").eq("id", alternativeId).maybeSingle()
  if (!alt) return false
  return questionBelongsToQuestionnaire(supabase, questionnaireId, alt.question_id)
}

export async function profileBelongsToQuestionnaire(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string,
  profileId: string
) {
  const { data } = await supabase
    .from("questionnaire_profiles")
    .select("id")
    .eq("id", profileId)
    .eq("questionnaire_id", questionnaireId)
    .maybeSingle()
  return !!data
}

export async function nextQuestionOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionnaireId: string
) {
  const { data } = await supabase
    .from("questions")
    .select("order")
    .eq("questionnaire_id", questionnaireId)
    .order("order", { ascending: false })
    .limit(1)
  const max = data?.[0]?.order
  return typeof max === "number" ? max + 1 : 1
}

export async function nextAlternativeOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionId: string
) {
  const { data } = await supabase
    .from("alternatives")
    .select("order")
    .eq("question_id", questionId)
    .order("order", { ascending: false })
    .limit(1)
  const max = data?.[0]?.order
  return typeof max === "number" ? max + 1 : 1
}

const MAX_WEIGHT = 5

export function parseWeight(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const w = Math.trunc(value)
  if (w < 0) return null
  if (w > MAX_WEIGHT) return null
  return w
}

export { MAX_WEIGHT }
