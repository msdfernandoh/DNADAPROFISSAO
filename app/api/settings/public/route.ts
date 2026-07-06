import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { parseSettingBoolean, SETTING_DNA_RAPIDO_BUTTON } from "@/lib/app-settings"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTING_DNA_RAPIDO_BUTTON)
      .maybeSingle()

    if (error) {
      console.error("[settings/public]", error.message)
      return NextResponse.json({ dnaRapidoEnabled: false })
    }

    return NextResponse.json({
      dnaRapidoEnabled: parseSettingBoolean(data?.value),
    })
  } catch {
    return NextResponse.json({ dnaRapidoEnabled: false })
  }
}
