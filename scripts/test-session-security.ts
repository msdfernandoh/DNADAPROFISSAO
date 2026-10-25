import assert from "node:assert/strict"
import { signSession, verifySession, passwordMatches } from "../lib/security/session"
process.env.ADMIN_SESSION_SECRET = "test-secret-".repeat(8)
const admin = signSession("admin", "legacy-admin")
assert.equal(verifySession(admin, "admin", "legacy-admin"), true)
assert.equal(verifySession("authenticated", "admin", "legacy-admin"), false)
assert.equal(verifySession(admin + ".extra", "admin"), false)
assert.equal(verifySession(admin.slice(0, -1) + "!", "admin"), false)
assert.equal(verifySession(signSession("admin", "legacy-admin", -1), "admin"), false)
assert.equal(verifySession(signSession("participant-v1", "a"), "admin"), false)
const participant = signSession("participant-v2", "participant-a")
assert.equal(verifySession(participant, "participant-v2", "participant-a"), true)
assert.equal(verifySession(participant, "participant-v2", "participant-b"), false)
assert.equal(verifySession(participant, "participant-v1", "participant-a"), false)
assert.equal(passwordMatches("correct-password", "correct-password"), true)
assert.equal(passwordMatches("wrong-password", "correct-password"), false)
process.env.ADMIN_SESSION_SECRET = "other-test-secret".repeat(8)
assert.equal(verifySession(admin, "admin"), false)
delete process.env.ADMIN_SESSION_SECRET
delete process.env.SUPABASE_SERVICE_ROLE_KEY
delete process.env.SUPABASE_SECRET_KEY
assert.equal(verifySession(admin, "admin"), false)
assert.throws(() => signSession("admin", "legacy-admin"))
console.log("14 verificações de segurança de sessão passaram")
