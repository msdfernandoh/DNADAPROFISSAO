import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { parseSettingBoolean, SETTING_DNA_RAPIDO_BUTTON } from "@/lib/app-settings"

const SESSION_COOKIE = "dna_admin_session"
const SESSION_VALUE = "authenticated"

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTING_DNA_RAPIDO_BUTTON)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      dnaRapidoButtonEnabled: parseSettingBoolean(data?.value),
    })
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
    const { dnaRapidoButtonEnabled } = body

    if (typeof dnaRapidoButtonEnabled !== "boolean") {
      return NextResponse.json(
        { error: "dnaRapidoButtonEnabled deve ser boolean" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          key: SETTING_DNA_RAPIDO_BUTTON,
          value: dnaRapidoButtonEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      dnaRapidoButtonEnabled: parseSettingBoolean(data?.value),
    })
  } catch (err) {
    console.error("[admin/settings PATCH]", err)
    return NextResponse.json({ error: "Falha ao salvar configurações" }, { status: 500 })
  }
}
