import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto"
import { promisify } from "node:util"
const scrypt = promisify(scryptCallback)
export type StoredCredential = { salt: string; hash: string; revision: string }
export function isStoredCredential(value: unknown): value is StoredCredential {
  if (!value || typeof value !== "object") return false
  const v = value as StoredCredential
  return typeof v.salt === "string" && /^[a-f0-9]{32}$/.test(v.salt) && typeof v.hash === "string" && /^[a-f0-9]{128}$/.test(v.hash) && typeof v.revision === "string" && /^[a-f0-9-]{36}$/.test(v.revision)
}
export async function hashAdminPassword(password: string): Promise<StoredCredential> {
  const salt = randomBytes(16).toString("hex")
  const hash = await scrypt(password, salt, 64) as Buffer
  return { salt, hash: hash.toString("hex"), revision: randomUUID() }
}
export async function verifyAdminPassword(password: string, value: StoredCredential): Promise<boolean> {
  if (!isStoredCredential(value) || password.length > 1024) return false
  const actual = await scrypt(password, value.salt, 64) as Buffer
  return timingSafeEqual(actual, Buffer.from(value.hash, "hex"))
}
export function bootstrapSubject(password: string) {
  return "admin:bootstrap:" + createHash("sha256").update(password).digest("hex")
}
