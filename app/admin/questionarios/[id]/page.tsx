"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { G } from "@/lib/dna-data"
import {
  QuestionnaireAdminShell,
  inputStyle,
  labelStyle,
  useAdminGate,
} from "@/components/questionnaire-admin/shell"
import { normalizeSlug, type QuestionnaireRow } from "@/lib/questionnaire-platform/validators"
import type { PublishChecklistItem } from "@/lib/questionnaire-engine/publish-checklist"

const statusColor = (status: PublishChecklistItem["status"]) => {
  if (status === "ok") return { bg: "#22C55E22", border: "#22C55E55", text: "#86EFAC" }
  if (status === "warning") return { bg: `${G.gold}22`, border: `${G.gold}55`, text: G.goldLight }
  return { bg: "#FB923C22", border: "#FB923C55", text: "#FB923C" }
}

export default function QuestionnaireDetailPage() {
  const ready = useAdminGate()
  const params = useParams()
  const id = params.id as string

  const [item, setItem] = useState<QuestionnaireRow | null>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    scoring_mode: "per_question" as "per_question" | "normalized_sum",
    active: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [checklist, setChecklist] = useState<{
    canPublish: boolean
    errors: string[]
    warnings: string[]
    items: PublishChecklistItem[]
    simulation?: { mainProfile: string; secondaryProfile: string; resultCode: string }
  } | null>(null)
  const [checking, setChecking] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Não encontrado." })
        return
      }
      const q = json.data as QuestionnaireRow
      setItem(q)
      setForm({
        name: q.name,
        slug: q.slug,
        description: q.description || "",
        scoring_mode: q.scoring_mode,
        active: q.active,
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (ready && id) load()
  }, [ready, id, load])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: normalizeSlug(form.slug),
          description: form.description,
          scoring_mode: form.scoring_mode,
          active: form.active,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao salvar." })
        return
      }
      setItem(json.data)
      setMsg({ type: "ok", text: "Salvo com sucesso." })
    } catch {
      setMsg({ type: "err", text: "Falha de rede." })
    } finally {
      setSaving(false)
    }
  }

  const verifyPublish = async () => {
    setChecking(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${id}/publish`)
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao verificar." })
        setChecklist(null)
        return
      }
      setChecklist(json.data)
    } catch {
      setMsg({ type: "err", text: "Falha de rede ao verificar." })
    } finally {
      setChecking(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${id}/publish`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        if (json.data) setChecklist(json.data)
        setMsg({
          type: "err",
          text: json.errors?.length
            ? json.errors.slice(0, 3).join(" · ")
            : json.error || "Não foi possível publicar.",
        })
        return
      }
      setItem(json.data)
      setChecklist(json.checklist ?? null)
      setMsg({ type: "ok", text: "Questionário publicado." })
    } catch {
      setMsg({ type: "err", text: "Falha de rede ao publicar." })
    } finally {
      setPublishing(false)
    }
  }

  const unpublish = async () => {
    setUnpublishing(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${id}/unpublish`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao voltar para rascunho." })
        return
      }
      setItem(json.data)
      setChecklist(null)
      setMsg({ type: "ok", text: "Status alterado para rascunho." })
    } catch {
      setMsg({ type: "err", text: "Falha de rede." })
    } finally {
      setUnpublishing(false)
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
    <QuestionnaireAdminShell
      title={item?.name ?? "Questionário"}
      subtitle={item ? `${item.status} · v${item.version}` : "Carregando…"}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/admin/questionarios/${id}/perfis`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.purpleVib}33`, border: `1px solid ${G.purpleVib}55` }}
        >
          Perfis
        </Link>
        <Link
          href={`/admin/questionarios/${id}/perguntas`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}55`, color: G.goldLight }}
        >
          Perguntas
        </Link>
        <Link
          href={`/admin/questionarios/${id}/leads`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.purpleVib}22`, border: `1px solid ${G.purpleVib}55`, color: "#E9D5FF" }}
        >
          Leads
        </Link>
        <Link
          href={`/admin/questionarios/${id}/relatorio`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.gold}18`, border: `1px solid ${G.gold}55`, color: G.goldLight }}
        >
          Relatório (textos)
        </Link>
        <Link
          href={`/admin/questionarios/${id}/preview`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: "#22C55E18", border: "1px solid #22C55E55", color: "#86EFAC" }}
        >
          Preview HTML
        </Link>
      </div>

      {loading ? (
        <p style={{ color: G.gray }}>Carregando…</p>
      ) : (
        <>
        {msg ? (
          <p
            className="text-sm p-2 rounded mb-4 max-w-xl"
            style={{
              background: msg.type === "ok" ? `${G.gold}22` : "#FB923C22",
              color: msg.type === "ok" ? G.goldLight : "#FB923C",
            }}
          >
            {msg.text}
          </p>
        ) : null}
        <section
          className="rounded-2xl p-6 mb-6 max-w-xl space-y-4"
          style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
        >
          <h2 className="text-sm font-semibold text-white">Publicação</h2>
          <p className="text-xs" style={{ color: G.gray }}>
            O questionário só pode ser publicado se passar na validação técnica (perfis, perguntas, pesos e
            simulação do motor).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={verifyPublish}
              disabled={checking}
              className="text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              style={{ background: `${G.purpleVib}44`, border: `1px solid ${G.purpleVib}`, color: "#fff" }}
            >
              {checking ? "Verificando…" : "Verificar publicação"}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || item?.status === "published"}
              className="text-sm px-4 py-2 rounded-lg disabled:opacity-50 font-semibold"
              style={{ background: G.gold, color: G.navy }}
            >
              {publishing ? "Publicando…" : "Publicar questionário"}
            </button>
            {item?.status === "published" ? (
              <button
                type="button"
                onClick={unpublish}
                disabled={unpublishing}
                className="text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ border: `1px solid ${G.grayDark}`, color: G.gray }}
              >
                {unpublishing ? "Salvando…" : "Voltar para rascunho"}
              </button>
            ) : null}
          </div>

          {checklist ? (
            <div className="space-y-2 pt-2">
              <div className="text-xs" style={{ color: checklist.canPublish ? "#86EFAC" : "#FB923C" }}>
                {checklist.canPublish
                  ? "Pronto para publicar."
                  : "Corrija os itens em vermelho antes de publicar."}
              </div>
              {checklist.simulation ? (
                <p className="text-xs font-mono" style={{ color: G.gray }}>
                  Simulação: {checklist.simulation.resultCode} (main {checklist.simulation.mainProfile}, sec{" "}
                  {checklist.simulation.secondaryProfile})
                </p>
              ) : null}
              <ul className="space-y-1.5">
                {checklist.items.map(it => {
                  const c = statusColor(it.status)
                  return (
                    <li
                      key={it.key}
                      className="text-xs px-3 py-2 rounded-lg flex justify-between gap-2"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                    >
                      <span>{it.label}</span>
                      {it.detail ? (
                        <span className="opacity-80 text-right shrink-0 max-w-[50%] truncate" title={it.detail}>
                          {it.detail}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              {checklist.warnings.length > 0 ? (
                <div className="text-xs pt-1" style={{ color: G.goldLight }}>
                  Avisos: {checklist.warnings.join(" · ")}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <form
          onSubmit={save}
          className="rounded-2xl p-6 space-y-4 max-w-xl"
          style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
        >
          <div className="text-xs" style={{ color: G.gray }}>
            Status: <strong className="text-white">{item?.status}</strong>
            {item?.status === "published" ? (
              <span> · use &quot;Voltar para rascunho&quot; para editar e republicar.</span>
            ) : null}
          </div>

          <div>
            <div style={labelStyle}>Nome *</div>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={labelStyle}>Slug *</div>
            <input
              required
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: normalizeSlug(e.target.value) }))}
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
              <option value="per_question">per_question</option>
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
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
            <Link href="/admin/questionarios" className="px-5 py-2 rounded-lg text-sm" style={{ border: `1px solid ${G.grayDark}` }}>
              Voltar
            </Link>
          </div>
        </form>
        </>
      )}
    </QuestionnaireAdminShell>
  )
}
