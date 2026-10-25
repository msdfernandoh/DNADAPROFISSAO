import assert from "node:assert/strict"
const base = process.argv[2] || "https://dnadaprofissao.vercel.app"
async function check(path, init, expected) {
  const response = await fetch(base + path, init)
  const body = await response.json()
  assert.equal(response.status, expected, path + " status: " + JSON.stringify(body))
  return body
}
const courses = await check("/api/courses", {}, 200)
assert.equal(courses.length, 40)
const cities = await check("/api/cities", {}, 200)
assert.equal(cities.length, 16)
const questionnaire = await check("/api/v2/questionnaires/public/dna-profissao-v2", {}, 200)
assert.equal(questionnaire.data.questions.length, 15)
assert.equal(/"weights?"\s*:/.test(JSON.stringify(questionnaire)), false)
const forged = { cookie: "dna_admin_session=authenticated" }
await check("/api/admin/participants", { headers: forged }, 401)
await check("/api/v2/admin/questionnaires", { headers: forged }, 401)
const login = await check("/api/admin/login", { headers: forged }, 200)
assert.equal(login.authed, false)
await check("/api/participants", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000000" }) }, 401)
await check("/api/v2/participants/00000000-0000-4000-8000-000000000000/complete", { method: "POST" }, 401)
console.log("Produção: cursos=40, cidades=16, perguntas=15; pesos ocultos; cookie falso e alteração sem sessão rejeitados.")
