export const SETTING_DNA_RAPIDO_BUTTON = "dna_rapido_button_enabled"
export const SETTING_DNA_RAPIDO_QUESTIONS = "dna_rapido_question_indices"

export const MIN_DNA_RAPIDO_QUESTIONS = 5
export const MAX_DNA_RAPIDO_QUESTIONS = 12

/** Fallback recomendado (10 perguntas) */
export const DEFAULT_DNA_RAPIDO_QUESTION_INDICES = [0, 5, 8, 10, 11, 14, 15, 17, 19, 23]

export function parseSettingBoolean(value: unknown): boolean {
  if (value === true) return true
  if (value === false) return false
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "true") return true
    if (v === "false") return false
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = (value as { enabled?: unknown }).enabled
    if (typeof nested === "boolean") return nested
  }
  return false
}

export function parseQuestionIndicesJson(value: unknown): unknown {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

export function normalizeQuickQuestionIndices(
  raw: unknown,
  questionsLength: number,
  fallback: number[] = DEFAULT_DNA_RAPIDO_QUESTION_INDICES
): number[] {
  const arr = parseQuestionIndicesJson(raw)
  if (!Array.isArray(arr)) return [...fallback]

  const set = new Set<number>()
  for (const item of arr) {
    const n = typeof item === "number" ? item : parseInt(String(item), 10)
    if (!Number.isInteger(n) || n < 0 || n >= questionsLength) continue
    set.add(n)
  }

  const sorted = [...set].sort((a, b) => a - b)
  if (sorted.length < MIN_DNA_RAPIDO_QUESTIONS) return [...fallback]
  if (sorted.length > MAX_DNA_RAPIDO_QUESTIONS) return sorted.slice(0, MAX_DNA_RAPIDO_QUESTIONS)
  return sorted
}

export function validateQuickQuestionIndicesForSave(
  indices: unknown,
  questionsLength: number
): { ok: true; indices: number[] } | { ok: false; error: string } {
  if (!Array.isArray(indices)) {
    return { ok: false, error: "Índices devem ser um array." }
  }

  const set = new Set<number>()
  for (const item of indices) {
    if (typeof item !== "number" || !Number.isInteger(item)) {
      return { ok: false, error: "Todos os índices devem ser números inteiros." }
    }
    if (item < 0 || item >= questionsLength) {
      return { ok: false, error: `Índice ${item} fora do intervalo das perguntas.` }
    }
    set.add(item)
  }

  const sorted = [...set].sort((a, b) => a - b)
  if (sorted.length < MIN_DNA_RAPIDO_QUESTIONS) {
    return { ok: false, error: `Selecione pelo menos ${MIN_DNA_RAPIDO_QUESTIONS} perguntas.` }
  }
  if (sorted.length > MAX_DNA_RAPIDO_QUESTIONS) {
    return { ok: false, error: `Selecione no máximo ${MAX_DNA_RAPIDO_QUESTIONS} perguntas.` }
  }

  return { ok: true, indices: sorted }
}

export function getQuickQuizStageInfo(questionIndexInQuick: number, total: number): {
  stage: number
  totalStages: number
} {
  if (total <= 0) return { stage: 1, totalStages: 3 }
  const totalStages = total > 10 ? 4 : 3
  const stageSize = Math.ceil(total / totalStages)
  const stage = Math.min(totalStages, Math.floor(questionIndexInQuick / stageSize) + 1)
  return { stage, totalStages }
}
