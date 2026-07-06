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
import {
  normalizeProfileCode,
  type QuestionnaireProfileRow,
  type QuestionnaireRow,
} from "@/lib/questionnaire-platform/validators"

const emptyForm = {
  code: "",
  name: "",
  short_description: "",
  long_description: "",
  color: "#C9A84C",
  icon: "",
  sort_order: 0,
  active: true,
}

export default function QuestionnaireProfilesPage() {
  const ready = useAdminGate()
  const params = useParams()
  const questionnaireId = params.id as string

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireRow | null>(null)
  const [profiles, setProfiles] = useState<QuestionnaireProfileRow[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, pRes] = await Promise.all([
        fetch(`/api/v2/admin/questionnaires/${questionnaireId}`),
        fetch(`/api/v2/admin/questionnaires/${questionnaireId}/profiles`),
      ])
      const qJson = await qRes.json()
      const pJson = await pRes.json()
      if (qRes.ok) setQuestionnaire(qJson.data)
      if (pRes.ok) setProfiles(pJson.data ?? [])
      else setMsg({ type: "err", text: pJson.error || "Erro ao listar perfis." })
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  useEffect(() => {
    if (ready && questionnaireId) load()
  }, [ready, questionnaireId, load])

  const resetForm = () => {
    setEditingId(null)
    const nextOrder =
      profiles.length > 0 ? Math.max(...profiles.map(p => p.sort_order)) + 1 : 0
    setForm({ ...emptyForm, sort_order: nextOrder })
  }

  const startEdit = (p: QuestionnaireProfileRow) => {
    setEditingId(p.id)
    setForm({
      code: p.code,
      name: p.name,
      short_description: p.short_description || "",
      long_description: p.long_description || "",
      color: p.color || "#C9A84C",
      icon: p.icon || "",
      sort_order: p.sort_order,
      active: p.active,
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const payload = {
        ...form,
        code: normalizeProfileCode(form.code),
        sort_order: Number(form.sort_order),
      }
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/profiles`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao salvar." })
        return
      }
      setMsg({ type: "ok", text: editingId ? "Perfil atualizado." : "Perfil criado." })
      resetForm()
      load()
    } catch {
      setMsg({ type: "err", text: "Falha de rede." })
    } finally {
      setSaving(false)
    }
  }

  const inactivate = async (profileId: string, name: string) => {
    if (!confirm(`Inativar perfil "${name}"?`)) return
    const res = await fetch(
      `/api/v2/admin/questionnaires/${questionnaireId}/profiles?profileId=${profileId}`,
      { method: "DELETE" }
    )
    const json = await res.json()
    if (!res.ok) {
      setMsg({ type: "err", text: json.error || "Erro ao inativar." })
      return
    }
    setMsg({ type: "ok", text: "Perfil inativado." })
    load()
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
      title={`Perfis — ${questionnaire?.name ?? "…"}`}
      subtitle="Códigos únicos por questionário (ex.: LID, COM)"
    >
      <Link
        href={`/admin/questionarios/${questionnaireId}`}
        className="inline-block text-sm mb-4"
        style={{ color: G.goldLight }}
      >
        ← Voltar ao questionário
      </Link>

      <form
        onSubmit={submit}
        className="rounded-2xl p-6 space-y-3 mb-8 max-w-2xl"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <h2 className="font-semibold text-sm" style={{ color: G.gold }}>
          {editingId ? "Editar perfil" : "Novo perfil"}
        </h2>

        {msg ? (
          <p
            className="text-sm p-2 rounded"
            style={{
              background: msg.type === "ok" ? `${G.gold}22` : "#FB923C22",
              color: msg.type === "ok" ? G.goldLight : "#FB923C",
            }}
          >
            {msg.text}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div style={labelStyle}>Código *</div>
            <input
              required
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: normalizeProfileCode(e.target.value) }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
              style={inputStyle}
              placeholder="LID"
            />
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
            <div style={labelStyle}>Ordem (sort_order)</div>
            <input
              type="number"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>Cor</div>
            <input
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              placeholder="#C9A84C"
            />
          </div>
          <div>
            <div style={labelStyle}>Ícone (emoji/texto)</div>
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm pb-2" style={{ color: G.gray }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              />
              Ativo
            </label>
          </div>
        </div>

        <div>
          <div style={labelStyle}>Descrição curta</div>
          <input
            value={form.short_description}
            onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={labelStyle}>Descrição longa</div>
          <textarea
            value={form.long_description}
            onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ background: G.gold, color: G.navy }}
          >
            {saving ? "Salvando…" : editingId ? "Atualizar" : "Adicionar perfil"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ border: `1px solid ${G.grayDark}` }}
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        {loading ? (
          <p className="p-6 text-sm" style={{ color: G.gray }}>
            Carregando perfis…
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${G.grayDark}`, color: G.gray }}>
                <th className="text-left p-3">Ordem</th>
                <th className="text-left p-3">Código</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Ativo</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center" style={{ color: G.gray }}>
                    Nenhum perfil cadastrado.
                  </td>
                </tr>
              ) : (
                profiles.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${G.grayDark}44`, opacity: p.active ? 1 : 0.5 }}>
                    <td className="p-3">{p.sort_order}</td>
                    <td className="p-3 font-mono" style={{ color: p.color || G.goldLight }}>
                      {p.icon ? `${p.icon} ` : ""}
                      {p.code}
                    </td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.active ? "Sim" : "Não"}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
                      >
                        Editar
                      </button>
                      {p.active ? (
                        <button
                          type="button"
                          onClick={() => inactivate(p.id, p.name)}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: "#FB923C22", border: "1px solid #FB923C66" }}
                        >
                          Inativar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </QuestionnaireAdminShell>
  )
}
