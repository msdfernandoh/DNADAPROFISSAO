import { cookies } from "next/headers"
import { signSession, verifySession } from "./session"

type Version = "v1" | "v2"
export async function setParticipantSession(id: string, version: Version) {
  const store = await cookies()
  store.set("dna_participant_" + version, signSession(version === "v1" ? "participant-v1" : "participant-v2", id, 24 * 60 * 60), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 24 * 60 * 60,
  })
}
export async function ownsParticipant(id: string, version: Version): Promise<boolean> {
  const store = await cookies()
  return verifySession(store.get("dna_participant_" + version)?.value, version === "v1" ? "participant-v1" : "participant-v2", id)
}
