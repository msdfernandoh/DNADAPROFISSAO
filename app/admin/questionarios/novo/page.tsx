"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { G } from "@/lib/dna-data"
import {
  QuestionnaireAdminShell,
  inputStyle,
  labelStyle,
  useAdminGate,
} from "@/components/questionnaire-admin/shell"
import { normalizeSlug } from "@/lib/questionnaire-platform/validators"

export default function NewQuestionnairePage() {
  const ready = useAdminGate()
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    scoring_mode: "per_question" as "per_question" | "normalized_sum",
    active: true,
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : normalizeSlug(name),
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v2/admin/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          scoring_mode: form.scoring_mode,
          active: form.active,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Erro ao salvar.")
        return
      }
      router.push(`/admin/questionarios/${json.data.id}`)
    } catch {
      setError("Falha de rede.")
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: G.navy }}>
        <div className="text-sm" style={{ color: G.gray }}>
          Verificando acesso…
        </div>
      </div>
    )
  }

  return (
    <QuestionnaireAdminShell title="Novo questionário" subtitle="Status inicial: draft">
      <form
        onSubmit={submit}
        className="rounded-2xl p-6 space-y-4 max-w-xl"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        {error ? (
          <p className="text-sm p-2 rounded" style={{ background: "#FB923C22", color: "#FB923C" }}>
            {error}
          </p>
        ) : null}

        <div>
          <div style={labelStyle}>Nome *</div>
          <input
            required
            value={form.name}
            onChange={e => onNameChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={labelStyle}>Slug *</div>
          <input
            required
            value={form.slug}
            onChange={e => {
              setSlugTouched(true)
              setForm(f => ({ ...f, slug: normalizeSlug(e.target.value) }))
            }}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={labelStyle}>Descrição</div>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={labelStyle}>Modo de pontuação</div>
          <select
            value={form.scoring_mode}
            onChange={e =>
              setForm(f => ({
                ...f,
                scoring_mode: e.target.value as "per_question" | "normalized_sum",
              }))
            }
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="per_question">per_question (compatível V1)</option>
            <option value="normalized_sum">normalized_sum</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm" style={{ color: G.gray }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          />
          Ativo
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
            style={{ background: G.gold, color: G.navy }}
          >
            {saving ? "Salvando…" : "Criar questionário"}
          </button>
          <Link
            href="/admin/questionarios"
            className="px-5 py-2 rounded-lg text-sm"
            style={{ border: `1px solid ${G.grayDark}` }}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </QuestionnaireAdminShell>
  )
}
