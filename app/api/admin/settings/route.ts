import { createServiceClient as createClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { isAdminAuthed } from "@/lib/questionnaire-platform/auth"
import {
  DEFAULT_DNA_RAPIDO_QUESTION_INDICES,
  normalizeQuickQuestionIndices,
  parseSettingBoolean,
  SETTING_DNA_RAPIDO_BUTTON,
  SETTING_DNA_RAPIDO_QUESTIONS,
  validateQuickQuestionIndicesForSave,
} from "@/lib/app-settings"
import { QUESTIONS } from "@/lib/dna-data"

const isAuthed = isAdminAuthed

function mapSettingsRows(rows: { key: string; value: unknown }[] | null) {
  const byKey = new Map((rows || []).map(r => [r.key, r.value]))
  return {
    dnaRapidoButtonEnabled: parseSettingBoolean(byKey.get(SETTING_DNA_RAPIDO_BUTTON)),
    dnaRapidoQuestionIndices: normalizeQuickQuestionIndices(
      byKey.get(SETTING_DNA_RAPIDO_QUESTIONS),
      QUESTIONS.length
    ),
  }
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [SETTING_DNA_RAPIDO_BUTTON, SETTING_DNA_RAPIDO_QUESTIONS])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(mapSettingsRows(data))
  } catch (err) {
    console.error("[admin/settings GET]", err)
    return NextResponse.json({ error: "Falha ao carregar configurações" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = await createClient()

    if (body.restoreRecommendedQuestions === true) {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_DNA_RAPIDO_QUESTIONS,
          value: DEFAULT_DNA_RAPIDO_QUESTION_INDICES,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (typeof body.dnaRapidoButtonEnabled === "boolean") {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_DNA_RAPIDO_BUTTON,
          value: body.dnaRapidoButtonEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (body.dnaRapidoQuestionIndices !== undefined) {
      const validated = validateQuickQuestionIndicesForSave(
        body.dnaRapidoQuestionIndices,
        QUESTIONS.length
      )
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 })
      }
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_DNA_RAPIDO_QUESTIONS,
          value: validated.indices,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [SETTING_DNA_RAPIDO_BUTTON, SETTING_DNA_RAPIDO_QUESTIONS])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...mapSettingsRows(data) })
  } catch (err) {
    console.error("[admin/settings PATCH]", err)
    return NextResponse.json({ error: "Falha ao salvar configurações" }, { status: 500 })
  }
}
