/**
 * Testes manuais do questionnaire-engine (Fase 2).
 * Executar: npx tsx scripts/test-questionnaire-engine.ts
 */
import assert from "node:assert/strict"
import { calculateQuestionnaireResult, validateQuestionnaireConfig } from "../lib/questionnaire-engine"
import {
  buildInvalidConfigNoWeightsOnAlt,
  buildInvalidOnlyOneProfile,
  buildInvalidProfileNoPoints,
  sampleAlternatives,
  sampleAnswersAllA,
  sampleAnswersExactTie,
  sampleProfiles,
  sampleQuestions,
  sampleWeights,
} from "../lib/questionnaire-engine/__fixtures__/sample-questionnaire"

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`✗ ${name}`)
    console.error(e)
  }
}

test("cálculo básico per_question — LID principal com respostas A", () => {
  const result = calculateQuestionnaireResult({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
    answers: sampleAnswersAllA,
    scoringMode: "per_question",
  })
  assert.equal(result.mainProfile, "LID")
  assert.ok(result.scores.LID >= 3)
  assert.equal(result.resultCode, `${result.mainProfile}_${result.secondaryProfile}`)
  assert.equal(result.ranking[0].profileCode, "LID")
})

test("empate usa sort_order — LID antes de COM", () => {
  const tieWeights = [
    ...sampleWeights.filter(w => w.alternative_id !== "q1-a" && w.alternative_id !== "q1-b"),
    {
      alternative_id: "q1-a",
      profile_id: "p-lid",
      profile_code: "LID",
      weight: 3,
    },
    {
      alternative_id: "q1-b",
      profile_id: "p-com",
      profile_code: "COM",
      weight: 3,
    },
  ]
  const result = calculateQuestionnaireResult({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: tieWeights,
    answers: [{ questionId: "q1", alternativeId: "q1-a" }],
    scoringMode: "per_question",
  })
  assert.equal(result.scores.LID, 3)
  assert.equal(result.scores.COM, 0)
  assert.equal(result.mainProfile, "LID")
})

test("empate mesmo score total — sort_order asc (LID main, COM secondary)", () => {
  const profiles = [
    { id: "p-lid", code: "LID", name: "L", sort_order: 0, active: true },
    { id: "p-com", code: "COM", name: "C", sort_order: 1, active: true },
  ]
  const questions = [
    { id: "q1", text: "Q1", order: 1, active: true },
    { id: "q2", text: "Q2", order: 2, active: true },
  ]
  const alternatives = [
    { id: "q1-a", question_id: "q1", text: "A", order: 1, active: true },
    { id: "q2-b", question_id: "q2", text: "B", order: 2, active: true },
  ]
  const weights = [
    { alternative_id: "q1-a", profile_id: "p-lid", profile_code: "LID", weight: 3 },
    { alternative_id: "q2-b", profile_id: "p-com", profile_code: "COM", weight: 3 },
  ]
  const result = calculateQuestionnaireResult({
    profiles,
    questions,
    alternatives,
    weights,
    answers: [
      { questionId: "q1", alternativeId: "q1-a" },
      { questionId: "q2", alternativeId: "q2-b" },
    ],
    scoringMode: "per_question",
  })
  assert.equal(result.scores.LID, 3)
  assert.equal(result.scores.COM, 3)
  assert.equal(result.mainProfile, "LID")
  assert.equal(result.secondaryProfile, "COM")
  assert.equal(result.resultCode, "LID_COM")
})

test("normalized_sum — percentuais com soma ~100 quando scores > 0", () => {
  const result = calculateQuestionnaireResult({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
    answers: sampleAnswersAllA,
    scoringMode: "normalized_sum",
  })
  const sumPct = Object.values(result.percentages).reduce((a, b) => a + b, 0)
  assert.ok(sumPct >= 95 && sumPct <= 105)
})

test("normalized_sum — scores zero não quebra", () => {
  const result = calculateQuestionnaireResult({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
    answers: [],
    scoringMode: "normalized_sum",
  })
  for (const code of ["LID", "COM", "EST", "HUM", "PRA"]) {
    assert.equal(result.percentages[code], 0)
  }
})

test("per_question — denominador = número de respostas", () => {
  const result = calculateQuestionnaireResult({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
    answers: sampleAnswersExactTie,
    scoringMode: "per_question",
  })
  const n = sampleAnswersExactTie.length
  assert.equal(result.percentages.LID, Math.round((result.scores.LID / n) * 100))
})

test("validate — config válida", () => {
  const v = validateQuestionnaireConfig({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
  })
  assert.equal(v.valid, true)
  assert.equal(v.errors.length, 0)
})

test("validate — config inválida (< 2 perfis)", () => {
  const v = validateQuestionnaireConfig({
    profiles: buildInvalidOnlyOneProfile(),
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: sampleWeights,
  })
  assert.equal(v.valid, false)
  assert.ok(v.errors.some(e => e.includes("2 perfis")))
})

test("validate — alternativa sem peso positivo", () => {
  const v = validateQuestionnaireConfig({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: buildInvalidConfigNoWeightsOnAlt(),
  })
  assert.equal(v.valid, false)
  assert.ok(v.errors.some(e => e.includes("peso maior que zero")))
})

test("validate — perfil sem pontuação", () => {
  const v = validateQuestionnaireConfig({
    profiles: sampleProfiles,
    questions: sampleQuestions,
    alternatives: sampleAlternatives,
    weights: buildInvalidProfileNoPoints(),
  })
  assert.equal(v.valid, false)
  assert.ok(v.errors.some(e => e.includes("PRA")))
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
