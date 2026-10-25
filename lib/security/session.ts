import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export type SessionKind = "admin" | "participant-v1" | "participant-v2"
type Payload = { kind: SessionKind; sub: string; exp: number }
function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!value) throw new Error("Configure ADMIN_SESSION_SECRET ou a chave privada do Supabase no servidor.")
  return value
}
export function signSession(kind: SessionKind, sub: string, ttlSeconds = 8 * 60 * 60): string {
  const body = Buffer.from(JSON.stringify({ kind, sub, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url")
  const signature = createHmac("sha256", secret()).update("dna-session:" + body).digest("base64url")
  return body + "." + signature
}
export function verifySession(token: string | undefined, kind: SessionKind, sub?: string): boolean {
  if (!token || token.length > 2048) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [body, signature] = parts
  try {
    const expected = createHmac("sha256", secret()).update("dna-session:" + body).digest("base64url")
    const received = Buffer.from(signature)
    const wanted = Buffer.from(expected)
    if (received.length !== wanted.length || !timingSafeEqual(received, wanted)) return false
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload
    return payload.kind === kind && typeof payload.sub === "string" && payload.sub.length > 0 &&
      Number.isSafeInteger(payload.exp) && payload.exp > Math.floor(Date.now() / 1000) &&
      (sub === undefined || payload.sub === sub)
  } catch { return false }
}
export function passwordMatches(received: string, expected: string): boolean {
  return timingSafeEqual(createHash("sha256").update(received).digest(), createHash("sha256").update(expected).digest())
}
