import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  normalizeQuickQuestionIndices,
  parseSettingBoolean,
  SETTING_DNA_RAPIDO_BUTTON,
  SETTING_DNA_RAPIDO_QUESTIONS,
} from "@/lib/app-settings"
import { QUESTIONS } from "@/lib/dna-data"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [SETTING_DNA_RAPIDO_BUTTON, SETTING_DNA_RAPIDO_QUESTIONS])

    if (error) {
      console.error("[settings/public]", error.message)
      return NextResponse.json({
        dnaRapidoEnabled: false,
        quickQuestionIndices: normalizeQuickQuestionIndices(null, QUESTIONS.length),
      })
    }

    const byKey = new Map((data || []).map(r => [r.key, r.value]))

    return NextResponse.json({
      dnaRapidoEnabled: parseSettingBoolean(byKey.get(SETTING_DNA_RAPIDO_BUTTON)),
      quickQuestionIndices: normalizeQuickQuestionIndices(
        byKey.get(SETTING_DNA_RAPIDO_QUESTIONS),
        QUESTIONS.length
      ),
    })
  } catch {
    return NextResponse.json({
      dnaRapidoEnabled: false,
      quickQuestionIndices: normalizeQuickQuestionIndices(null, QUESTIONS.length),
    })
  }
}
