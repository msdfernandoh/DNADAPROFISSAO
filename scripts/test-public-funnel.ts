/**
 * Testes do payload público (Fase 6) — sem pesos expostos.
 * Executar: npx tsx scripts/test-public-funnel.ts
 */
import assert from "node:assert/strict"
import {
  buildPublicQuestionnairePayload,
  publicPayloadHasNoWeights,
} from "../lib/questionnaire-platform/public-funnel"
import type { QuestionWithAlternatives } from "../lib/questionnaire-platform/question-types"
import { validateParticipantBody, parseAnswersBody } from "../lib/questionnaire-platform/participant-validators"

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

const mockQuestions: QuestionWithAlternatives[] = [
  {
    id: "q1",
    questionnaire_id: "qn1",
    text: "Pergunta 1",
    description: null,
    order: 1,
    type: "single_choice",
    required: true,
    active: true,
    alternatives: [
      {
        id: "a1",
        question_id: "q1",
        text: "Alt A",
        order: 1,
        active: true,
        weights: [{ id: "w1", alternative_id: "a1", profile_id: "p1", weight: 3 }],
      },
    ],
  },
]

test("payload público não contém weight/weights", () => {
  const payload = buildPublicQuestionnairePayload(
    { id: "qn1", name: "Teste", slug: "teste", description: null },
    mockQuestions
  )
  assert.equal(publicPayloadHasNoWeights(payload), true)
  assert.ok(!JSON.stringify(payload).includes("profile_id"))
})

test("validateParticipantBody exige escolaridade", () => {
  const r = validateParticipantBody({
    questionnaire_id: "x",
    name: "Ana",
    phone: "11999998888",
    email: "a@b.com",
    escolaridade: "",
  })
  assert.equal(r.ok, false)
})

test("parseAnswersBody batch", () => {
  const r = parseAnswersBody({
    answers: [{ questionId: "q1", alternativeId: "a1" }],
  })
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.answers.length, 1)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
