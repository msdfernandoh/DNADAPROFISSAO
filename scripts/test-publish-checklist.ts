/**
 * Testes do publish-checklist (Fase 5).
 * Executar: npx tsx scripts/test-publish-checklist.ts
 */
import assert from "node:assert/strict"
import { runPublishChecklist } from "../lib/questionnaire-engine/publish-checklist"
import {
  buildInvalidConfigNoWeightsOnAlt,
  sampleAlternatives,
  sampleProfiles,
  sampleQuestions,
  sampleWeights,
} from "../lib/questionnaire-engine/__fixtures__/sample-questionnaire"
import type { AlternativeWeightRow, QuestionWithAlternatives } from "../lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow, QuestionnaireRow } from "../lib/questionnaire-platform/validators"

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

function baseQuestionnaire(overrides: Partial<QuestionnaireRow> = {}): QuestionnaireRow {
  return {
    id: "qnr-1",
    name: "Teste",
    slug: "teste-valido",
    description: null,
    status: "draft",
    version: 1,
    active: true,
    scoring_mode: "per_question",
    created_at: "",
    updated_at: "",
    ...overrides,
  }
}

function toProfileRows(): QuestionnaireProfileRow[] {
  return sampleProfiles.map(p => ({
    id: p.id,
    questionnaire_id: "qnr-1",
    code: p.code,
    name: p.name,
    short_description: null,
    long_description: null,
    color: null,
    icon: null,
    sort_order: p.sort_order,
    active: p.active,
    created_at: "",
    updated_at: "",
  }))
}

function toQuestionTree(weights = sampleWeights): QuestionWithAlternatives[] {
  const weightsByAlt = new Map<string, AlternativeWeightRow[]>()
  for (const w of weights) {
    const list = weightsByAlt.get(w.alternative_id) ?? []
    list.push({
      id: `${w.alternative_id}-${w.profile_id}`,
      alternative_id: w.alternative_id,
      profile_id: w.profile_id,
      weight: w.weight,
    })
    weightsByAlt.set(w.alternative_id, list)
  }

  return sampleQuestions.map(q => ({
    id: q.id,
    questionnaire_id: "qnr-1",
    text: q.text,
    description: null,
    order: q.order,
    type: "single_choice",
    required: true,
    active: q.active,
    created_at: "",
    updated_at: "",
    alternatives: sampleAlternatives
      .filter(a => a.question_id === q.id)
      .map(a => ({
        id: a.id,
        question_id: a.question_id,
        text: a.text,
        order: a.order,
        active: a.active,
        weights: weightsByAlt.get(a.id) ?? [],
      })),
  }))
}

test("1 — sem perfis suficientes → não publica", () => {
  const profiles = toProfileRows().map((p, i) => ({ ...p, active: i === 0 }))
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles,
    questions: toQuestionTree(),
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("2 perfis")))
})

test("2 — sem perguntas suficientes → não publica", () => {
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles: toProfileRows(),
    questions: toQuestionTree().slice(0, 2),
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("5 perguntas")))
})

test("3 — pergunta sem alternativa suficiente → não publica", () => {
  const questions = toQuestionTree()
  questions[0] = { ...questions[0], alternatives: [questions[0].alternatives[0]] }
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles: toProfileRows(),
    questions,
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("alternativas")))
})

test("4 — alternativa sem peso positivo → não publica", () => {
  const badWeights = buildInvalidConfigNoWeightsOnAlt()
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles: toProfileRows(),
    questions: toQuestionTree(badWeights),
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("peso") || e.includes("Alternativa")))
})

test("5 — questionário válido → canPublish e simulação", () => {
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles: toProfileRows(),
    questions: toQuestionTree(),
  })
  assert.equal(r.canPublish, true)
  assert.ok(r.simulation?.mainProfile)
  assert.ok(r.simulation?.secondaryProfile)
  assert.notEqual(r.simulation?.mainProfile, "")
})

test("6 — já publicado → bloqueia republicação", () => {
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire({ status: "published" }),
    profiles: toProfileRows(),
    questions: toQuestionTree(),
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("publicado")))
})

test("7 — perfil ativo sem pontuação → não publica", () => {
  const profiles5 = toProfileRows()
  const weightsNoPra = sampleWeights.filter(w => w.profile_code !== "PRA")
  const r = runPublishChecklist({
    questionnaire: baseQuestionnaire(),
    profiles: profiles5,
    questions: toQuestionTree(weightsNoPra),
  })
  assert.equal(r.canPublish, false)
  assert.ok(r.errors.some(e => e.includes("PRA") || e.includes("não recebe")))
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
