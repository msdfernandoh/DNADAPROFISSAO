import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeVendorSlug } from "@/lib/vendor-utils"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("slug") || searchParams.get("v") || ""
  const slug = normalizeVendorSlug(raw)

  if (!slug) {
    return NextResponse.json({ error: "slug é obrigatório" }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sales_vendors")
      .select("name, slug, phone, active")
      .eq("slug", slug)
      .maybeSingle()

    if (error) {
      console.error("[vendors/public]", error.message)
      return NextResponse.json({ vendor: null })
    }

    if (!data || !data.active) {
      return NextResponse.json({ vendor: null })
    }

    return NextResponse.json({
      vendor: {
        name: data.name,
        slug: data.slug,
        phone: data.phone,
      },
    })
  } catch {
    return NextResponse.json({ vendor: null })
  }
}
