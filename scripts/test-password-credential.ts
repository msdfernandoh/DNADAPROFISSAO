import assert from "node:assert/strict"
import { hashAdminPassword, verifyAdminPassword, isStoredCredential, bootstrapSubject } from "../lib/security/password-credential"
async function main() {
  const a = await hashAdminPassword("test-password-first")
  const b = await hashAdminPassword("test-password-first")
  assert.ok(isStoredCredential(a))
  assert.notEqual(a.hash, b.hash)
  assert.notEqual(a.revision, b.revision)
  assert.equal(await verifyAdminPassword("test-password-first", a), true)
  assert.equal(await verifyAdminPassword("incorrect-password", a), false)
  assert.equal(await verifyAdminPassword("a".repeat(1025), a), false)
  assert.equal(isStoredCredential({ ...a, hash: "broken" }), false)
  assert.equal(isStoredCredential(null), false)
  assert.notEqual(bootstrapSubject("first-password"), bootstrapSubject("second-password"))
  console.log("Password credential: 9 verificações passaram")
}
main().catch(error => { console.error(error); process.exitCode = 1 })
