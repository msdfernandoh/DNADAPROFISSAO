import assert from "node:assert/strict"
import { createServer } from "node:http"
import { spawn } from "node:child_process"
import { once } from "node:events"
let stored = null
const database = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost")
  res.setHeader("content-type", "application/json")
  if (req.method === "GET") { res.end(JSON.stringify(stored ? [stored] : [])); return }
  let body = ""; for await (const chunk of req) body += chunk
  const row = JSON.parse(body)
  if (req.method === "POST" && stored) { res.statusCode = 409; res.end(JSON.stringify({ code: "23505" })); return }
  if (req.method === "PATCH" && url.searchParams.get("value->>revision") !== "eq." + stored?.value.revision) { res.end("[]"); return }
  stored = row
  res.statusCode = req.method === "POST" ? 201 : 200
  res.end(JSON.stringify({ key: row.key }))
})
database.listen(0, "127.0.0.1"); await once(database, "listening")
const dbPort = database.address().port
const port = 31849
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  cwd: process.cwd(), windowsHide: true,
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + dbPort, SUPABASE_URL: "http://127.0.0.1:" + dbPort, SUPABASE_SERVICE_ROLE_KEY: "test-only-private-key", ADMIN_SESSION_SECRET: "test-only-signing-secret", ADMIN_PASSWORD: "test-initial-password" },
  stdio: ["ignore", "pipe", "pipe"],
})
let logs = ""; server.stdout.on("data", x => logs += x); server.stderr.on("data", x => logs += x)
const base = "http://127.0.0.1:" + port
async function request(path, method = "GET", body, cookie) {
  const response = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] }
}
try {
  let ready = false
  for (let i = 0; i < 80; i++) { try { await fetch(base + "/api/admin/login"); ready = true; break } catch { await new Promise(r => setTimeout(r, 250)) } }
  assert.ok(ready, logs)
  assert.equal((await request("/api/admin/password", "POST", {})).status, 401)
  const first = await request("/api/admin/login", "POST", { password: "test-initial-password" })
  assert.equal(first.status, 200)
  const payload = { currentPassword: "wrong-password", newPassword: "test-new-password", confirmation: "test-new-password" }
  assert.equal((await request("/api/admin/password", "POST", payload, first.cookie)).status, 403)
  payload.currentPassword = "test-initial-password"; payload.confirmation = "mismatch"
  assert.equal((await request("/api/admin/password", "POST", payload, first.cookie)).status, 400)
  payload.confirmation = payload.newPassword
  const changed = await request("/api/admin/password", "POST", payload, first.cookie)
  assert.equal(changed.status, 200)
  assert.ok(stored.value.hash && !JSON.stringify(stored).includes("test-new-password"))
  assert.equal((await request("/api/admin/login", "GET", undefined, first.cookie)).body.authed, false)
  assert.equal((await request("/api/admin/login", "GET", undefined, changed.cookie)).body.authed, true)
  assert.equal((await request("/api/admin/login", "POST", { password: "test-initial-password" })).status, 401)
  assert.equal((await request("/api/admin/login", "POST", { password: "test-new-password" })).status, 200)
  console.log("Password flow: login, senha atual, confirmação, hash persistido, nova senha e revogação de sessões passaram; nenhum dado de produção alterado.")
} finally { server.kill(); database.closeAllConnections(); database.close() }
