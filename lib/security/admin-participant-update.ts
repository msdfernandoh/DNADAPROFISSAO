import { STATUS_OPTS } from "../dna-data"

export type AdminParticipantUpdate = { id: string; updates: { status?: string; notes?: string | null } }
export type AdminParticipantUpdateResult =
  | { ok: true; data: AdminParticipantUpdate }
  | { ok: false; error: string }

/** Legacy panel edits only. Identity, ownership and assessment results are not editable here. */
export function parseAdminParticipantUpdate(body: unknown): AdminParticipantUpdateResult {
  const invalid = (): AdminParticipantUpdateResult => ({ ok: false, error: "Informe um id válido e somente status ou notes válidos." })
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid()
  const input = body as Record<string, unknown>
  if (Object.keys(input).some(key => !["id", "status", "notes"].includes(key))) return invalid()
  if (typeof input.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id.trim())) return invalid()
  const updates: AdminParticipantUpdate["updates"] = {}
  if (Object.hasOwn(input, "status")) {
    if (typeof input.status !== "string" || !STATUS_OPTS.includes(input.status.trim())) return invalid()
    updates.status = input.status.trim()
  }
  if (Object.hasOwn(input, "notes")) {
    if (input.notes !== null && typeof input.notes !== "string") return invalid()
    updates.notes = input.notes as string | null
  }
  if (!Object.keys(updates).length) return invalid()
  return { ok: true, data: { id: input.id.trim(), updates } }
}
