/**
 * Testes utilitários de leads (Fase 7).
 * npx tsx scripts/test-leads-utils.ts
 */
import assert from "node:assert/strict"
import { buildRankingFromResult } from "../lib/questionnaire-platform/lead-types"
import { buildWhatsAppUrl, defaultLeadWhatsAppMessage } from "../lib/questionnaire-platform/whatsapp"

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

test("ranking ordena por score e sort_order", () => {
  const r = buildRankingFromResult(
    { A: 3, B: 3, C: 1 },
    { A: 50, B: 50, C: 0 },
    [
      { code: "A", sort_order: 0 },
      { code: "B", sort_order: 1 },
      { code: "C", sort_order: 2 },
    ]
  )
  assert.equal(r[0].profileCode, "A")
  assert.equal(r[1].profileCode, "B")
})

test("WhatsApp URL codifica mensagem", () => {
  const url = buildWhatsAppUrl("11999998888", defaultLeadWhatsAppMessage("Maria Silva"))
  assert.ok(url.includes("wa.me/5511999998888"))
  assert.ok(url.includes("text="))
  assert.ok(defaultLeadWhatsAppMessage("Maria Silva").includes("Maria"))
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
