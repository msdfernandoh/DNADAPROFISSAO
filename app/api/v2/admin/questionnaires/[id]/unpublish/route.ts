import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/questionnaire-platform/auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data: existing, error: fetchErr } = await supabase
      .from("questionnaires")
      .select("id, status")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: "Questionário não encontrado." }, { status: 404 })
    }

    if (existing.status !== "published") {
      return NextResponse.json(
        { error: "Questionário não está publicado.", status: existing.status },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("questionnaires")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v2] unpublish POST:", err)
    return NextResponse.json({ error: "Falha ao voltar para rascunho" }, { status: 500 })
  }
}
