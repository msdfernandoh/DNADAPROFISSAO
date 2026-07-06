"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { G } from "@/lib/dna-data"
import { BRAZIL_UFS } from "@/lib/brazil-ufs"
import { formatCityLabel } from "@/lib/city-utils"

interface CityRow {
  id: string
  name: string
  state: string
  created_at: string
}

export default function CidadesAdminPage() {
  const router = useRouter()
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [form, setForm] = useState({ name: "", state: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(j => {
        if (!j.authed) {
          router.push("/admin")
          return
        }
        setAuthChecked(true)
        load()
      })
      .catch(() => router.push("/admin"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/cities")
      const d = await r.json()
      setCities(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Nome da cidade é obrigatório." })
      return
    }
    if (!form.state) {
      setMsg({ type: "err", text: "Selecione a UF." })
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingId
      const r = await fetch("/api/cities", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg({ type: "err", text: d.error || "Erro ao salvar." })
      } else {
        setMsg({
          type: "ok",
          text: isEdit
            ? `Cidade "${formatCityLabel(d.name, d.state)}" atualizada.`
            : `Cidade "${formatCityLabel(d.name, d.state)}" cadastrada.`,
        })
        setForm({ name: "", state: "" })
        setEditingId(null)
        load()
      }
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 3500)
    }
  }

  const startEdit = (c: CityRow) => {
    setEditingId(c.id)
    setForm({ name: c.name, state: c.state })
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", state: "" })
  }

  const remove = async (id: string, label: string) => {
    if (!confirm(`Excluir "${label}"?`)) return
    const r = await fetch(`/api/cities?id=${id}`, { method: "DELETE" })
    const d = await r.json()
    if (!r.ok) {
      setMsg({ type: "err", text: d.error || "Erro ao excluir." })
      return
    }
    load()
  }

  const filtered = cities.filter(c => {
    if (!filter) return true
    const q = filter.toLowerCase()
    const label = formatCityLabel(c.name, c.state).toLowerCase()
    return label.includes(q) || c.state.toLowerCase().includes(q)
  })

  const inputStyle = {
    background: "#0F1429",
    border: `1px solid ${G.grayDark}55`,
    color: G.white,
  }

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: G.navy, color: G.gray }}
      >
        Verificando sessão...
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: G.navy, color: G.white }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="text-xs hover:underline" style={{ color: G.goldLight }}>
              ← Voltar para participantes
            </Link>
            <h1
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Cidades
            </h1>
            <p className="text-sm" style={{ color: G.gray }}>
              Cidades disponíveis no select do cadastro. A primeira opção do formulário é &quot;Outra&quot;,
              para quem não estiver na lista.
            </p>
          </div>
          <div
            className="rounded-lg px-4 py-2 text-center"
            style={{ background: `${G.gold}11`, border: `1px solid ${G.gold}33` }}
          >
            <div className="text-[10px]" style={{ color: G.gray }}>
              TOTAL
            </div>
            <div className="text-xl font-bold" style={{ color: G.goldLight }}>
              {cities.length}
            </div>
          </div>
        </div>

        {msg && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm"
            style={{
              background: msg.type === "ok" ? "#10B98122" : "#EF444422",
              border: `1px solid ${msg.type === "ok" ? "#10B981" : "#EF4444"}66`,
              color: msg.type === "ok" ? "#34D399" : "#FCA5A5",
            }}
          >
            {msg.text}
          </div>
        )}

        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "rgba(26,32,53,.7)", border: `1px solid ${G.grayDark}44` }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: G.goldLight }}>
            {editingId ? "Editar cidade" : "Cadastrar cidade"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[11px] tracking-wider" style={{ color: G.gray }}>
                CIDADE *
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: São Paulo"
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-[11px] tracking-wider" style={{ color: G.gray }}>
                ESTADO (UF) *
              </label>
              <select
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ ...inputStyle, color: form.state ? G.white : G.gray }}
              >
                <option value="">Selecione</option>
                {BRAZIL_UFS.map(uf => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="text-xs font-bold rounded-full px-6 py-2.5 disabled:opacity-50"
              style={{ background: G.gold, color: G.navy }}
            >
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-semibold rounded-full px-6 py-2.5"
                style={{ color: G.gray, border: `1px solid ${G.grayDark}` }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Buscar cidade ou UF..."
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${G.grayDark}44` }}
        >
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: G.gray }}>
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: G.gray }}>
              {cities.length === 0
                ? "Nenhuma cidade cadastrada. Adicione acima ou deixe só a opção Outra no formulário."
                : "Nenhum resultado para a busca."}
            </div>
          ) : (
            <ul>
              {filtered.map(c => {
                const label = formatCityLabel(c.name, c.state)
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    style={{
                      background: "rgba(26,32,53,.5)",
                      borderBottom: `1px solid ${G.grayDark}33`,
                    }}
                  >
                    <span>{label}</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                        style={{ color: G.goldLight, border: `1px solid ${G.gold}44` }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.id, label)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                        style={{ color: "#FCA5A5", border: `1px solid #EF444444` }}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
